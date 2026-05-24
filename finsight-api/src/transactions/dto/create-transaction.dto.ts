import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionCategory } from '../../common/enums/transaction-category.enum';

export class CreateTransactionDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(TransactionCategory)
  @IsNotEmpty()
  category: TransactionCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['income', 'expense'])
  @IsNotEmpty()
  type: 'income' | 'expense';
}
