
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

import { UserInvitation } from './entities/user-invitation.entity.js';

import { InvitationHelper } from './helpers/invitation.helper.js';
import { UserHelper } from './helpers/user.helper.js';
import { UserEmailHelper } from './helpers/user-email.helper.js';
import { JwtHelper } from './helpers/jwt.helper.js';

import { UsersModule } from '../user-profile/users.module.js';
import { EmailModule } from '../common/email/email.module.js';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    TypeOrmModule.forFeature([UserInvitation]),
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
    InvitationHelper,
    UserHelper,
    RolesGuard,
    UserEmailHelper,
    JwtHelper,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
