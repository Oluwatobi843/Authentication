
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { User } from '../user-auth/entities/user.entity.js';
import { UserInvitation } from '../user-auth/entities/user-invitation.entity.js';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [User, UserInvitation],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
  logging: false,
});
