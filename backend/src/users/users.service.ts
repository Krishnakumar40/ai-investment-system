import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Portfolio } from '../portfolios/portfolio.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Portfolio)
    private portfoliosRepository: Repository<Portfolio>,
  ) {}

  async registerUser(telegramChatId: string, username?: string): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { telegramChatId } });
    if (!user) {
      this.logger.log(`Creating new user for chat ID: ${telegramChatId}`);
      user = this.usersRepository.create({
        telegramChatId,
        username,
      });
      await this.usersRepository.save(user);
    } else {
       // Update username if changed
       if (username && user.username !== username) {
           user.username = username;
           await this.usersRepository.save(user);
       }
    }
    return user;
  }

  async findOne(telegramChatId: string): Promise<User | null> {
    // Also load portfolios
    return this.usersRepository.findOne({ where: { telegramChatId }, relations: ['portfolios'] });
  }

  async findAll(): Promise<User[]> {
      return this.usersRepository.find({ relations: ['portfolios'] }); // Load portfolios for scan
  }

  async addPortfolio(chatId: string, symbol: string, quantity: number = 1, averagePrice: number = 0) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId: chatId } });
      if (!user) throw new Error('User not registered. Send /start.');

      const existing = await this.portfoliosRepository.findOne({ 
          where: { 
              user: { id: user.id }, 
              stockSymbol: symbol.toUpperCase() 
          } 
      });
      
      if (existing) {
          // Update existing holding
          existing.quantity = quantity;
          existing.averagePrice = averagePrice;
          return this.portfoliosRepository.save(existing);
      }

      const portfolio = this.portfoliosRepository.create({
          stockSymbol: symbol.toUpperCase(),
          quantity: quantity, 
          averagePrice: averagePrice,
          currentAllocationPercent: 0,
          user: user
      });
      return this.portfoliosRepository.save(portfolio);
  }

  async setBudget(telegramChatId: string, budget: number) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId } });
      if (!user) throw new Error('User not found');
      user.budget = budget;
      return this.usersRepository.save(user);
  }

  async setBalance(telegramChatId: string, balance: number) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId } });
      if (!user) throw new Error('User not found');
      user.cashBalance = balance;
      return this.usersRepository.save(user);
  }

  async addBalance(telegramChatId: string, amount: number) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId } });
      if (!user) throw new Error('User not found');
      user.cashBalance = Number(user.cashBalance) + amount;
      return this.usersRepository.save(user);
  }

  async sellPortfolio(chatId: string, symbol: string, qty: number, price: number) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId: chatId }, relations: ['portfolios'] });
      if (!user) throw new Error('User not found');

      const item = user.portfolios.find(p => p.stockSymbol === symbol.toUpperCase());
      if (!item || item.quantity < qty) throw new Error(`Not enough quantity to sell. You have ${item?.quantity || 0}.`);

      item.quantity -= qty;
      user.cashBalance = Number(user.cashBalance) + (qty * price);

      if (item.quantity === 0) {
          await this.portfoliosRepository.remove(item);
      } else {
          await this.portfoliosRepository.save(item);
      }
      return this.usersRepository.save(user);
  }

  async resetUser(chatId: string) {
      const user = await this.usersRepository.findOne({ where: { telegramChatId: chatId }, relations: ['portfolios'] });
      if (!user) return;
      
      if (user.portfolios.length > 0) {
          await this.portfoliosRepository.remove(user.portfolios);
      }
      user.cashBalance = 0;
      user.budget = 0;
      return this.usersRepository.save(user);
  }
}
