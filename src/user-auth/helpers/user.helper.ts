import { Injectable } from '@nestjs/common';

import type { User } from '../entities/user.entity.js';
import type { UserResponse } from '../interfaces/user.interface.js';

@Injectable()
export class UserHelper {
  formatUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      phoneNumber: user.phoneNumber,
      isVerified: user.emailVerified,
      createdAt: user.createdAt?.toISOString() ?? null,
    };
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}