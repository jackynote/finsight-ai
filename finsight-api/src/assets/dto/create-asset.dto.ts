import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { AssetCategory } from '../../common/enums/asset-category.enum';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AssetCategory)
  @IsNotEmpty()
  category: AssetCategory;

  @IsNumber()
  @Min(0)
  purchase_price: number;

  @IsNumber()
  @Min(0)
  current_price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
