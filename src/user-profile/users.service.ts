
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../user-auth/entities/user.entity.js';
import type { UserResponse } from '../user-auth/interfaces/user.interface.js';

import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmailWithVerificationOtp(
    email: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationOtpHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .where('user.passwordResetToken = :token', { token })
      .getOne();
  }

  // Retrieve authenticated user's profile
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  // Update authenticated user's profile
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one profile field to update',
      );
    }

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName.trim();
    }

    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = dto.phoneNumber.trim();
    }

    const updatedUser = await this.userRepository.save(user);

    return this.toUserResponse(updatedUser);
  }

  // Change authenticated user's password
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);

    // Invalidate existing refresh-token session
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  // Return only safe user information
  private toUserResponse(user: User): UserResponse {
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
}
