import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { PortfolioValue } from './portfolio-value.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);

  constructor(
    @InjectRepository(PortfolioValue)
    private portfolioValuesRepository: Repository<PortfolioValue>,
  ) {}

  async savePortfolioSnapshot(user: User, totalInvested: number, totalMarketValue: number, cashBalance: number) {
    const today = new Date().toISOString().split('T')[0];
    
    // UPSERT: Update if exists for today, else create
    let snapshot = await this.portfolioValuesRepository.findOne({ 
        where: { user: { id: user.id }, date: today } 
    });

    if (snapshot) {
        snapshot.totalInvested = totalInvested;
        snapshot.totalMarketValue = totalMarketValue;
        snapshot.cashBalance = cashBalance;
    } else {
        snapshot = this.portfolioValuesRepository.create({
            user,
            date: today,
            totalInvested,
            totalMarketValue,
            cashBalance
        });
    }

    return this.portfolioValuesRepository.save(snapshot);
  }

  async getMonthlyPerformance(chatId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const snapshots = await this.portfolioValuesRepository.find({
        where: { 
            user: { telegramChatId: chatId },
            date: MoreThanOrEqual(dateStr)
        },
        order: { date: 'ASC' }
    });

    if (snapshots.length < 2) return null;

    const start = snapshots[0];
    const end = snapshots[snapshots.length - 1];

    const startTotal = Number(start.totalMarketValue) + Number(start.cashBalance);
    const lastTotal = Number(end.totalMarketValue) + Number(end.cashBalance);
    
    const absoluteChange = lastTotal - startTotal;
    const percentageChange = startTotal > 0 ? (absoluteChange / startTotal) * 100 : 0;

    return {
        startTotal,
        lastTotal,
        percentageChange,
        days: snapshots.length
    };
  }
}
