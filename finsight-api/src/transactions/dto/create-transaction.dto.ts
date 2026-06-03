import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  IsString,
  Min,
} from 'class-validator';
export class CreateTransactionDto {
  @IsString()
  @IsOptional()
  category_code?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['income', 'expense'])
  @IsNotEmpty()
  type: 'income' | 'expense';

  @IsString()
  @IsOptional()
  currency_id?: string;
}
