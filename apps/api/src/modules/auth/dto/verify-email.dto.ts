import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  deviceType: DeviceType = DeviceType.WEB;
}
