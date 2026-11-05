import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
 private readonly transporter: Transporter;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_FROM'),
        to: email,
        subject: 'Verify Your Email Address',
        text: `Your email verification token is: ${token}. This token expires in 30 minutes.`,
        html: `
          <h2>Email Verification</h2>
          <p>Thank you for registering.</p>
          <p>Use the verification token below to activate your account:</p>
          <h3>${token}</h3>
          <p>This token expires in 30 minutes.</p>
        `,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  async sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  try {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      to: email,
      subject: 'Reset Your Password',
      text: `Your password reset token is: ${token}. This token expires in 15 minutes.`,
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p>Use the token below to reset your password:</p>
        <h3>${token}</h3>
        <p>This token expires in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  } catch (error) {
    this.logger.error('Failed to send password reset email', error);

    throw new InternalServerErrorException(
      'Unable to send password reset email. Please try again later.',
    );
  }
}
}