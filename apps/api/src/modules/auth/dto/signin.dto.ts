import { DeviceType } from '@prisma/client';
import type { AuthDeviceInfo } from './signup.dto';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class SigninDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}
