import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DeviceType, UserRole, UserStatus } from '@prisma/client';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { cookieConfiguration } from '../../config';
import { JwtTokenType } from '../../common/enums/jwt.enum';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'email-verification-token'),
}));

describe('AuthController', () => {
  let controller: AuthController;

  const cookieConfigMock = {
    accessTokenMaxAge: 1000 * 60 * 60,
    refreshTokenMaxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
  };

  const authServiceMock = {
    signup: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    getCurrentUser: jest.fn(),
    signin: jest.fn(),
    getGoogleAuthorizationUrl: jest.fn(),
    signinWithGoogleCode: jest.fn(),
    signinWithGoogleIdToken: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  };

  const createResponseMock = () =>
    ({
      cookie: jest.fn(),
      json: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    }) as unknown as Response;

  const userPayload: TokenPayload = {
    sub: 'user-1',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    type: JwtTokenType.AccessToken,
    deviceId: 'device-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: cookieConfiguration.KEY,
          useValue: cookieConfigMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call signup service', async () => {
    authServiceMock.signup.mockResolvedValue({
      message: 'Signup successful',
      data: null,
    });

    await expect(
      controller.signup({
        email: 'new-user@example.com',
        name: 'New User',
        password: 'Password123!',
      }),
    ).resolves.toEqual({
      message: 'Signup successful',
      data: null,
    });

    expect(authServiceMock.signup).toHaveBeenCalledWith({
      email: 'new-user@example.com',
      name: 'New User',
      password: 'Password123!',
    });
  });

  it('should call verify email service', async () => {
    authServiceMock.verifyEmail.mockResolvedValue({
      message: 'Email verified successfully',
      data: null,
    });

    await expect(
      controller.verifyEmail({
        token: 'email-verification-token',
        deviceType: DeviceType.WEB,
      }),
    ).resolves.toEqual({
      message: 'Email verified successfully',
      data: null,
    });
    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith({
      token: 'email-verification-token',
      deviceType: DeviceType.WEB,
    });
  });

  it('sets refresh token cookie and returns access token after email verification', async () => {
    const response = createResponseMock();
    authServiceMock.verifyEmail.mockResolvedValue({
      message: 'Email verified successfully',
      data: {
        accessToken: 'active-access-token',
        refreshToken: 'active-refresh-token',
      },
    });

    await controller.verifyEmail(
      {
        token: 'email-verification-token',
        deviceId: 'device-1',
        deviceType: DeviceType.MOBILE,
      },
      response,
    );

    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith({
      token: 'email-verification-token',
      deviceId: 'device-1',
      deviceType: DeviceType.MOBILE,
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'active-refresh-token',
      {
        httpOnly: cookieConfigMock.httpOnly,
        secure: cookieConfigMock.secure,
        sameSite: cookieConfigMock.sameSite,
        maxAge: cookieConfigMock.refreshTokenMaxAge,
      },
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully',
      data: {
        accessToken: 'active-access-token',
      },
    });
  });

  it('should call resend verification email service with the authenticated user', async () => {
    const unverifiedUser: TokenPayload = {
      ...userPayload,
      status: UserStatus.UNVERIFIED,
      type: JwtTokenType.AccessToken,
    };
    authServiceMock.resendVerificationEmail.mockResolvedValue({
      message: 'Verification email sent',
      data: null,
    });

    await expect(
      controller.resendVerificationEmail(unverifiedUser),
    ).resolves.toEqual({
      message: 'Verification email sent',
      data: null,
    });
    expect(authServiceMock.resendVerificationEmail).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('protects resend verification email with the normal JWT session guard', () => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype.resendVerificationEmail,
      ) ?? [];

    expect(guards).toContain(JwtAuthGuard);
  });

  it('should call forgot password service', async () => {
    authServiceMock.forgotPassword.mockResolvedValue({
      message:
        'If an account exists for this email, a password reset link has been sent.',
      data: null,
    });

    await expect(
      controller.forgotPassword({ email: 'new-user@example.com' }),
    ).resolves.toEqual({
      message:
        'If an account exists for this email, a password reset link has been sent.',
      data: null,
    });
    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith({
      email: 'new-user@example.com',
    });
  });

  it('should call reset password service', async () => {
    authServiceMock.resetPassword.mockResolvedValue({
      message: 'Password reset successfully',
      data: null,
    });

    await expect(
      controller.resetPassword({
        token: 'password-reset-token',
        password: 'NewPassword123!',
      }),
    ).resolves.toEqual({
      message: 'Password reset successfully',
      data: null,
    });
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
      token: 'password-reset-token',
      password: 'NewPassword123!',
    });
  });

  it('should call change password service with authenticated user', async () => {
    authServiceMock.changePassword.mockResolvedValue({
      message: 'Password changed successfully',
      data: null,
    });

    await expect(
      controller.changePassword(userPayload, {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      }),
    ).resolves.toEqual({
      message: 'Password changed successfully',
      data: null,
    });
    expect(authServiceMock.changePassword).toHaveBeenCalledWith(userPayload, {
      currentPassword: 'Password123!',
      newPassword: 'NewPassword123!',
    });
  });

  it('should return the current authenticated user', async () => {
    authServiceMock.getCurrentUser.mockResolvedValue({
      message: 'Current user retrieved successfully',
      data: {
        id: 'user-1',
        email: 'new-user@example.com',
        name: 'New User',
        avatarUrl: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-06-08T00:00:00.000Z'),
      },
    });

    await expect(controller.me(userPayload)).resolves.toEqual({
      message: 'Current user retrieved successfully',
      data: expect.objectContaining({
        id: 'user-1',
        email: 'new-user@example.com',
        name: 'New User',
      }),
    });
    expect(authServiceMock.getCurrentUser).toHaveBeenCalledWith(userPayload);
  });

  it('sets refresh token cookie and returns access token on web signin', async () => {
    const response = createResponseMock();
    authServiceMock.signin.mockResolvedValue({
      message: 'Signin successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    await controller.signin(
      {
        email: 'new-user@example.com',
        password: 'Password123!',
        deviceId: 'device-1',
      },
      response,
    );

    expect(authServiceMock.signin).toHaveBeenCalledWith(
      {
        email: 'new-user@example.com',
        password: 'Password123!',
        deviceId: 'device-1',
      },
      DeviceType.WEB,
    );
    expect(response.cookie).toHaveBeenCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      {
        httpOnly: cookieConfigMock.httpOnly,
        secure: cookieConfigMock.secure,
        sameSite: cookieConfigMock.sameSite,
        maxAge: cookieConfigMock.refreshTokenMaxAge,
      },
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Signin successful',
      data: {
        accessToken: 'access-token',
      },
    });
    expect(
      (response.json as jest.Mock).mock.calls[0][0].data,
    ).not.toHaveProperty('refreshToken');
  });

  it('returns both tokens and forces mobile device type on mobile signin', async () => {
    authServiceMock.signin.mockResolvedValue({
      message: 'Signin successful',
      data: {
        accessToken: 'mobile-access-token',
        refreshToken: 'mobile-refresh-token',
      },
    });

    const result = await controller.mobileSignin({
      email: 'new-user@example.com',
      password: 'Password123!',
      deviceId: 'device-1',
    });

    expect(authServiceMock.signin).toHaveBeenCalledWith(
      {
        email: 'new-user@example.com',
        password: 'Password123!',
        deviceId: 'device-1',
      },
      DeviceType.MOBILE,
    );
    expect(result).toEqual({
      message: 'Signin successful',
      data: {
        accessToken: 'mobile-access-token',
        refreshToken: 'mobile-refresh-token',
      },
    });
  });

  it('redirects to Google authorization URL for web Google signin', async () => {
    const response = createResponseMock();
    authServiceMock.getGoogleAuthorizationUrl.mockResolvedValue(
      'https://accounts.google.com/o/oauth2/v2/auth?state=state',
    );

    await controller.googleSignin(
      { deviceId: 'device-1', redirectPath: '/documents' },
      response,
    );

    expect(authServiceMock.getGoogleAuthorizationUrl).toHaveBeenCalledWith({
      deviceId: 'device-1',
      redirectPath: '/documents',
    });
    expect(response.redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth?state=state',
    );
  });

  it('sets refresh cookie and redirects with access token fragment after Google callback', async () => {
    const response = createResponseMock();
    authServiceMock.signinWithGoogleCode.mockResolvedValue({
      redirectUrl: 'http://localhost:3000/user/login#googleAccessToken=access',
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
      },
    });

    await controller.googleCallback(
      { code: 'code-1', state: 'state-1' },
      response,
    );

    expect(authServiceMock.signinWithGoogleCode).toHaveBeenCalledWith({
      code: 'code-1',
      state: 'state-1',
    });
    expect(response.cookie).toHaveBeenCalledWith('refreshToken', 'refresh', {
      httpOnly: cookieConfigMock.httpOnly,
      secure: cookieConfigMock.secure,
      sameSite: cookieConfigMock.sameSite,
      maxAge: cookieConfigMock.refreshTokenMaxAge,
    });
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/user/login#googleAccessToken=access',
    );
  });

  it('returns both tokens and forces mobile device type on mobile Google signin', async () => {
    authServiceMock.signinWithGoogleIdToken.mockResolvedValue({
      message: 'Google signin successful',
      data: {
        accessToken: 'mobile-access-token',
        refreshToken: 'mobile-refresh-token',
      },
    });

    const result = await controller.mobileGoogleSignin({
      idToken: 'id-token',
      deviceId: 'device-1',
    });

    expect(authServiceMock.signinWithGoogleIdToken).toHaveBeenCalledWith(
      {
        idToken: 'id-token',
        deviceId: 'device-1',
      },
      DeviceType.MOBILE,
    );
    expect(result).toEqual({
      message: 'Google signin successful',
      data: {
        accessToken: 'mobile-access-token',
        refreshToken: 'mobile-refresh-token',
      },
    });
  });

  it('should call logout service and clear token cookies', () => {
    const response = createResponseMock();
    authServiceMock.logout.mockReturnValue({
      message: 'Logout successful',
      data: null,
    });

    const result = controller.logout(userPayload, response);

    expect(authServiceMock.logout).toHaveBeenCalledWith('user-1', 'device-1');
    expect(response.clearCookie).toHaveBeenCalledWith('accessToken');
    expect(response.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(result).toEqual({
      message: 'Logout successful',
      data: null,
    });
  });

  it('refreshes using refresh token from cookie when body is empty', async () => {
    const refreshPayload = {
      ...userPayload,
      type: JwtTokenType.RefreshToken,
    };
    authServiceMock.refreshToken.mockResolvedValue({
      message: 'Token refreshed successfully',
      data: {
        accessToken: 'new-access-token',
      },
    });

    await expect(
      controller.refreshToken(refreshPayload, {}, {
        cookies: {
          refreshToken: 'cookie-refresh-token',
        },
        headers: {},
      } as any),
    ).resolves.toEqual({
      message: 'Token refreshed successfully',
      data: {
        accessToken: 'new-access-token',
      },
    });
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith(
      refreshPayload,
      'cookie-refresh-token',
    );
  });
});
