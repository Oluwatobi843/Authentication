
import {
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'Verification token must be a valid 64-character hexadecimal string',
  })
  token: string;
}
