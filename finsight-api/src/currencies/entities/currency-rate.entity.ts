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

  @Column()
  pair: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  ratio: number;

  @Column({ default: false })
  is_auto_update: boolean;

  @Column({ type: 'varchar', nullable: true })
  platform: string | null;
}
