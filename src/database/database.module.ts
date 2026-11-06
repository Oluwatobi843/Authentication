
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user-auth/entities/user.entity.js';
import { UserInvitation } from '../user-auth/entities/user-invitation.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),

        entities: [User, UserInvitation],

        synchronize: false,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
