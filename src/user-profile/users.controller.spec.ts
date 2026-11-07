import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getProfile: () => Promise.resolve({}),
    updateProfile: () => Promise.resolve({}),
    changePassword: () => Promise.resolve({}),
    requestEmailChange: () => Promise.resolve({}),
    verifyEmailChange: () => Promise.resolve({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});