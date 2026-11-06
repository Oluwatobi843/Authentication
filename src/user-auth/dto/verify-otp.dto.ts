import {
  IsString,
  Matches,
} from 'class-validator';
import { ResendOtpDto } from './resend-otp.dto.js';

export class VerifyOtpDto extends ResendOtpDto {
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be exactly six digits',
  })
  otp: string;
}