import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class InvitationHelper {
  generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getInvitationExpiry(): Date {
    const expiry = new Date();

    expiry.setHours(expiry.getHours() + 24);

    return expiry;
  }

  isInvitationExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() <= Date.now();
  }
}