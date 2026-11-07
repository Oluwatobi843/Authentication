
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service.js';
import { UsersService } from '../user-profile/users.service.js';
import { EmailService } from '../common/email/email.service.js';
import { InvitationHelper } from './helpers/invitation.helper.js';
import { UserInvitation } from './entities/user-invitation.entity.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {};
  const mockEmailService = {};
  const mockJwtService = {};
  const mockConfigService = {};
  const mockInvitationHelper = {};
  const mockInvitationRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: InvitationHelper,
          useValue: mockInvitationHelper,
        },
        {
          provide: getRepositoryToken(UserInvitation),
          useValue: mockInvitationRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
