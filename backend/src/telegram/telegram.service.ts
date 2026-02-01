import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;

  constructor(
    private configService: ConfigService, 
    private usersService: UsersService,
    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
      return;
    }

    try {
        this.logger.log(`🤖 Initializing Telegram Bot...`);
        this.bot = new TelegramBot(token, { polling: true });
        
        this.bot.on('polling_error', (error: any) => {
            this.logger.error(`[POLLING ERROR] ${error.code || 'UNKNOWN'}: ${error.message}`);
        });

        this.bot.on('webhook_error', (error: any) => {
            this.logger.error(`[WEBHOOK ERROR] ${error.code || 'UNKNOWN'}: ${error.message}`);
        });

        this.logger.log('✅ Telegram Bot Initialized and Polling started.');
    } catch (e) {
        this.logger.error(`❌ Failed to initialize Telegram Bot: ${e.message}`);
    }

    this.bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id.toString();
        const username = msg.from?.username || msg.from?.first_name || 'User';
        await this.usersService.registerUser(chatId, username);
        this.bot.sendMessage(msg.chat.id, `Welcome ${username}! You are registered. Check /status.`);
    });

      this.bot.onText(/\/status/, async (msg) => {
          const chatId = msg.chat.id.toString();
          const user = await this.usersService.findOne(chatId);
          let message = 'System Status: 🟢 Online\n';
          if (user) {
              message += `💰 **Available Cash**: Rs. ${user.cashBalance}\n`;
              message += `🎯 **Budget Filter**: Rs. ${user.budget}\n`;
          }
          this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      });

      this.bot.onText(/\/balance (\d+)/, async (msg, match) => {
          const chatId = msg.chat.id.toString();
          if (!match || !match[1]) return;
          const balance = parseFloat(match[1]);
          try {
              await this.usersService.setBalance(chatId, balance);
              this.bot.sendMessage(chatId, `💵 Wallet updated! Current balance: **Rs. ${balance}**.`, { parse_mode: 'Markdown' });
          } catch (e) {
              this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
          }
      });

      this.bot.onText(/\/addcash (\d+)/, async (msg, match) => {
          const chatId = msg.chat.id.toString();
          if (!match || !match[1]) return;
          const amount = parseFloat(match[1]);
          try {
              await this.usersService.addBalance(chatId, amount);
              this.bot.sendMessage(chatId, `➕ Added **Rs. ${amount}** to your wallet.`, { parse_mode: 'Markdown' });
          } catch (e) {
              this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
          }
      });

      this.bot.onText(/\/buy (.+)/, async (msg, match) => {
          const chatId = msg.chat.id.toString();
          if (!match || !match[1]) return;
          
          const args = match[1].split(' ');
          const symbol = args[0].toUpperCase();
          const qty = args[1] ? parseInt(args[1]) : 1;
          const price = args[2] ? parseFloat(args[2]) : 0;

          if (price === 0) {
              return this.bot.sendMessage(chatId, "⚠️ Please provide a price: `/buy SYMBOL QTY PRICE`", { parse_mode: 'Markdown' });
          }

          try {
              const cost = qty * price;
              await this.usersService.addPortfolio(chatId, symbol, qty, price);
              await this.usersService.addBalance(chatId, -cost);
              
              this.bot.sendMessage(chatId, `🚀 **Trade Logged!**\nBought **${qty} shares** of **${symbol}** @ Rs. ${price}.\nTotal Cost: Rs. ${cost}.\n*Wallet auto-deducted.*`, { parse_mode: 'Markdown' });
          } catch (e) {
              this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
          }
      });

     this.bot.onText(/\/add (.+)/, async (msg, match) => {
         const chatId = msg.chat.id.toString();
         if (!match || !match[1]) return;
         
         // Parse input: "TATASTEEL 10 150" -> Symbol: TATASTEEL, Qty: 10, Price: 150
         const args = match[1].split(' ');
         const symbol = args[0].toUpperCase();
         const qty = args[1] ? parseInt(args[1]) : 1;
         const price = args[2] ? parseFloat(args[2]) : 0;

         try {
             await this.usersService.addPortfolio(chatId, symbol, qty, price);
             let reply = `✅ **Tracked:** ${symbol}\n`;
             if (qty > 1) reply += `📊 **Qty:** ${qty}\n`;
             if (price > 0) reply += `💰 **Avg Price:** Rs. ${price}\n`;
             reply += `\nI will now analyze this position daily.`;
             
             this.bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
         } catch (e) {
             this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
         }
     });

     this.bot.onText(/\/budget (\d+)/, async (msg, match) => {
         const chatId = msg.chat.id.toString();
         if (!match || !match[1]) return;
         const budget = parseFloat(match[1]);
         try {
             await this.usersService.setBudget(chatId, budget);
             this.bot.sendMessage(chatId, `💰 Budget set to **Rs. ${budget}**. \nI will now suggest stocks below this price.`, { parse_mode: 'Markdown' });
         } catch (e) {
             this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
         }
     });

      this.bot.onText(/\/sell (.+)/, async (msg, match) => {
          const chatId = msg.chat.id.toString();
          if (!match || !match[1]) return;
          
          const args = match[1].split(' ');
          const symbol = args[0].toUpperCase();
          const qty = args[1] ? parseInt(args[1]) : 1;
          const price = args[2] ? parseFloat(args[2]) : 0;

          if (price === 0) {
              return this.bot.sendMessage(chatId, "⚠️ Provide sell price: `/sell SYMBOL QTY PRICE`", { parse_mode: 'Markdown' });
          }

          try {
              await this.usersService.sellPortfolio(chatId, symbol, qty, price);
              const gain = qty * price;
              this.bot.sendMessage(chatId, `📉 **Sale Logged!**\nSold **${qty} shares** of **${symbol}** @ Rs. ${price}.\nReceived: Rs. ${gain}.\n*Wallet auto-updated.*`, { parse_mode: 'Markdown' });
          } catch (e) {
              this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
          }
      });

      this.bot.onText(/\/reset/, async (msg) => {
          const chatId = msg.chat.id.toString();
          try {
              await this.usersService.resetUser(chatId);
              this.bot.sendMessage(chatId, "💣 **System Reset!** All portfolio data and wallet balance have been cleared.", { parse_mode: 'Markdown' });
          } catch (e) {
              this.bot.sendMessage(chatId, `❌ Error: ${e.message}`);
          }
      });

      this.bot.onText(/\/help/, (msg) => {
          const helpMessage = `
**AI Investment Commands:**
💰 **Wallet:**
/balance [amount] - Set total cash
/addcash [amount] - Top up cash

📈 **Trading:**
/buy [stock] [qty] [price] - Log buy & deduct cash
/sell [stock] [qty] [price] - Log sell & add cash
/add [stock] - Just track a stock

🔍 **Insights:**
/scan - Run full market analysis
/rebalance - Monthly wealth & rebalance report
/status - Check wallet & health
          `;
          this.bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
      });

      this.bot.onText(/\/rebalance/, async (msg) => {
          const chatId = msg.chat.id.toString();
          this.bot.sendMessage(chatId, "Calculating your Monthly Wealth Review... ⏳");
          const error = await this.tasksService.sendMonthlyRebalanceReport(chatId);
          if (error) {
              this.bot.sendMessage(chatId, error);
          }
      });

      this.bot.onText(/\/scan/, async (msg) => {
         this.bot.sendMessage(msg.chat.id, 'Running Pre-Market Scan now... ⏳');
         await this.tasksService.handlePreMarketScan();
         this.bot.sendMessage(msg.chat.id, 'Scan Complete. ✅');
     });
     
     // Log all messages
     this.bot.on('message', (msg) => {
         const user = msg.from?.username || msg.from?.first_name || `ID:${msg.chat.id}`;
         this.logger.debug(`Received message from ${user}: ${msg.text}`);
     });
  }

  async sendMessage(chatId: string, message: string) {
       if (this.bot) {
           await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
       }
  }

  async sendAlertToAll(message: string) {
      if (!this.bot) return;
      this.logger.log(`[ALERT BROADCAST] ${message}`);
      
      const users = await this.usersService.findAll();
      for (const user of users) {
          try {
              if (user.telegramChatId) {
                  await this.bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
              }
          } catch (e) {
              this.logger.error(`Failed to send alert to ${user.telegramChatId}: ${e.message}`);
          }
      }
  }
}
