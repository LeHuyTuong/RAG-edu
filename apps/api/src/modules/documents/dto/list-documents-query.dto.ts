import { IsOptional, IsNumber, IsString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus } from '@prisma/client';

export class ListDocumentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  include?: string;
}
