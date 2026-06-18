import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import {
  emailVerificationConfiguration,
  googleAuthConfiguration,
  jwtConfiguration,
  passwordRecoveryConfiguration,
} from '../../config';
import type { ConfigType } from '@nestjs/config';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { JwtTokenType } from '../../common/enums/jwt.enum';
import {
  accounts,
  AuthProvider,
  DeviceType,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { AccountsService } from '../accounts/accounts.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailQueueService } from '../mail/mail-queue.service';
import { AuthTokenService } from './services/auth-token.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RedisService } from '../../common/redis/redis.service';
import {
  GoogleAccountProfile,
  GoogleAuthService,
} from './services/google-auth.service';
import { GoogleMobileSigninDto } from './dto/google-mobile-signin.dto';
import { GoogleSigninQueryDto } from './dto/google-signin-query.dto';
import { GoogleCallbackQueryDto } from './dto/google-callback-query.dto';

const VERIFY_EMAIL_TOKEN_PREFIX = 'verify_email';
const VERIFY_EMAIL_USER_PREFIX = 'verify_email_user';
const VERIFY_EMAIL_COOLDOWN_PREFIX = 'verify_email_cooldown';
const PASSWORD_RESET_TOKEN_PREFIX = 'password_reset';
const PASSWORD_RESET_USER_PREFIX = 'password_reset_user';
const PASSWORD_RESET_COOLDOWN_PREFIX = 'password_reset_cooldown';
const GOOGLE_OAUTH_STATE_PREFIX = 'google_oauth_state';
const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account exists for this email, a password reset link has been sent.';

interface GoogleOAuthState {
  deviceId: string;
  redirectPath?: string;
  clientState?: string;
}

type GoogleProviderIdentityClient = Pick<
  Prisma.TransactionClient,
  'auth_providers'
>;
type GoogleAccountLinkClient = Pick<
  Prisma.TransactionClient,
  'accounts' | 'auth_providers'
>;

type VerificationAccount = Pick<
  accounts,
  'id' | 'email' | 'name' | 'role' | 'status'
>;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    @Inject(emailVerificationConfiguration.KEY)
    private readonly emailVerificationConfig: ConfigType<
      typeof emailVerificationConfiguration
    >,
    @Inject(passwordRecoveryConfiguration.KEY)
    private readonly passwordRecoveryConfig: ConfigType<
      typeof passwordRecoveryConfiguration
    >,
    @Inject(googleAuthConfiguration.KEY)
    private readonly googleAuthConfig: ConfigType<
      typeof googleAuthConfiguration
    >,
    private accountService: AccountsService,
    private prismaService: PrismaService,
    private mailQueueService: MailQueueService,
    private readonly authTokenService: AuthTokenService,
    private readonly redisService: RedisService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async getCurrentUser(userPayload: TokenPayload) {
    const account = await this.accountService.findOne(userPayload.sub);

    if (!account) {
      throw new UnauthorizedException('Invalid user');
    }

    return {
      message: 'Current user retrieved successfully',
      data: {
        id: account.id,
        email: account.email,
        name: account.name,
        avatarUrl: account.avatarUrl,
        role: account.role,
        status: account.status,
        createdAt: account.createdAt,
      },
    };
  }

  async signup(signupDto: SignupDto) {
    const existingAccount = await this.accountService.findAccountByEmail(
      signupDto.email,
    );

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    await this.accountService.create({
      email: signupDto.email,
      name: signupDto.name,
      password: signupDto.password,
      avatarUrl: signupDto.avatarUrl,
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
    });

    const account = await this.accountService.findAccountByEmail(
      signupDto.email,
    );

    if (!account) {
      throw new BadRequestException('Unable to create account');
    }

    await this.issueVerificationEmail(account);

    return {
      message: 'Signup successful. Please verify your email.',
      data: null,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const accountId = await this.authTokenService.getSubjectId(
      VERIFY_EMAIL_TOKEN_PREFIX,
      verifyEmailDto.token,
    );

    if (!accountId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const account = await this.accountService.findOne(accountId);

    if (!account) {
      throw new BadRequestException('Account cannot be verified');
    }

    if (account.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Email is already verified');
    }

    if (account.status !== UserStatus.UNVERIFIED) {
      throw new BadRequestException('Account cannot be verified');
    }

    const activatedAccount = await this.prismaService.accounts.update({
      where: { id: account.id },
      data: { status: UserStatus.ACTIVE },
    });

    await this.authTokenService.invalidateToken(
      {
        tokenPrefix: VERIFY_EMAIL_TOKEN_PREFIX,
        subjectPrefix: VERIFY_EMAIL_USER_PREFIX,
        cooldownPrefix: VERIFY_EMAIL_COOLDOWN_PREFIX,
      },
      account.id,
      verifyEmailDto.token,
    );

    const deviceId = verifyEmailDto.deviceId?.trim();
    const deviceType = verifyEmailDto.deviceType ?? DeviceType.WEB;
    const tokens = deviceId
      ? await this.rotateVerifiedSession(activatedAccount, deviceId, deviceType)
      : null;

    return {
      message: 'Email verified successfully',
      data: tokens,
    };
  }

  async resendVerificationEmail(userId: string) {
    const account = await this.accountService.findOne(userId);

    if (!account) {
      throw new BadRequestException('Account cannot be verified');
    }

    if (account.status === UserStatus.ACTIVE) {
      return {
        message: 'Email is already verified',
        data: null,
      };
    }

    if (account.status !== UserStatus.UNVERIFIED) {
      throw new BadRequestException('Account cannot be verified');
    }

    await this.assertVerificationCooldown(account.id);
    await this.issueVerificationEmail(account);
    await this.authTokenService.setCooldown(
      VERIFY_EMAIL_COOLDOWN_PREFIX,
      account.id,
      this.emailVerificationConfig.resendCooldownSeconds,
    );

    return {
      message: 'Verification email sent',
      data: null,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const account = await this.accountService.findAccountByEmail(
      forgotPasswordDto.email,
    );

    if (!account || account.status !== UserStatus.ACTIVE) {
      return {
        message: PASSWORD_RESET_SUCCESS_MESSAGE,
        data: null,
      };
    }

    await this.authTokenService.assertCooldown(
      PASSWORD_RESET_COOLDOWN_PREFIX,
      account.id,
      this.passwordRecoveryConfig.resendCooldownSeconds,
      (waitSeconds) =>
        `Please wait ${waitSeconds} seconds before requesting another password reset email`,
    );

    const { token } = await this.authTokenService.rotateToken({
      tokenPrefix: PASSWORD_RESET_TOKEN_PREFIX,
      subjectPrefix: PASSWORD_RESET_USER_PREFIX,
      subjectId: account.id,
      ttlSeconds: this.passwordRecoveryConfig.ttlSeconds,
    });

    await this.mailQueueService.enqueuePasswordResetEmail(
      account,
      token,
      this.passwordRecoveryConfig.ttlSeconds,
    );
    await this.authTokenService.setCooldown(
      PASSWORD_RESET_COOLDOWN_PREFIX,
      account.id,
      this.passwordRecoveryConfig.resendCooldownSeconds,
    );

    return {
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
      data: null,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const accountId = await this.authTokenService.getSubjectId(
      PASSWORD_RESET_TOKEN_PREFIX,
      resetPasswordDto.token,
    );

    if (!accountId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const account = await this.prismaService.accounts.findUnique({
      where: {
        id: accountId,
        status: UserStatus.ACTIVE,
      },
    });

    if (!account) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(resetPasswordDto.password);

    await this.prismaService.accounts.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });
    await this.authTokenService.invalidateToken(
      {
        tokenPrefix: PASSWORD_RESET_TOKEN_PREFIX,
        subjectPrefix: PASSWORD_RESET_USER_PREFIX,
        cooldownPrefix: PASSWORD_RESET_COOLDOWN_PREFIX,
      },
      account.id,
      resetPasswordDto.token,
    );
    await this.prismaService.sessions.updateMany({
      where: {
        userId: account.id,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return {
      message: 'Password reset successfully',
      data: null,
    };
  }

  async changePassword(
    userPayload: TokenPayload,
    changePasswordDto: ChangePasswordDto,
  ) {
    const account = await this.prismaService.accounts.findUnique({
      where: {
        id: userPayload.sub,
        status: UserStatus.ACTIVE,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid user');
    }

    const isCurrentPasswordValid = await argon2.verify(
      account.password,
      changePasswordDto.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const isSamePassword = await argon2.verify(
      account.password,
      changePasswordDto.newPassword,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await argon2.hash(changePasswordDto.newPassword);

    await this.prismaService.accounts.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });
    await this.prismaService.sessions.updateMany({
      where: {
        userId: account.id,
        deviceId: {
          not: userPayload.deviceId,
        },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return {
      message: 'Password changed successfully',
      data: null,
    };
  }

  async signin(signinDto: SigninDto, deviceType: DeviceType) {
    const account = await this.accountService.findAccountByEmail(
      signinDto.email,
    );

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatchPassword = await argon2.verify(
      account.password,
      signinDto.password,
    );

    if (!isMatchPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      account.status !== UserStatus.ACTIVE &&
      account.status !== UserStatus.UNVERIFIED
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.manageUserToken(account, signinDto.deviceId);

    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    // Avoiding multiple sessions with same deviceId for the same user, we use upsert to update existing session or create new one
    await this.prismaService.sessions.upsert({
      where: {
        userId_deviceId: {
          userId: account.id,
          deviceId: signinDto.deviceId,
        },
      },
      update: {
        refreshToken: hashedRefreshToken,
        expiresAt: this.getExpiryDate(this.jwtConfig.refreshTokenExpiresIn),
        isRevoked: false,
      },
      create: {
        userId: account.id,
        refreshToken: hashedRefreshToken,
        deviceId: signinDto.deviceId,
        deviceType: deviceType,
        expiresAt: this.getExpiryDate(this.jwtConfig.refreshTokenExpiresIn),
      },
    });

    return {
      message: 'Signin successful',
      data: tokens,
    };
  }

  async getGoogleAuthorizationUrl(query: GoogleSigninQueryDto) {
    const state = uuidv4();
    const redirectPath = this.getSafeRedirectPath(query.redirectPath);

    await this.redisService.setJson<GoogleOAuthState>(
      this.getGoogleOAuthStateKey(state),
      {
        deviceId: query.deviceId,
        ...(redirectPath ? { redirectPath } : {}),
        ...(query.clientState ? { clientState: query.clientState } : {}),
      },
      this.googleAuthConfig.stateTtlSeconds,
    );

    return this.googleAuthService.buildAuthorizationUrl(state);
  }

  async signinWithGoogleCode(query: GoogleCallbackQueryDto) {
    if (!query.code || !query.state) {
      throw new BadRequestException(
        'Google OAuth callback is missing code or state',
      );
    }

    const stateKey = this.getGoogleOAuthStateKey(query.state);
    const state = await this.redisService.getJson<GoogleOAuthState>(stateKey);

    if (!state) {
      throw new BadRequestException('Google OAuth state is invalid or expired');
    }

    await this.redisService.del(stateKey);
    const idToken = await this.googleAuthService.exchangeCodeForIdToken(
      query.code,
    );
    const result = await this.signinWithGoogleIdToken(
      {
        idToken,
        deviceId: state.deviceId,
      },
      DeviceType.WEB,
    );

    return {
      tokens: result.data,
      redirectUrl: this.buildGoogleSuccessRedirectUrl(
        result.data.accessToken,
        state.redirectPath,
        state.clientState,
      ),
    };
  }

  async signinWithGoogleIdToken(
    googleSigninDto: GoogleMobileSigninDto,
    deviceType: DeviceType,
  ) {
    const profile = await this.googleAuthService.verifyIdToken(
      googleSigninDto.idToken,
    );
    const account = await this.resolveGoogleAccount(profile);
    const tokens = await this.rotateVerifiedSession(
      account,
      googleSigninDto.deviceId,
      deviceType,
    );

    return {
      message: 'Google signin successful',
      data: tokens,
    };
  }

  async logout(userId: string, deviceId: string) {
    const account = await this.accountService.findOne(userId);

    if (!account) {
      throw new UnauthorizedException('Invalid user');
    }

    await this.prismaService.sessions.updateMany({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return {
      message: 'Logout successful',
      data: null,
    };
  }

  async refreshToken(userPayload: TokenPayload, refreshToken: string) {
    const session = await this.prismaService.sessions.findFirst({
      where: {
        userId: userPayload.sub,
        deviceId: userPayload.deviceId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    const isValidRefreshToken = await argon2.verify(
      session.refreshToken,
      refreshToken,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.generateToken(
      userPayload,
      JwtTokenType.AccessToken,
      this.jwtConfig.accessTokenExpiresIn,
    );

    return {
      message: 'Token refreshed successfully',
      data: {
        accessToken: accessToken,
      },
    };
  }

  buildGoogleFailureRedirectUrl(message: string) {
    return this.appendQueryToUrl(this.googleAuthConfig.failureRedirectUrl, {
      googleError: message,
    });
  }

  private async resolveGoogleAccount(profile: GoogleAccountProfile) {
    if (!profile.emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const providerIdentity = await this.prismaService.auth_providers.findUnique(
      {
        where: {
          provider_providerAccountId: {
            provider: AuthProvider.GOOGLE,
            providerAccountId: profile.providerAccountId,
          },
        },
        include: {
          account: true,
        },
      },
    );

    if (providerIdentity) {
      return this.assertGoogleAccountCanSignin(providerIdentity.account);
    }

    const existingAccount = await this.accountService.findAccountByEmail(
      profile.email,
    );

    if (existingAccount) {
      return this.prismaService.$transaction((transaction) =>
        this.linkGoogleProviderIdentity(transaction, existingAccount, profile),
      );
    }

    const password = await argon2.hash(randomBytes(32).toString('hex'));

    return this.prismaService.$transaction(async (transaction) => {
      const account = await transaction.accounts.create({
        data: {
          email: profile.email,
          name: profile.name,
          password,
          avatarUrl: profile.picture ?? '',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });
      await this.createGoogleProviderIdentity(transaction, profile, account.id);

      return account;
    });
  }

  private assertGoogleAccountCanSignin(account: accounts) {
    if (
      account.status === UserStatus.BANNED ||
      account.status === UserStatus.DELETED
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (account.status === UserStatus.UNVERIFIED) {
      return this.prismaService.accounts.update({
        where: { id: account.id },
        data: { status: UserStatus.ACTIVE },
      });
    }

    return account;
  }

  private async linkGoogleProviderIdentity(
    transaction: GoogleAccountLinkClient,
    account: accounts,
    profile: GoogleAccountProfile,
  ) {
    const activeAccount = await this.activateGoogleLinkedAccount(
      transaction,
      account,
    );
    await this.createGoogleProviderIdentity(
      transaction,
      profile,
      activeAccount.id,
    );

    return activeAccount;
  }

  private async activateGoogleLinkedAccount(
    transaction: Pick<Prisma.TransactionClient, 'accounts'>,
    account: accounts,
  ) {
    if (
      account.status === UserStatus.BANNED ||
      account.status === UserStatus.DELETED
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (account.status !== UserStatus.UNVERIFIED) {
      return account;
    }

    return transaction.accounts.update({
      where: { id: account.id },
      data: { status: UserStatus.ACTIVE },
    });
  }

  private createGoogleProviderIdentity(
    transaction: GoogleProviderIdentityClient,
    profile: GoogleAccountProfile,
    accountId: string,
  ) {
    return transaction.auth_providers.create({
      data: {
        provider: AuthProvider.GOOGLE,
        providerAccountId: profile.providerAccountId,
        accountId,
        email: profile.email,
      },
    });
  }

  private buildGoogleSuccessRedirectUrl(
    accessToken: string,
    redirectPath?: string,
    clientState?: string,
  ) {
    const successRedirectUrl = redirectPath
      ? this.withRedirectPath(
          this.googleAuthConfig.successRedirectUrl,
          redirectPath,
        )
      : this.googleAuthConfig.successRedirectUrl;
    const fragment = new URLSearchParams({ googleAccessToken: accessToken });

    if (clientState) {
      fragment.set('googleState', clientState);
    }

    return `${successRedirectUrl}#${fragment.toString()}`;
  }

  private appendQueryToUrl(url: string, query: Record<string, string>) {
    const entries = Object.entries(query).filter(([, value]) => value);

    if (entries.length === 0) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams(entries).toString();

    return `${url}${separator}${params}`;
  }

  private withRedirectPath(url: string, redirectPath: string) {
    const redirectUrl = new URL(url);
    redirectUrl.pathname = redirectPath;
    redirectUrl.search = '';
    redirectUrl.hash = '';

    return redirectUrl.toString();
  }

  private getGoogleOAuthStateKey(state: string) {
    return `${GOOGLE_OAUTH_STATE_PREFIX}:${state}`;
  }

  private getSafeRedirectPath(redirectPath?: string) {
    if (
      !redirectPath ||
      !redirectPath.startsWith('/') ||
      redirectPath.startsWith('//')
    ) {
      return undefined;
    }

    return redirectPath;
  }

  private async manageUserToken(account: accounts, deviceId: string) {
    const tokenPayload: TokenPayload = {
      sub: account.id,
      role: account.role,
      status: account.status,
      type: JwtTokenType.AccessToken, // Default to AccessToken, will be overridden in generateToken
      deviceId: deviceId,
      email: account.email,
      name: account.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(
        tokenPayload,
        JwtTokenType.AccessToken,
        this.jwtConfig.accessTokenExpiresIn,
      ),
      this.generateToken(
        tokenPayload,
        JwtTokenType.RefreshToken,
        this.jwtConfig.refreshTokenExpiresIn,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async rotateVerifiedSession(
    account: accounts,
    deviceId: string,
    deviceType: DeviceType,
  ) {
    const tokens = await this.manageUserToken(account, deviceId);
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);

    await this.prismaService.sessions.upsert({
      where: {
        userId_deviceId: {
          userId: account.id,
          deviceId,
        },
      },
      update: {
        refreshToken: hashedRefreshToken,
        deviceType,
        expiresAt: this.getExpiryDate(this.jwtConfig.refreshTokenExpiresIn),
        isRevoked: false,
      },
      create: {
        userId: account.id,
        refreshToken: hashedRefreshToken,
        deviceId,
        deviceType,
        expiresAt: this.getExpiryDate(this.jwtConfig.refreshTokenExpiresIn),
      },
    });

    return tokens;
  }

  private async issueVerificationEmail(account: VerificationAccount) {
    const { token } = await this.authTokenService.rotateToken({
      tokenPrefix: VERIFY_EMAIL_TOKEN_PREFIX,
      subjectPrefix: VERIFY_EMAIL_USER_PREFIX,
      subjectId: account.id,
      ttlSeconds: this.emailVerificationConfig.ttlSeconds,
    });
    await this.mailQueueService.enqueueVerificationEmail(account, token);
  }

  private async assertVerificationCooldown(userId: string) {
    await this.authTokenService.assertCooldown(
      VERIFY_EMAIL_COOLDOWN_PREFIX,
      userId,
      this.emailVerificationConfig.resendCooldownSeconds,
      (waitSeconds) =>
        `Please wait ${waitSeconds} seconds before requesting another verification email`,
    );
  }

  private async generateToken(
    payload: TokenPayload,
    type: JwtTokenType,
    expiresIn: number | string,
  ) {
    const tokenPayload: TokenPayload = {
      ...payload,
      type,
    };

    const options: Partial<JwtSignOptions> = {
      expiresIn: expiresIn,
    } as unknown as JwtSignOptions;

    return this.jwtService.signAsync(tokenPayload, options);
  }

  private getExpiryDate(expiresIn: string) {
    const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);

    if (!match) {
      throw new Error(`Unsupported token expiry format: ${expiresIn}`);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }
}
