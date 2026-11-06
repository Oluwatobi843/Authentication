
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

// Per-process IP protection supplements persisted OTP/login limits.

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly windows = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ ip?: string; socket: { remoteAddress?: string } }>();

    const now = Date.now();

    for (const [key, value] of this.windows) {
      if (value.expiresAt <= now) {
        this.windows.delete(key);
      }
    }

    const key = request.ip || request.socket.remoteAddress || 'unknown';

    const window = this.windows.get(key) || {
      count: 0,
      expiresAt: now + 60_000,
    };

    if (
      window.count >= 30 ||
      (!this.windows.has(key) && this.windows.size >= 10_000)
    ) {
      context
        .switchToHttp()
        .getResponse()
        .setHeader('Retry-After', '60');

      throw new HttpException(
        'Too many authentication requests. Try again in one minute',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    window.count += 1;
    this.windows.set(key, window);

    return true;
  }
}
