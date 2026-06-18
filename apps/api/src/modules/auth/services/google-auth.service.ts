import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { googleAuthConfiguration } from '../../../config';

export interface GoogleAccountProfile {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}

@Injectable()
export class GoogleAuthService {
  private readonly webClient: OAuth2Client;
  private readonly mobileClient: OAuth2Client;

  constructor(
    @Inject(googleAuthConfiguration.KEY)
    private readonly googleAuthConfig: ConfigType<
      typeof googleAuthConfiguration
    >,
  ) {
    this.webClient = new OAuth2Client(
      googleAuthConfig.webClientId,
      googleAuthConfig.clientSecret,
      googleAuthConfig.callbackUrl,
    );
    this.mobileClient = new OAuth2Client();
  }

  buildAuthorizationUrl(state: string) {
    return this.webClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  async exchangeCodeForIdToken(code: string) {
    const { tokens } = await this.webClient.getToken(code);

    if (!tokens.id_token) {
      throw new BadRequestException('Google OAuth response missing id token');
    }

    return tokens.id_token;
  }

  async verifyIdToken(idToken: string): Promise<GoogleAccountProfile> {
    const ticket = await this.mobileClient.verifyIdToken({
      idToken,
      audience: [
        this.googleAuthConfig.webClientId,
        this.googleAuthConfig.iosClientId,
        this.googleAuthConfig.androidClientId,
      ],
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new BadRequestException('Google id token missing required claims');
    }

    return {
      providerAccountId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified === true,
      name: payload.name || payload.email,
      picture: payload.picture ?? null,
    };
  }
}
