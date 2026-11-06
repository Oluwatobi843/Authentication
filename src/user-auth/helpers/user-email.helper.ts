import { Injectable } from '@nestjs/common';
import { createHash, randomInt, randomBytes } from 'node:crypto';

@Injectable()
export class UserEmailHelper {
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  generateVerificationOtpHash(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  generatePasswordResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  generatePasswordResetTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}