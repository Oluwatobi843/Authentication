
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

import { InviteUserDto } from './dto/invite-user.dto.js';
import { VerifyInvitationDto } from './dto/verify-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

import { Roles } from './decorators/roles.decorator.js';
import { Public } from './decorators/public.decorator.js';

import { UserRole } from './enums/user-role.enum.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Verify Email
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmail(verifyOtpDto);
  }

  // Resend Verification OTP
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendVerificationEmail(resendOtpDto);
  }

  // Login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Refresh Token
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  // Forgot Password
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // Reset Password
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // Invite User (ADMIN only)
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(
    @Req() request: AuthenticatedRequest,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.authService.inviteUser(
      request.user.userId,
      inviteUserDto,
    );
  }

  // Verify Invitation
  @Public()
  @Post('verify-invitation')
  @HttpCode(HttpStatus.OK)
  async verifyInvitation(
    @Body() verifyInvitationDto: VerifyInvitationDto,
  ) {
    return this.authService.verifyInvitation(verifyInvitationDto);
  }

  // Accept Invitation
  @Public()
  @Post('accept-invitation')
  @HttpCode(HttpStatus.CREATED)
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ) {
    return this.authService.acceptInvitation(acceptInvitationDto);
  }

  // Logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.user.userId);
  }
}
