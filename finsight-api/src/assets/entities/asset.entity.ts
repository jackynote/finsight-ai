import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { AssetCategory } from '../../common/enums/asset-category.enum';

@Entity('assets')
export class Asset extends BaseEntity {
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AssetCategory,
    default: AssetCategory.OTHER,
  })
  category: AssetCategory;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  purchase_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  current_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 6 })
  quantity: number;

  @Column({ type: 'date' })
  date: Date;
}
