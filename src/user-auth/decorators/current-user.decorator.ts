import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../interfaces/user.interface.js';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    const user = request.user;

    return data ? user?.[data] : user;
  },
);