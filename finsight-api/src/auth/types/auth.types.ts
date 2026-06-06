import type { Request } from 'express';
import type { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
