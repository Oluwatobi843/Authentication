import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { randomBytes, randomInt, createHash, timingSafeEqual } from 'crypto';

import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

import { UsersService } from '../user-profile/users.service.js';
import { EmailService } from '../common/email/email.service.js';

import { UserRole } from './enums/user-role.enum.js';
import { UserStatus } from './enums/user-status.enum.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserInvitation } from './entities/user-invitation.entity.js';
import { InvitationStatus } from './enums/invitation-status.enum.js';

import { InvitationHelper } from './helpers/invitation.helper.js';

import { InviteUserDto } from './dto/invite-user.dto.js';
import { VerifyInvitationDto } from './dto/verify-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

@Injectable()
export class AuthService {
  constructor(
  private readonly usersService: UsersService,
  private readonly emailService: EmailService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly invitationHelper: InvitationHelper,

  @InjectRepository(UserInvitation)
  private readonly invitationRepository: Repository<UserInvitation>,
) {}



//  Register

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      12,
    );

    // Generate a secure six-digit OTP
    const verificationOtp = randomInt(100000, 1000000).toString();

    // Hash OTP before storing it
    const hashedOtp = createHash('sha256')
      .update(verificationOtp)
      .digest('hex');

    // OTP expires after 10 minutes
    const verificationExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    // Create user
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      phoneNumber: registerDto.phoneNumber ?? null,
      role: UserRole.USER,
      status: UserStatus.PENDING,
      emailVerified: false,
      emailVerificationOtpHash: hashedOtp,
      emailVerificationExpiresAt: verificationExpiresAt,
    });

    // Send OTP to user's email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationOtp,
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
    };
  }

// Verification Email with OTP

  async verifyEmail(verifyOtpDto: VerifyOtpDto) {
    // Find user and explicitly retrieve the hidden OTP hash
    const user = await this.usersService.findByEmailWithVerificationOtp(
      verifyOtpDto.email,
    );

    if (!user) {
      throw new ConflictException('Invalid or expired OTP');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    // Check OTP expiration
    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() <= Date.now()
    ) {
      throw new ConflictException('Invalid or expired OTP');
    }

    if (
      !user.emailVerificationOtpHash ||
      !/^[a-f0-9]{64}$/i.test(user.emailVerificationOtpHash)
    ) {
      throw new ConflictException('Invalid or expired OTP');
    }

    // Hash submitted OTP
    const submittedOtpHash = createHash('sha256')
      .update(verifyOtpDto.otp)
      .digest('hex');

    // Compare hashes safely
    const storedHash = Buffer.from(
      user.emailVerificationOtpHash,
      'hex',
    );

    const submittedHash = Buffer.from(
      submittedOtpHash,
      'hex',
    );

    if (!timingSafeEqual(storedHash, submittedHash)) {
      throw new ConflictException('Invalid or expired OTP');
    }

    // Activate account
    user.emailVerified = true;
    user.status = UserStatus.ACTIVE;

    // Clear OTP after successful verification
    user.emailVerificationOtpHash = null;
    user.emailVerificationExpiresAt = null;

    await this.usersService.update(user);

    return {
      message: 'Email verified successfully. Your account is now active.',
    };
  }

//  Resend Verification OTP

  async resendVerificationEmail(resendOtpDto: ResendOtpDto) {
    const user = await this.usersService.findByEmail(
      resendOtpDto.email,
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

    // Generate a fresh six-digit OTP
    const verificationOtp = randomInt(100000, 1000000).toString();

    // Hash OTP before storing it
    const hashedOtp = createHash('sha256')
      .update(verificationOtp)
      .digest('hex');

    // OTP expires after 10 minutes
    const verificationExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    user.emailVerificationOtpHash = hashedOtp;
    user.emailVerificationExpiresAt = verificationExpiresAt;

    await this.usersService.update(user);

    // Send new OTP
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationOtp,
    );

    return {
      message: 'Verification OTP sent successfully. Please check your inbox.',
    };
  }

//  Login

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Your account is not active',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

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

    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;

    await this.usersService.update(user);

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

// Refresh Token

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken;

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

    const user = await this.usersService.findByIdWithRefreshToken(
      payload.sub,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (
      !user.emailVerified ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'Your account is not active',
      );
    }

    if (
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const submittedTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

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

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

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

    user.refreshTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

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

    return {
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

// Forgot Password

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(
      forgotPasswordDto.email,
    );

    const successResponse = {
      message:
        'If an account exists with this email, a password reset link will be sent.',
    };

    if (!user || !user.emailVerified) {
      return successResponse;
    }

    const resetToken = randomBytes(32).toString('hex');

    user.passwordResetToken = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.usersService.update(user);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
    );

    return successResponse;
  }

