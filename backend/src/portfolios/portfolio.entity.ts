import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_symbol' })
  stockSymbol: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'average_price' })
  averagePrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'current_allocation_percent' })
  currentAllocationPercent: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.portfolios)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
