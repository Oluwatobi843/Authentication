import { UserRole } from '../enums/user-role.enum.js';

export type TokenPurpose =
  | 'access'
  | 'refresh'
  | 'registration'
  | 'password-reset'
  | 'invitation';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: TokenPurpose;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phoneNumber: string | null;
  isVerified: boolean;
  createdAt: string | null;
}