// Reset Password

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const hashedToken = createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.usersService.findByPasswordResetToken(
      hashedToken,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      12,
    );

    user.password = hashedPassword;

    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;

    // Revoke existing refresh tokens
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    await this.usersService.update(user);

    return {
      message:
        'Password reset successful. Please log in with your new password.',
    };
  }

  
  // Invite User
  async inviteUser(inviterId: string, inviteUserDto: InviteUserDto) {
    // Retrieve the user sending the invitation
    const inviter = await this.usersService.findById(inviterId);

    if (!inviter) {
      throw new UnauthorizedException('User not found');
    }

    // Only administrators can invite users
    if (inviter.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can invite users',
      );
    }

    const email = inviteUserDto.email.trim().toLowerCase();

    // Check whether the email already belongs to a user
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Revoke an older pending invitation for this email
    const previousInvitation = await this.invitationRepository.findOne({
      where: {
        email,
        status: InvitationStatus.PENDING,
      },
    });

    if (previousInvitation) {
      previousInvitation.status = InvitationStatus.REVOKED;
      await this.invitationRepository.save(previousInvitation);
    }

    // Generate secure invitation token
    const invitationToken =
      this.invitationHelper.generateInvitationToken();

    const tokenHash =
      this.invitationHelper.hashInvitationToken(invitationToken);

    // Create invitation
    const invitation = this.invitationRepository.create({
      email,
      tokenHash,
      role: inviteUserDto.role ?? UserRole.USER,
      status: InvitationStatus.PENDING,
      invitedById: inviter.id,
      expiresAt: this.invitationHelper.getInvitationExpiry(),
    });

    await this.invitationRepository.save(invitation);

    // Send invitation email
    await this.emailService.sendInvitationEmail(
      email,
      invitationToken,
      `${inviter.firstName} ${inviter.lastName}`,
      invitation.role,
    );

    return {
      message: 'User invitation sent successfully',
      data: {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  // Verify Invitation
  async verifyInvitation(dto: VerifyInvitationDto) {
    const tokenHash =
      this.invitationHelper.hashInvitationToken(
        dto.invitationToken,
      );

    const invitation = await this.invitationRepository
      .createQueryBuilder('invitation')
      .addSelect('invitation.tokenHash')
      .where('invitation.email = :email', {
        email: dto.email.trim().toLowerCase(),
      })
      .andWhere('invitation.tokenHash = :tokenHash', {
        tokenHash,
      })
      .getOne();

    if (
      !invitation ||
      invitation.status !== InvitationStatus.PENDING
    ) {
      throw new UnauthorizedException(
        'Invalid or expired invitation',
      );
    }

    if (
      this.invitationHelper.isInvitationExpired(
        invitation.expiresAt,
      )
    ) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);

      throw new UnauthorizedException(
        'Invitation has expired',
      );
    }

    return {
      message: 'Invitation verified successfully',
      data: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  // Accept Invitation and Create Account
  async acceptInvitation(dto: AcceptInvitationDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    const tokenHash =
      this.invitationHelper.hashInvitationToken(
        dto.invitationToken,
      );

    const invitation = await this.invitationRepository
      .createQueryBuilder('invitation')
      .addSelect('invitation.tokenHash')
      .where('invitation.tokenHash = :tokenHash', {
        tokenHash,
      })
      .getOne();

    if (
      !invitation ||
      invitation.status !== InvitationStatus.PENDING
    ) {
      throw new UnauthorizedException(
        'Invalid or expired invitation',
      );
    }

    if (
      this.invitationHelper.isInvitationExpired(
        invitation.expiresAt,
      )
    ) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);

      throw new UnauthorizedException(
        'Invitation has expired',
      );
    }

    // Ensure the invited email has not already registered
    const existingUser = await this.usersService.findByEmail(
      invitation.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create active, verified account
    const user = await this.usersService.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: invitation.email,
      password: hashedPassword,
      phoneNumber: null,
      role: invitation.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerificationOtpHash: null,
      emailVerificationExpiresAt: null,
    });

    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();

    await this.invitationRepository.save(invitation);

    return {
      message: 'Invitation accepted successfully. Your account has been created.',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }



  // logout
  
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
