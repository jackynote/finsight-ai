import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('transaction_categories')
export class TransactionCategoryEntity extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  value: string;
}
