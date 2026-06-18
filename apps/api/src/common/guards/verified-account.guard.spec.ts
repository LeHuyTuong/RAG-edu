import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtTokenType } from '../enums/jwt.enum';
import { VerifiedAccountGuard } from './verified-account.guard';

const createContext = (user?: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as ExecutionContext;

describe('VerifiedAccountGuard', () => {
  const prismaServiceMock = {
    accounts: {
      findUnique: jest.fn(),
    },
  };

  let guard: VerifiedAccountGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new VerifiedAccountGuard(prismaServiceMock as any);
  });

  it('allows active accounts to use verified-only resources', async () => {
    prismaServiceMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });

    await expect(
      guard.canActivate(
        createContext({
          sub: 'user-1',
          role: UserRole.USER,
          status: UserStatus.UNVERIFIED,
          type: JwtTokenType.AccessToken,
          deviceId: 'device-1',
        }),
      ),
    ).resolves.toBe(true);
    expect(prismaServiceMock.accounts.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { status: true },
    });
  });

  it('blocks unverified accounts from verified-only resources', async () => {
    prismaServiceMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.UNVERIFIED,
    });

    await expect(
      guard.canActivate(
        createContext({
          sub: 'user-1',
          role: UserRole.USER,
          status: UserStatus.UNVERIFIED,
          type: JwtTokenType.AccessToken,
          deviceId: 'device-1',
        }),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        message: 'Email verification is required',
      }),
    );
  });

  it('blocks requests without an authenticated user', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prismaServiceMock.accounts.findUnique).not.toHaveBeenCalled();
  });
});
