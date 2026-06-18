import { IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleSigninQueryDto {
  @IsString()
  @MinLength(1)
  deviceId!: string;

  @IsOptional()
  @IsString()
  redirectPath?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  clientState?: string;
}
