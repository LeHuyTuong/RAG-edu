import { DocumentStatus } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEAN,
  IsEnum,
} from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  subjectId?: string;
}
