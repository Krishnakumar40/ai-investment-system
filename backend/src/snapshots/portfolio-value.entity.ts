import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('portfolio_values')
@Unique(['user', 'date'])
export class PortfolioValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_invested' })
  totalInvested: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_market_value' })
  totalMarketValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_balance' })
  cashBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
