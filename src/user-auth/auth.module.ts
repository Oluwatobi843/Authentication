
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

import { UsersModule } from '../user-profile/users.module.js';
import { EmailModule } from '../common/email/email.module.js';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({}),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
