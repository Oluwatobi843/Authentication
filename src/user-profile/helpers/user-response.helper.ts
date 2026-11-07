import { User } from '../../user-auth/entities/user.entity.js';
import type { UserResponse } from '../../user-auth/interfaces/user.interface.js';

export function toUserResponse(user: User): UserResponse {
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