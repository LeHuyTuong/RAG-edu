import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  //TODO: this only for mvp, remove and uncomment the line below when we have school module
  @IsOptional()
  //@IsNotEmpty()
  @IsString()
  schoolId!: string;
}
