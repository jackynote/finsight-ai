import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('currency_rates')
export class CurrencyRate extends BaseEntity {
  @Index({ unique: true })
  @Column()
  pair: string;

  @Column()
  base_currency_code: string;

  @Column()
  quote_currency_code: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  ratio: number;

  @Column({ default: false })
  is_auto_update: boolean;

  @Column({ type: 'varchar', nullable: true })
  platform: string | null;
}
