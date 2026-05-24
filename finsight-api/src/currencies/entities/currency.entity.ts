import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AssetCategory } from '../../common/enums/asset-category.enum';
import { CurrencyRate } from './currency-rate.entity';

@Entity('currencies')
export class Currency extends BaseEntity {
  @Column({ unique: true })
  code: string; // e.g., 'USD', 'BTC', 'VND'

  @Column()
  name: string;

  @Column({ nullable: true })
  symbol: string; // e.g., '$', '₿', '₫'

  @Column({
    type: 'enum',
    enum: AssetCategory,
    default: AssetCategory.OTHER,
  })
  type: AssetCategory;

  @OneToMany(() => CurrencyRate, (rate) => rate.currency)
  rates: CurrencyRate[];
}
