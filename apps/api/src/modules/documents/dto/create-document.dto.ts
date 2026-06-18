import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  fileUrl!: string;

  @IsString()
  publicId!: string;

  @IsNumber()
  sizeInBytes!: number;

  @IsString()
  format!: string;

  @IsString()
  resourceType!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subjectId?: string;

  @IsNotEmpty()
  @IsBoolean()
  isPublic!: boolean;
}
