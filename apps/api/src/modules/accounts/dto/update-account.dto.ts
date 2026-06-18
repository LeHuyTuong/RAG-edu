import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a URL address' })
  avatarUrl?: string;
}
