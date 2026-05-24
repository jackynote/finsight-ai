import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Currency } from './currency.entity';

@Entity('currency_rates')
export class CurrencyRate extends BaseEntity {
  @Column()
  currency_id: string;

  @ManyToOne(() => Currency, (currency) => currency.rates)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate_to_usd: number;
}
