import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangeProfileEmailDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  newEmail: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword: string;
}