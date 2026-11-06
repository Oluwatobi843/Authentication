
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
    otp: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_FROM'),
        to: email,
        subject: 'Verify Your Email Address',
        text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
        html: `
          <h2>Email Verification</h2>
          <p>Thank you for registering.</p>
          <p>Use the six-digit OTP below to verify your email:</p>
          <h3>${otp}</h3>
          <p>This OTP expires in 10 minutes.</p>
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

  async sendInvitationEmail(
    email: string,
    invitationToken: string,
    inviterName: string,
    role: string,
  ): Promise<void> {
    try {
      const frontendUrl =
        this.configService.getOrThrow<string>('FRONTEND_URL');

      const invitationLink =
        `${frontendUrl}/accept-invitation?token=${encodeURIComponent(invitationToken)}`;

      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_FROM'),
        to: email,
        subject: 'You Have Been Invited',
        text: `
          ${inviterName} has invited you to join our platform.

          Your assigned role is ${role}.

          Accept your invitation using this link:
          ${invitationLink}

          This invitation expires in 24 hours.
        `,
        html: `
          <h2>You Have Been Invited!</h2>
          <p>${inviterName} has invited you to join our platform.</p>
          <p>Your assigned role is <strong>${role}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <a
            href="${invitationLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Accept Invitation
          </a>
          <p>This invitation expires in 24 hours.</p>
          <p>If you were not expecting this invitation, you can ignore this email.</p>
        `,
      });

      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send invitation email', error);

      throw new InternalServerErrorException(
        'Unable to send invitation email. Please try again later.',
      );
    }
  }
}
