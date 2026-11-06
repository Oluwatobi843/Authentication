import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import type { JwtPayload } from '../interfaces/user.interface.js';
import type { User } from '../entities/user.entity.js';

@Injectable()
export class JwtHelper {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_SECRET',
      ),
      expiresIn: '15m',
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_SECRET',
      ),
      expiresIn: '7d',
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_SECRET',
      ),
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_SECRET',
      ),
    });
  }
}