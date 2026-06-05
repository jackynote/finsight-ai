import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateRateDto {
  @IsOptional()
  @IsString()
  pair?: string;

  @IsNumber()
  @IsPositive()
  ratio: number;

  @IsOptional()
  @IsBoolean()
  is_auto_update?: boolean;

  @IsOptional()
  @IsString()
  platform?: string | null;
}
