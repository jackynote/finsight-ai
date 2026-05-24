import { IsNumber, IsPositive } from 'class-validator';

export class UpdateRateDto {
  @IsNumber()
  @IsPositive()
  rate_to_usd: number;
}
