import { IsString, MinLength } from 'class-validator';

export class GoogleMobileSigninDto {
  @IsString()
  @MinLength(1)
  idToken!: string;

  @IsString()
  @MinLength(1)
  deviceId!: string;
}
