import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { User } from '../user-auth/entities/user.entity.js';
import { EmailService } from '../common/email/email.service.js';

describe('UsersService', () => {
  let service: UsersService;

const mockUserRepository = {
  findOne: () => Promise.resolve(null),
  create: (data: any) => data,
  save: (data: any) => Promise.resolve(data),
  createQueryBuilder: () => ({
    addSelect: () => ({
      where: () => ({
        getOne: () => Promise.resolve(null),
      }),
    }),
  }),
};

const mockEmailService = {
  sendEmailChangeVerificationEmail: () => Promise.resolve(),
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
