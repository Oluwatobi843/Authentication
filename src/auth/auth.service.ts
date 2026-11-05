import {
  ConflictException,
  Injectable,
   UnauthorizedException,
} from '@nestjs/common';

// import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto.js';

import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { UserStatus } from '../users/enums/user-status.enum.js';
// import { createHash } from 'crypto';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { EmailService } from '../common/email/email.service.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
     private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      12,
    );

    // Generate a secure email verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Hash the verification token before storing it
    const hashedVerificationToken = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Set verification token expiration to 30 minutes
    const verificationExpiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    // Create the user
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      phoneNumber: registerDto.phoneNumber ?? null,
      role: UserRole.USER,
      status: UserStatus.PENDING,
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiresAt: verificationExpiresAt,

      
    });

    await this.emailService.sendVerificationEmail(
  user.email, 
  verificationToken,
);

    return {
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
      },
      verificationToken,
    };
  }

  
async verifyEmail(verifyEmailDto: VerifyEmailDto) {
  // Hash the token submitted by the user
  const hashedToken = createHash('sha256')
    .update(verifyEmailDto.token)
    .digest('hex');

  // Find the user with the matching verification token
  const user = await this.usersService.findByVerificationToken(
    hashedToken,
  );

  if (!user) {
    throw new ConflictException(
      'Invalid or expired verification token',
    );
  }

  // Check whether the verification token has expired
  if (
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt.getTime() < Date.now()
  ) {
    throw new ConflictException(
      'Invalid or expired verification token',
    );
  }

  // Prevent unnecessary verification of an already verified account
  if (user.emailVerified) {
    throw new ConflictException('Email already verified');
  }

  // Activate the user's account
  user.emailVerified = true;
  user.status = UserStatus.ACTIVE;

  // Remove the verification token after successful verification
  user.emailVerificationToken = null;
  user.emailVerificationExpiresAt = null;

  await this.usersService.update(user);

  return {
    message: 'Email verified successfully. Your account is now active.',
  };
}

async resendVerificationEmail(
  resendVerificationDto: ResendVerificationDto,
) {
  const user = await this.usersService.findByEmail(
    resendVerificationDto.email,
  );

  if (!user) {
    throw new ConflictException(
      'Unable to process verification request',
    );
  }

  if (user.emailVerified) {
    throw new ConflictException(
      'Email address is already verified',
    );
  }

  const verificationToken = randomBytes(32).toString('hex');

  const hashedVerificationToken = createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  const verificationExpiresAt = new Date(
    Date.now() + 30 * 60 * 1000,
  );

  user.emailVerificationToken = hashedVerificationToken;
  user.emailVerificationExpiresAt = verificationExpiresAt;

  await this.usersService.update(user);

  await this.emailService.sendVerificationEmail(
    user.email,
    verificationToken,
  );

  return {
    message: 'Verification email sent successfully. Please check your inbox.',
  };
}

async login(loginDto: LoginDto) {
  // 1. Find the user, including their password hash
  const user = await this.usersService.findByEmailWithPassword(
    loginDto.email,
  );

  // 2. Check whether the user exists and the password is correct
  if (
    !user ||
    !(await bcrypt.compare(loginDto.password, user.password))
  ) {
    throw new UnauthorizedException('Invalid email or password');
  }

  // 3. Ensure the user's email has been verified
  if (!user.emailVerified) {
    throw new UnauthorizedException(
      'Please verify your email before logging in',
    );
  }

  // 4. Ensure the account is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedException(
      'Your account is not active',
    );
  }

  // 5. Prepare the JWT payload
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  // 6. Generate access and refresh tokens
  const accessToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.getOrThrow<string>(
      'ACCESS_TOKEN_SECRET',
    ),
    expiresIn: this.configService.getOrThrow<string>(
      'ACCESS_TOKEN_EXPIRES_IN',
    ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.getOrThrow<string>(
      'REFRESH_TOKEN_SECRET',
    ),
    expiresIn: this.configService.getOrThrow<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
    ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });

  // 7. Hash the refresh token before storing it
  const refreshTokenHash = createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // 8. Set refresh token expiration
  const refreshTokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;

  await this.usersService.update(user);

  // 9. Return authentication details
  return {
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    },
  };
}


