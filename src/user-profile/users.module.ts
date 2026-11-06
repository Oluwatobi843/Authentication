import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from '../user-auth/entities/user.entity.js';
import { EmailModule } from '../common/email/email.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}