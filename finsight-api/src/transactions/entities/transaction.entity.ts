import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { TransactionCategoryEntity } from '../../transaction-categories/entities/transaction-category.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  currency_id: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column()
  category_code: string;

  @ManyToOne(() => TransactionCategoryEntity)
  @JoinColumn({ name: 'category_code', referencedColumnName: 'code' })
  category: TransactionCategoryEntity;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense';
}
