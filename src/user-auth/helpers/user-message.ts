export const UserMessage = {
  // Registration
  REGISTRATION_SUCCESSFUL: 'User registered successfully',
  REGISTRATION_FAILED: 'User registration failed',

  // Email verification
  OTP_SENT: 'Verification OTP sent successfully',
  OTP_VERIFIED: 'Email verified successfully',
  INVALID_OTP: 'Invalid or expired OTP',
  OTP_EXPIRED: 'Verification OTP has expired',

  // Login
  LOGIN_SUCCESSFUL: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email before logging in',
  ACCOUNT_INACTIVE: 'Your account is inactive',

  // Token
  TOKEN_REFRESHED: 'Access token refreshed successfully',
  INVALID_TOKEN: 'Invalid or expired token',
  LOGOUT_SUCCESSFUL: 'Logout successful',

  // Password
  PASSWORD_RESET_EMAIL_SENT: 'Password reset instructions sent successfully',
  PASSWORD_RESET_SUCCESSFUL: 'Password reset successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token',

  // User invitation
  INVITATION_SENT: 'User invitation sent successfully',
  INVITATION_VERIFIED: 'Invitation verified successfully',
  INVITATION_ACCEPTED: 'Invitation accepted successfully',
  INVITATION_EXPIRED: 'Invitation has expired',
  INVALID_INVITATION: 'Invalid or expired invitation',

  // General
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email address is already registered',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
} as const;