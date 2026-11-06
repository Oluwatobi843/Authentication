import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=])[A-Za-z\d@$!%*?&#^()_+\-=]+$/, {
    message:
      'New password must contain uppercase, lowercase, number, and special character',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}