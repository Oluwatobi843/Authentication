
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service.js';

import { JwtAuthGuard } from '../user-auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../user-auth/decorators/current-user.decorator.js';

import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ChangeProfileEmailDto } from './dto/change-profile-email.dto.js';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET /users/me
  @Get('me')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ) {
    return this.usersService.getProfile(userId);
  }

  // PATCH /users/me
  @Patch('me')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // PATCH /users/change-password
  @Patch('change-password')
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  // PATCH /users/change-email
  @Patch('change-email')
  async requestEmailChange(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangeProfileEmailDto,
  ) {
    return this.usersService.requestEmailChange(userId, dto);
  }

  // POST /users/verify-email-change
  @Post('verify-email-change')
  async verifyEmailChange(
    @CurrentUser('userId') userId: string,
    @Body() dto: VerifyEmailChangeDto,
  ) {
    return this.usersService.verifyEmailChange(userId, dto);
  }
}
