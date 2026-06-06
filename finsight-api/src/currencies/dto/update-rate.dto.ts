import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { RatePlatform } from '../enums/rate-platform.enum';

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
  @IsEnum(RatePlatform)
  platform?: RatePlatform | null;

  @IsOptional()
  @IsString()
  coingecko_id?: string | null;
}
