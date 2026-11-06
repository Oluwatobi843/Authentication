
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { UserRole } from '../enums/user-role.enum.js';
import { UserStatus } from '../enums/user-status.enum.js';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  // Registration email verification
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    select: false,
  })
  emailVerificationOtpHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiresAt: Date | null;

  // Email change verification
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  pendingEmail: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    select: false,
  })
  emailChangeOtpHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailChangeOtpExpiresAt: Date | null;

  // Refresh token
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  // Password reset
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date | null;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
