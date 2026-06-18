import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfiguration } from '../../config';
import { AccountsModule } from '../accounts/accounts.module';
import { RedisModule } from '../../common/redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { AuthTokenService } from './services/auth-token.service';
import { GoogleAuthService } from './services/google-auth.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [jwtConfiguration.KEY],
      useFactory: (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        secret: jwtConfig.secret,
      }),
    }),
    AccountsModule,
    RedisModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    GoogleAuthService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
