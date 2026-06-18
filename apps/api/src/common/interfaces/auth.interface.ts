import { UserRole, UserStatus } from '@prisma/client';
import { JwtTokenType } from '../enums/jwt.enum';
import { Request } from 'express';

export class TokenPayload {
  sub!: string;
  role!: UserRole;
  status!: UserStatus;
  type!: JwtTokenType;
  deviceId!: string;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}