async refresh(refreshTokenDto: RefreshTokenDto) {
  const refreshToken = refreshTokenDto.refreshToken;

  // 1. Verify the refresh token
  let payload: {
    sub: string;
    email: string;
    role: UserRole;
    exp?: number;
  };

  try {
    payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_SECRET',
      ),
    });
  } catch {
    throw new UnauthorizedException(
      'Invalid or expired refresh token',
    );
  }

  // 2. Find the user and retrieve their stored refresh token hash
  const user = await this.usersService.findByIdWithRefreshToken(
    payload.sub,
  );

  if (!user) {
    throw new UnauthorizedException(
      'Invalid or expired refresh token',
    );
  }

  // 3. Check account status
  if (
    !user.emailVerified ||
    user.status !== UserStatus.ACTIVE
  ) {
    throw new UnauthorizedException(
      'Your account is not active',
    );
  }

  // 4. Check whether a refresh token exists in the database
  if (
    !user.refreshTokenHash ||
    !user.refreshTokenExpiresAt ||
    user.refreshTokenExpiresAt.getTime() < Date.now()
  ) {
    throw new UnauthorizedException(
      'Invalid or expired refresh token',
    );
  }

  // 5. Hash the submitted refresh token
  const submittedTokenHash = createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // 6. Compare submitted token hash with stored hash
  const storedHash = Buffer.from(user.refreshTokenHash, 'hex');
  const submittedHash = Buffer.from(submittedTokenHash, 'hex');

  if (
    storedHash.length !== submittedHash.length ||
    !timingSafeEqual(storedHash, submittedHash)
  ) {
    throw new UnauthorizedException(
      'Invalid or expired refresh token',
    );
  }

  // 7. Prepare a new JWT payload
  const newPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  // 8. Generate new access and refresh tokens
  const accessToken = await this.jwtService.signAsync(
    newPayload,
    {
      secret: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_SECRET',
      ),
      expiresIn: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_EXPIRES_IN',
      ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
    },
  );

  const newRefreshToken = await this.jwtService.signAsync(
    newPayload,
    {
      secret: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_SECRET',
      ),
      expiresIn: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_EXPIRES_IN',
      ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
    },
  );

  // 9. Hash the new refresh token
  user.refreshTokenHash = createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');

  // Use the JWT's actual expiry rather than hardcoding seven days
  const newTokenPayload = await this.jwtService.verifyAsync(
    newRefreshToken,
    {
      secret: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_SECRET',
      ),
    },
  );

  user.refreshTokenExpiresAt = new Date(
    newTokenPayload.exp * 1000,
  );

  await this.usersService.update(user);

  // 10. Return the new authentication details
  return {
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  };
}

async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  const user = await this.usersService.findByEmail(
    forgotPasswordDto.email,
  );

  // Always return a generic response to prevent account enumeration
  const successResponse = {
    message:
      'If an account exists with this email, a password reset link will be sent.',
  };

  if (!user || !user.emailVerified) {
    return successResponse;
  }

  // Generate a cryptographically secure reset token
  const resetToken = randomBytes(32).toString('hex');

  // Store only the hashed token
  user.passwordResetToken = createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires after 15 minutes
  user.passwordResetExpiresAt = new Date(
    Date.now() + 15 * 60 * 1000,
  );

  await this.usersService.update(user);

  // Send the raw token to the user's email
  await this.emailService.sendPasswordResetEmail(
    user.email,
    resetToken,
  );

  return successResponse;
}

async resetPassword(resetPasswordDto: ResetPasswordDto) {
  // 1. Hash the submitted reset token
  const hashedToken = createHash('sha256')
    .update(resetPasswordDto.token)
    .digest('hex');

  // 2. Find the user with the matching reset token
  const user = await this.usersService.findByPasswordResetToken(
    hashedToken,
  );

  if (!user) {
    throw new UnauthorizedException(
      'Invalid or expired password reset token',
    );
  }

  // 3. Check whether the reset token has expired
  if (
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() < Date.now()
  ) {
    throw new UnauthorizedException(
      'Invalid or expired password reset token',
    );
  }

  // 4. Hash the new password
  const hashedPassword = await bcrypt.hash(
    resetPasswordDto.newPassword,
    12,
  );

  // 5. Update the password
  user.password = hashedPassword;

  // 6. Invalidate the reset token
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;

  // 7. Revoke existing refresh tokens
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;

  // 8. Save the changes
  await this.usersService.update(user);

  return {
    message:
      'Password reset successful. Please log in with your new password.',
  };
}

async logout(userId: string) {
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;

  await this.usersService.update(user);

  return {
    message: 'Logout successful',
  };
}
}