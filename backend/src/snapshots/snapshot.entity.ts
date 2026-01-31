import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('daily_snapshots')
@Unique(['stockSymbol', 'date'])
export class Snapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_symbol' })
  stockSymbol: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'close_price', nullable: true })
  closePrice: number;

  @Column({ type: 'bigint', nullable: true })
  volume: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'ema_50', nullable: true })
  ema50: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'ema_200', nullable: true })
  ema200: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rsi_14', nullable: true })
  rsi14: number;

  @Column({ name: 'trend_status', nullable: true })
  trendStatus: string;
}
