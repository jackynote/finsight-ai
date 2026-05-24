import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { TransactionCategory } from '../../common/enums/transaction-category.enum';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
    default: TransactionCategory.OTHERS,
  })
  category: TransactionCategory;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense';
}
