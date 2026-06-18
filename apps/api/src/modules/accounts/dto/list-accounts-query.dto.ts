import { IsDateString, IsOptional } from 'class-validator';

export class ListAccountsQueryDto {
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}
