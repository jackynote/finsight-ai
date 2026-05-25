import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('ai_insights')
export class AIInsight extends BaseEntity {
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  type: string; // success, warning, info
}
