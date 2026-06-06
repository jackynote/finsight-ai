import { IsDateString, IsEnum, IsNotEmpty, IsNumber, NotEquals, IsOptional, IsString, Min } from 'class-validator';
import { AssetCategory } from '../../common/enums/asset-category.enum';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AssetCategory)
  @IsNotEmpty()
  category: AssetCategory;

  @IsString()
  @IsOptional()
  currency_id?: string;

  @IsNumber()
  @Min(0)
  purchase_price: number;

  @IsString()
  @IsOptional()
  purchase_currency_id?: string;

  @IsNumber()
  @NotEquals(0)
  quantity: number;

  @IsDateString()
  @IsOptional()
  date?: string;
}
