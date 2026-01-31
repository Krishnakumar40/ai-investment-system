import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

// We will add circular dependency later or use string reference for Portfolio
import { Portfolio } from '../portfolios/portfolio.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, name: 'telegram_chat_id' })
  telegramChatId: string; // TypeORM maps bigint to string in JS to preserve precision

  @Column({ nullable: true })
  username: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  budget: number; // Max price per stock user is willing to pay

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'cash_balance' })
  cashBalance: number; // Total available funds

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ default: 'balanced', name: 'risk_profile' })
  riskProfile: string;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
