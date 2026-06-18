import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { DeviceType, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  emailVerificationConfiguration,
  googleAuthConfiguration,
  jwtConfiguration,
  passwordRecoveryConfiguration,
} from '../../config';
import { AccountsService } from '../accounts/accounts.service';
import { AuthService } from './auth.service';
import { JwtTokenType } from '../../common/enums/jwt.enum';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { MailService } from '../mail/mail.service';
import { MailQueueService } from '../mail/mail-queue.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuthTokenService } from './services/auth-token.service';
import { GoogleAuthService } from './services/google-auth.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'email-verification-token'),
}));

const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    $transaction: jest.fn(),
    accounts: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auth_providers: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    sessions: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const accountsServiceMock = {
    create: jest.fn(),
    findAccountByEmail: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtMock = {
    signAsync: jest.fn(),
  };

  const redisServiceMock = {
    get: jest.fn(),
    getJson: jest.fn(),
    set: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };

  const mailServiceMock = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetLink: jest.fn(),
  };

  const mailQueueServiceMock = {
    enqueueVerificationEmail: jest.fn(),
    enqueuePasswordResetEmail: jest.fn(),
  };

  const googleAuthServiceMock = {
    buildAuthorizationUrl: jest.fn(),
    exchangeCodeForIdToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };

  const jwtConfigMock = {
    secret: 'test-secret',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };

  const emailVerificationConfigMock = {
    codeLength: 6,
    ttlSeconds: 10 * 60,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  };

  const passwordRecoveryConfigMock = {
    ttlSeconds: 10 * 60,
    resendCooldownSeconds: 60,
  };

  const googleAuthConfigMock = {
    webClientId: 'web-client-id',
    iosClientId: 'ios-client-id',
    androidClientId: 'android-client-id',
    clientSecret: 'client-secret',
    callbackUrl: 'http://localhost:8080/api/v1/auth/google/callback',
    successRedirectUrl: 'http://localhost:3000/user/login',
    failureRedirectUrl: 'http://localhost:3000/user/login',
    stateTtlSeconds: 600,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      async (callback: (transaction: typeof prismaMock) => unknown) =>
        callback(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AccountsService,
          useValue: accountsServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        {
          provide: MailQueueService,
          useValue: mailQueueServiceMock,
        },
        {
          provide: GoogleAuthService,
          useValue: googleAuthServiceMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: jwtConfiguration.KEY,
          useValue: jwtConfigMock,
        },
        {
          provide: emailVerificationConfiguration.KEY,
          useValue: emailVerificationConfigMock,
        },
        {
          provide: passwordRecoveryConfiguration.KEY,
          useValue: passwordRecoveryConfigMock,
        },
        {
          provide: googleAuthConfiguration.KEY,
          useValue: googleAuthConfigMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should return the current authenticated user without password', async () => {
    const createdAt = new Date('2026-06-08T00:00:00.000Z');
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      avatarUrl: 'https://example.com/avatar.png',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt,
    });

    const result = await service.getCurrentUser({
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      type: JwtTokenType.AccessToken,
      deviceId: 'device-1',
    });

    expect(accountsServiceMock.findOne).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      message: 'Current user retrieved successfully',
      data: {
        id: 'user-1',
        email: 'new-user@example.com',
        name: 'New User',
        avatarUrl: 'https://example.com/avatar.png',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt,
      },
    });
    expect(result.data).not.toHaveProperty('password');
  });

  it('should sign up a new account without creating a session', async () => {
    accountsServiceMock.findAccountByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'new-user@example.com',
        name: 'New User',
        role: UserRole.USER,
        status: UserStatus.UNVERIFIED,
      });
    accountsServiceMock.create.mockResolvedValue({
      message: 'Account created successfully',
    });
    mailQueueServiceMock.enqueueVerificationEmail.mockResolvedValue(undefined);
    redisServiceMock.set.mockResolvedValue('OK');

    const result = await service.signup({
      email: 'new-user@example.com',
      name: 'New User',
      password: 'Password123!',
    });

    expect(accountsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new-user@example.com',
        name: 'New User',
        password: expect.any(String),
        avatarUrl: undefined,
        role: UserRole.USER,
        status: UserStatus.UNVERIFIED,
      }),
    );
    expect(mailQueueServiceMock.enqueueVerificationEmail).toHaveBeenCalledWith(
      {
        id: 'user-1',
        email: 'new-user@example.com',
        name: 'New User',
        role: UserRole.USER,
        status: UserStatus.UNVERIFIED,
      },
      expect.any(String),
    );
    const token =
      mailQueueServiceMock.enqueueVerificationEmail.mock.calls[0][1];
    const hashedToken = createHash('sha256').update(token).digest('hex');
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      `verify_email:${hashedToken}`,
      'user-1',
      emailVerificationConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'verify_email_user:user-1',
      hashedToken,
      emailVerificationConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set.mock.calls[0][0]).not.toContain(token);
    expect(mailServiceMock.sendVerificationCode).not.toHaveBeenCalled();

    expect(prismaMock.sessions.upsert).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Signup successful. Please verify your email.',
      data: null,
    });
  });

  it('should throw conflict exception when email exists on signup', async () => {
    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'existing-user',
    });

    await expect(
      service.signup({
        email: 'existing-user@example.com',
        name: 'Existing User',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should verify email with a valid token and activate the account', async () => {
    const token = 'email-verification-token';
    const hashedToken = createHash('sha256').update(token).digest('hex');

    redisServiceMock.get.mockResolvedValue('user-1');
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      status: UserStatus.UNVERIFIED,
    });
    prismaMock.accounts.update.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });
    redisServiceMock.del.mockResolvedValue(1);

    await expect(
      service.verifyEmail({
        token,
        deviceType: DeviceType.WEB,
      }),
    ).resolves.toEqual({
      message: 'Email verified successfully',
      data: null,
    });
    expect(redisServiceMock.get).toHaveBeenCalledWith(
      `verify_email:${hashedToken}`,
    );
    expect(prismaMock.accounts.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: UserStatus.ACTIVE },
    });
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      `verify_email:${hashedToken}`,
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'verify_email_user:user-1',
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'verify_email_cooldown:user-1',
    );
  });

  it('should reissue session tokens after verifying email with a device id', async () => {
    const token = 'email-verification-token';

    redisServiceMock.get.mockResolvedValue('user-1');
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });
    prismaMock.accounts.update.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('active-access-token')
      .mockResolvedValueOnce('active-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({
      userId: 'user-1',
      deviceId: 'device-1',
    });
    redisServiceMock.del.mockResolvedValue(1);

    await expect(
      service.verifyEmail({
        token,
        deviceId: 'device-1',
        deviceType: DeviceType.WEB,
      }),
    ).resolves.toEqual({
      message: 'Email verified successfully',
      data: {
        accessToken: 'active-access-token',
        refreshToken: 'active-refresh-token',
      },
    });
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        sub: 'user-1',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        type: JwtTokenType.AccessToken,
        deviceId: 'device-1',
        email: 'new-user@example.com',
        name: 'New User',
      },
      { expiresIn: jwtConfigMock.accessTokenExpiresIn },
    );
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: 'user-1',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        type: JwtTokenType.RefreshToken,
        deviceId: 'device-1',
        email: 'new-user@example.com',
        name: 'New User',
      },
      { expiresIn: jwtConfigMock.refreshTokenExpiresIn },
    );
    expect(prismaMock.sessions.upsert).toHaveBeenCalledWith({
      where: {
        userId_deviceId: {
          userId: 'user-1',
          deviceId: 'device-1',
        },
      },
      update: expect.objectContaining({
        deviceType: DeviceType.WEB,
        refreshToken: expect.any(String),
        isRevoked: false,
      }),
      create: expect.objectContaining({
        userId: 'user-1',
        deviceId: 'device-1',
        deviceType: DeviceType.WEB,
        refreshToken: expect.any(String),
      }),
    });
  });

  it('should persist a mobile device type when verifying email on mobile', async () => {
    const token = 'email-verification-token';

    redisServiceMock.get.mockResolvedValue('user-1');
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });
    prismaMock.accounts.update.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('mobile-access-token')
      .mockResolvedValueOnce('mobile-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({
      userId: 'user-1',
      deviceId: 'device-mobile',
    });
    redisServiceMock.del.mockResolvedValue(1);

    await expect(
      service.verifyEmail({
        token,
        deviceId: 'device-mobile',
        deviceType: DeviceType.MOBILE,
      }),
    ).resolves.toEqual({
      message: 'Email verified successfully',
      data: {
        accessToken: 'mobile-access-token',
        refreshToken: 'mobile-refresh-token',
      },
    });

    expect(prismaMock.sessions.upsert).toHaveBeenCalledWith({
      where: {
        userId_deviceId: {
          userId: 'user-1',
          deviceId: 'device-mobile',
        },
      },
      update: expect.objectContaining({
        deviceType: DeviceType.MOBILE,
        refreshToken: expect.any(String),
        isRevoked: false,
      }),
      create: expect.objectContaining({
        userId: 'user-1',
        deviceId: 'device-mobile',
        deviceType: DeviceType.MOBILE,
        refreshToken: expect.any(String),
      }),
    });
  });

  it('should rotate verification email token on resend', async () => {
    (mockedUuidV4 as jest.Mock).mockReturnValueOnce('new-verification-token');
    const newHashedToken = createHash('sha256')
      .update('new-verification-token')
      .digest('hex');

    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });
    redisServiceMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('old-hashed-token');
    redisServiceMock.del.mockResolvedValue(1);
    redisServiceMock.set.mockResolvedValue('OK');
    mailQueueServiceMock.enqueueVerificationEmail.mockResolvedValue(undefined);

    await expect(service.resendVerificationEmail('user-1')).resolves.toEqual({
      message: 'Verification email sent',
      data: null,
    });
    expect(redisServiceMock.get).toHaveBeenNthCalledWith(
      1,
      'verify_email_cooldown:user-1',
    );
    expect(redisServiceMock.get).toHaveBeenNthCalledWith(
      2,
      'verify_email_user:user-1',
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'verify_email:old-hashed-token',
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      `verify_email:${newHashedToken}`,
      'user-1',
      emailVerificationConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'verify_email_user:user-1',
      newHashedToken,
      emailVerificationConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'verify_email_cooldown:user-1',
      '1',
      emailVerificationConfigMock.resendCooldownSeconds,
    );
    expect(mailQueueServiceMock.enqueueVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'new-verification-token',
    );
    expect(mailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('should return success without sending mail when resend account is already verified', async () => {
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });

    await expect(service.resendVerificationEmail('user-1')).resolves.toEqual({
      message: 'Email is already verified',
      data: null,
    });
    expect(
      mailQueueServiceMock.enqueueVerificationEmail,
    ).not.toHaveBeenCalled();
    expect(mailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
    expect(redisServiceMock.set).not.toHaveBeenCalled();
  });

  it('should enforce resend verification cooldown', async () => {
    accountsServiceMock.findOne.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.UNVERIFIED,
    });
    redisServiceMock.get.mockResolvedValueOnce('1');
    redisServiceMock.ttl.mockResolvedValue(42);

    await expect(service.resendVerificationEmail('user-1')).rejects.toEqual(
      expect.objectContaining({
        message:
          'Please wait 42 seconds before requesting another verification email',
      }),
    );
    expect(
      mailQueueServiceMock.enqueueVerificationEmail,
    ).not.toHaveBeenCalled();
    expect(mailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('should send a password reset link for an active account', async () => {
    (mockedUuidV4 as jest.Mock).mockReturnValueOnce('password-reset-token');
    const hashedToken = createHash('sha256')
      .update('password-reset-token')
      .digest('hex');
    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: 'hashed-password',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    redisServiceMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('old-reset-token');
    redisServiceMock.del.mockResolvedValue(1);
    redisServiceMock.set.mockResolvedValue('OK');
    mailQueueServiceMock.enqueuePasswordResetEmail.mockResolvedValue(undefined);

    await expect(
      service.forgotPassword({ email: 'new-user@example.com' }),
    ).resolves.toEqual({
      message:
        'If an account exists for this email, a password reset link has been sent.',
      data: null,
    });
    expect(redisServiceMock.get).toHaveBeenNthCalledWith(
      1,
      'password_reset_cooldown:user-1',
    );
    expect(redisServiceMock.get).toHaveBeenNthCalledWith(
      2,
      'password_reset_user:user-1',
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'password_reset:old-reset-token',
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      `password_reset:${hashedToken}`,
      'user-1',
      passwordRecoveryConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'password_reset_user:user-1',
      hashedToken,
      passwordRecoveryConfigMock.ttlSeconds,
    );
    expect(redisServiceMock.set).toHaveBeenCalledWith(
      'password_reset_cooldown:user-1',
      '1',
      passwordRecoveryConfigMock.resendCooldownSeconds,
    );
    expect(mailQueueServiceMock.enqueuePasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        email: 'new-user@example.com',
      }),
      'password-reset-token',
      passwordRecoveryConfigMock.ttlSeconds,
    );
    expect(mailServiceMock.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('should not reveal whether forgot-password email exists', async () => {
    accountsServiceMock.findAccountByEmail.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual({
      message:
        'If an account exists for this email, a password reset link has been sent.',
      data: null,
    });
    expect(
      mailQueueServiceMock.enqueuePasswordResetEmail,
    ).not.toHaveBeenCalled();
    expect(mailServiceMock.sendPasswordResetLink).not.toHaveBeenCalled();
    expect(redisServiceMock.set).not.toHaveBeenCalled();
  });

  it('should enforce password reset cooldown for active accounts', async () => {
    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: 'hashed-password',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    redisServiceMock.get.mockResolvedValueOnce('1');
    redisServiceMock.ttl.mockResolvedValue(42);

    await expect(
      service.forgotPassword({ email: 'new-user@example.com' }),
    ).rejects.toEqual(
      expect.objectContaining({
        message:
          'Please wait 42 seconds before requesting another password reset email',
      }),
    );
    expect(
      mailQueueServiceMock.enqueuePasswordResetEmail,
    ).not.toHaveBeenCalled();
    expect(mailServiceMock.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('should reset password, invalidate token, and revoke active sessions', async () => {
    const token = 'password-reset-token';
    const hashedToken = createHash('sha256').update(token).digest('hex');

    redisServiceMock.get.mockResolvedValue('user-1');
    prismaMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: 'old-hashed-password',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    prismaMock.accounts.update.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });
    prismaMock.sessions.updateMany.mockResolvedValue({ count: 2 });
    redisServiceMock.del.mockResolvedValue(1);

    await expect(
      service.resetPassword({
        token,
        password: 'NewPassword123!',
      }),
    ).resolves.toEqual({
      message: 'Password reset successfully',
      data: null,
    });
    expect(redisServiceMock.get).toHaveBeenCalledWith(
      `password_reset:${hashedToken}`,
    );
    expect(prismaMock.accounts.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: expect.any(String) },
    });
    expect(
      await argon2.verify(
        prismaMock.accounts.update.mock.calls[0][0].data.password,
        'NewPassword123!',
      ),
    ).toBe(true);
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      `password_reset:${hashedToken}`,
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'password_reset_user:user-1',
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'password_reset_cooldown:user-1',
    );
    expect(prismaMock.sessions.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  });

  it('should reject invalid password reset tokens', async () => {
    redisServiceMock.get.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'invalid-token',
        password: 'NewPassword123!',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: 'Invalid or expired reset token',
      }),
    );
    expect(prismaMock.accounts.update).not.toHaveBeenCalled();
    expect(prismaMock.sessions.updateMany).not.toHaveBeenCalled();
  });

  it('should change password and revoke other active sessions', async () => {
    const currentPasswordHash = await argon2.hash('Password123!');
    const userPayload: TokenPayload = {
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      type: JwtTokenType.AccessToken,
      deviceId: 'current-device',
    };
    prismaMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: currentPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    prismaMock.accounts.update.mockResolvedValue({ id: 'user-1' });
    prismaMock.sessions.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      service.changePassword(userPayload, {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      }),
    ).resolves.toEqual({
      message: 'Password changed successfully',
      data: null,
    });
    expect(prismaMock.accounts.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: expect.any(String) },
    });
    expect(
      await argon2.verify(
        prismaMock.accounts.update.mock.calls[0][0].data.password,
        'NewPassword123!',
      ),
    ).toBe(true);
    expect(prismaMock.sessions.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        deviceId: {
          not: 'current-device',
        },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  });

  it('should reject change password when current password is invalid', async () => {
    const currentPasswordHash = await argon2.hash('Password123!');
    const userPayload: TokenPayload = {
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      type: JwtTokenType.AccessToken,
      deviceId: 'current-device',
    };
    prismaMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      password: currentPasswordHash,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.changePassword(userPayload, {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.accounts.update).not.toHaveBeenCalled();
    expect(prismaMock.sessions.updateMany).not.toHaveBeenCalled();
  });

  it('should reject change password when new password matches current password', async () => {
    const currentPasswordHash = await argon2.hash('Password123!');
    const userPayload: TokenPayload = {
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      type: JwtTokenType.AccessToken,
      deviceId: 'current-device',
    };
    prismaMock.accounts.findUnique.mockResolvedValue({
      id: 'user-1',
      password: currentPasswordHash,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.changePassword(userPayload, {
        currentPassword: 'Password123!',
        newPassword: 'Password123!',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: 'New password must be different from current password',
      }),
    );
    expect(prismaMock.accounts.update).not.toHaveBeenCalled();
    expect(prismaMock.sessions.updateMany).not.toHaveBeenCalled();
  });

  it('should sign in successfully with valid credentials', async () => {
    const hashedPassword = await argon2.hash('Password123!');

    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    const result = await service.signin(
      {
        email: 'new-user@example.com',
        password: 'Password123!',
        deviceId: 'device-1',
      },
      DeviceType.MOBILE,
    );

    expect(result.data.accessToken).toBe('access-token');
    expect(result.data.refreshToken).toBe('refresh-token');
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sub: 'user-1',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        type: JwtTokenType.AccessToken,
        deviceId: 'device-1',
      }),
      { expiresIn: jwtConfigMock.accessTokenExpiresIn },
    );
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: JwtTokenType.RefreshToken,
        deviceId: 'device-1',
      }),
      { expiresIn: jwtConfigMock.refreshTokenExpiresIn },
    );
    expect(prismaMock.sessions.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_deviceId: {
            userId: 'user-1',
            deviceId: 'device-1',
          },
        },
        update: expect.objectContaining({
          refreshToken: expect.any(String),
          expiresAt: expect.any(Date),
          isRevoked: false,
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          refreshToken: expect.any(String),
          deviceId: 'device-1',
          deviceType: DeviceType.MOBILE,
          expiresAt: expect.any(Date),
        }),
      }),
    );

    const sessionUpsertPayload = prismaMock.sessions.upsert.mock
      .calls[0][0] as {
      create: { refreshToken: string };
    };
    expect(
      await argon2.verify(
        sessionUpsertPayload.create.refreshToken,
        'refresh-token',
      ),
    ).toBe(true);
  });

  it('should create an active account and provider identity from a verified Google id token', async () => {
    googleAuthServiceMock.verifyIdToken.mockResolvedValue({
      providerAccountId: 'google-sub-1',
      email: 'student@example.com',
      emailVerified: true,
      name: 'Student User',
      picture: 'https://example.com/avatar.png',
    });
    prismaMock.auth_providers.findUnique.mockResolvedValue(null);
    accountsServiceMock.findAccountByEmail.mockResolvedValue(null);
    prismaMock.accounts.create.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      name: 'Student User',
      password: 'hashed-random-password',
      avatarUrl: 'https://example.com/avatar.png',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    prismaMock.auth_providers.create.mockResolvedValue({ id: 'provider-1' });
    jwtMock.signAsync
      .mockResolvedValueOnce('google-access-token')
      .mockResolvedValueOnce('google-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    await expect(
      service.signinWithGoogleIdToken(
        {
          idToken: 'id-token',
          deviceId: 'device-1',
        },
        DeviceType.MOBILE,
      ),
    ).resolves.toEqual({
      message: 'Google signin successful',
      data: {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      },
    });
    expect(prismaMock.accounts.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'student@example.com',
        name: 'Student User',
        avatarUrl: 'https://example.com/avatar.png',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        password: expect.any(String),
      }),
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.auth_providers.create).toHaveBeenCalledWith({
      data: {
        provider: 'GOOGLE',
        providerAccountId: 'google-sub-1',
        accountId: 'user-1',
        email: 'student@example.com',
      },
    });
    expect(prismaMock.sessions.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          deviceId: 'device-1',
          deviceType: DeviceType.MOBILE,
        }),
      }),
    );
  });

  it('should store client OAuth state when creating Google authorization URL', async () => {
    googleAuthServiceMock.buildAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/auth',
    );

    await expect(
      service.getGoogleAuthorizationUrl({
        deviceId: 'device-1',
        redirectPath: '/documents',
        clientState: 'client-state',
      }),
    ).resolves.toBe('https://accounts.google.com/auth');

    expect(redisServiceMock.setJson).toHaveBeenCalledWith(
      'google_oauth_state:email-verification-token',
      {
        deviceId: 'device-1',
        redirectPath: '/documents',
        clientState: 'client-state',
      },
      googleAuthConfigMock.stateTtlSeconds,
    );
    expect(googleAuthServiceMock.buildAuthorizationUrl).toHaveBeenCalledWith(
      'email-verification-token',
    );
  });

  it('should activate an existing unverified Google email and provider identity in one transaction', async () => {
    googleAuthServiceMock.verifyIdToken.mockResolvedValue({
      providerAccountId: 'google-sub-1',
      email: 'student@example.com',
      emailVerified: true,
      name: 'Student User',
      picture: null,
    });
    prismaMock.auth_providers.findUnique.mockResolvedValue(null);
    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      name: 'Student User',
      password: 'hashed-password',
      avatarUrl: '',
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });
    prismaMock.accounts.update.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      name: 'Student User',
      password: 'hashed-password',
      avatarUrl: '',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    prismaMock.auth_providers.create.mockResolvedValue({ id: 'provider-1' });
    jwtMock.signAsync
      .mockResolvedValueOnce('google-access-token')
      .mockResolvedValueOnce('google-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    await service.signinWithGoogleIdToken(
      {
        idToken: 'id-token',
        deviceId: 'device-1',
      },
      DeviceType.WEB,
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.accounts.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: UserStatus.ACTIVE },
    });
    expect(prismaMock.auth_providers.create).toHaveBeenCalledWith({
      data: {
        provider: 'GOOGLE',
        providerAccountId: 'google-sub-1',
        accountId: 'user-1',
        email: 'student@example.com',
      },
    });
  });

  it('should use stored redirect path when completing Google OAuth callback', async () => {
    redisServiceMock.getJson.mockResolvedValue({
      deviceId: 'device-1',
      redirectPath: '/documents',
      clientState: 'client-state',
    });
    googleAuthServiceMock.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleAuthServiceMock.verifyIdToken.mockResolvedValue({
      providerAccountId: 'google-sub-1',
      email: 'student@example.com',
      emailVerified: true,
      name: 'Student User',
      picture: null,
    });
    prismaMock.auth_providers.findUnique.mockResolvedValue({
      id: 'provider-1',
      account: {
        id: 'user-1',
        email: 'student@example.com',
        name: 'Student User',
        password: 'hashed-password',
        avatarUrl: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('google-access-token')
      .mockResolvedValueOnce('google-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    await expect(
      service.signinWithGoogleCode({
        code: 'oauth-code',
        state: 'oauth-state',
      }),
    ).resolves.toEqual({
      tokens: {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      },
      redirectUrl:
        'http://localhost:3000/documents#googleAccessToken=google-access-token&googleState=client-state',
    });
    expect(redisServiceMock.getJson).toHaveBeenCalledWith(
      'google_oauth_state:oauth-state',
    );
    expect(redisServiceMock.del).toHaveBeenCalledWith(
      'google_oauth_state:oauth-state',
    );
  });

  it('should reuse an existing Google provider identity when signing in', async () => {
    googleAuthServiceMock.verifyIdToken.mockResolvedValue({
      providerAccountId: 'google-sub-1',
      email: 'student@example.com',
      emailVerified: true,
      name: 'Student User',
      picture: null,
    });
    prismaMock.auth_providers.findUnique.mockResolvedValue({
      id: 'provider-1',
      account: {
        id: 'user-1',
        email: 'student@example.com',
        name: 'Student User',
        password: 'hashed-password',
        avatarUrl: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('google-access-token')
      .mockResolvedValueOnce('google-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    const result = await service.signinWithGoogleIdToken(
      {
        idToken: 'id-token',
        deviceId: 'device-1',
      },
      DeviceType.WEB,
    );

    expect(result.data.accessToken).toBe('google-access-token');
    expect(accountsServiceMock.findAccountByEmail).not.toHaveBeenCalled();
    expect(prismaMock.accounts.create).not.toHaveBeenCalled();
    expect(prismaMock.auth_providers.create).not.toHaveBeenCalled();
  });

  it('should reject Google id tokens with unverified email claims', async () => {
    googleAuthServiceMock.verifyIdToken.mockResolvedValue({
      providerAccountId: 'google-sub-1',
      email: 'student@example.com',
      emailVerified: false,
      name: 'Student User',
      picture: null,
    });

    await expect(
      service.signinWithGoogleIdToken(
        {
          idToken: 'id-token',
          deviceId: 'device-1',
        },
        DeviceType.MOBILE,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.auth_providers.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sessions.upsert).not.toHaveBeenCalled();
  });

  it('should throw unauthorized exception for missing signin account', async () => {
    accountsServiceMock.findAccountByEmail.mockResolvedValue(null);

    await expect(
      service.signin(
        {
          email: 'missing@example.com',
          password: 'Password123!',
          deviceId: 'device-1',
        },
        DeviceType.WEB,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw unauthorized exception for invalid signin password', async () => {
    const hashedPassword = await argon2.hash('Password123!');

    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: hashedPassword,
    });

    await expect(
      service.signin(
        {
          email: 'new-user@example.com',
          password: 'WrongPassword!',
          deviceId: 'device-1',
        },
        DeviceType.WEB,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should sign in unverified users with limited-session tokens', async () => {
    const hashedPassword = await argon2.hash('Password123!');

    accountsServiceMock.findAccountByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new-user@example.com',
      name: 'New User',
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });
    jwtMock.signAsync
      .mockResolvedValueOnce('unverified-access-token')
      .mockResolvedValueOnce('unverified-refresh-token');
    prismaMock.sessions.upsert.mockResolvedValue({ id: 'session-1' });

    await expect(
      service.signin(
        {
          email: 'new-user@example.com',
          password: 'Password123!',
          deviceId: 'device-1',
        },
        DeviceType.WEB,
      ),
    ).resolves.toEqual({
      message: 'Signin successful',
      data: {
        accessToken: 'unverified-access-token',
        refreshToken: 'unverified-refresh-token',
      },
    });
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sub: 'user-1',
        status: UserStatus.UNVERIFIED,
        type: JwtTokenType.AccessToken,
        deviceId: 'device-1',
      }),
      { expiresIn: jwtConfigMock.accessTokenExpiresIn },
    );
    expect(prismaMock.sessions.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          deviceType: DeviceType.WEB,
        }),
      }),
    );
  });

  it('should revoke the current device session on logout', async () => {
    accountsServiceMock.findOne.mockResolvedValue({ id: 'user-1' });
    prismaMock.sessions.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.logout('user-1', 'device-1')).resolves.toEqual({
      message: 'Logout successful',
      data: null,
    });

    expect(prismaMock.sessions.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        deviceId: 'device-1',
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  });

  it('should throw unauthorized exception on logout when user is missing', async () => {
    accountsServiceMock.findOne.mockResolvedValue(null);

    await expect(
      service.logout('missing-user', 'device-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should refresh an access token from refresh token payload', async () => {
    const payload: TokenPayload = {
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      type: JwtTokenType.RefreshToken,
      deviceId: 'device-1',
    };
    const hashedRefreshToken = await argon2.hash('refresh-token');
    prismaMock.sessions.findFirst.mockResolvedValue({
      id: 'session-1',
      refreshToken: hashedRefreshToken,
    });
    jwtMock.signAsync.mockResolvedValue('new-access-token');

    await expect(
      service.refreshToken(payload, 'refresh-token'),
    ).resolves.toEqual({
      message: 'Token refreshed successfully',
      data: {
        accessToken: 'new-access-token',
      },
    });
    expect(prismaMock.sessions.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        deviceId: 'device-1',
        isRevoked: false,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
    });
    expect(jwtMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        type: JwtTokenType.AccessToken,
        deviceId: 'device-1',
      }),
      { expiresIn: jwtConfigMock.accessTokenExpiresIn },
    );
  });

  it('getExpiryDate handles supported duration formats', () => {
    const privateService = service as unknown as {
      getExpiryDate: (expiresIn: string) => Date;
    };
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    expect(privateService.getExpiryDate('45s').getTime()).toBe(now + 45 * 1000);
    expect(privateService.getExpiryDate('5m').getTime()).toBe(
      now + 5 * 60 * 1000,
    );
    expect(privateService.getExpiryDate('2h').getTime()).toBe(
      now + 2 * 60 * 60 * 1000,
    );
    expect(privateService.getExpiryDate('3d').getTime()).toBe(
      now + 3 * 24 * 60 * 60 * 1000,
    );
    expect(() => privateService.getExpiryDate('xyz')).toThrow(
      'Unsupported token expiry format: xyz',
    );
  });
});
