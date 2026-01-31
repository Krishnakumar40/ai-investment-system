import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_decisions')
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_symbol' })
  stockSymbol: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE', name: 'analysis_date' })
  analysisDate: string;

  @Column({ type: 'int', nullable: true, name: 'fundamental_score' })
  fundamentalScore: number;

  @Column({ type: 'int', nullable: true, name: 'technical_score' })
  technicalScore: number;

  @Column({ type: 'int', nullable: true, name: 'market_score' })
  marketScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'final_score', nullable: true })
  finalScore: number;

  @Column({ length: 10, nullable: true })
  recommendation: string; // BUY, HOLD, SELL

  @Column({ type: 'int', nullable: true, name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'text', nullable: true })
  reasoning: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
