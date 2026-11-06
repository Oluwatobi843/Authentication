import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../user-auth/entities/user.entity.js';

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
}
