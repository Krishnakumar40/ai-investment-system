import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalysisService } from '../analysis/analysis.service';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { SnapshotsService } from '../snapshots/snapshots.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private analysisService: AnalysisService,
    @Inject(forwardRef(() => TelegramService))
    private telegramService: TelegramService,
    private usersService: UsersService,
    private snapshotsService: SnapshotsService
  ) {}

  // 1. Nightly Portfolio Snapshot (11:50 PM IST)
  @Cron('0 50 23 * * *', { name: 'nightly_snapshot', timeZone: 'Asia/Kolkata' })
  async handleDailyPortfolioSnapshot() {
    this.logger.log('Recording nightly portfolio snapshots...');
    const users = await this.usersService.findAll();

    for (const user of users) {
        if (!user.portfolios || user.portfolios.length === 0) continue;

        let totalInvested = 0;
        let totalMarketValue = 0;

        for (const p of user.portfolios) {
            totalInvested += Number(p.quantity) * Number(p.averagePrice);
            try {
                const live = await this.analysisService.analyzeStock(p.stockSymbol);
                totalMarketValue += Number(p.quantity) * live.price;
            } catch {
                totalMarketValue += Number(p.quantity) * Number(p.averagePrice); // Fallback
            }
        }

        await this.snapshotsService.savePortfolioSnapshot(
            user, 
            totalInvested, 
            totalMarketValue, 
            Number(user.cashBalance)
        );
    }
    this.logger.log('Nightly snapshots complete.');
  }

  // 2. Monthly Rebalance (1st of every month at 9:00 AM IST)
  @Cron('0 0 9 1 * *', { name: 'monthly_rebalance', timeZone: 'Asia/Kolkata' })
  async handleMonthlyRebalance() {
    this.logger.log('Generating Monthly Rebalance reports (Cron)...');
    const users = await this.usersService.findAll();
    for (const user of users) {
        await this.sendMonthlyRebalanceReport(user.telegramChatId);
    }
  }

  async sendMonthlyRebalanceReport(chatId: string) {
    const perf = await this.snapshotsService.getMonthlyPerformance(chatId);
    if (!perf) {
        return "⚠️ Not enough historical data yet. I need at least 2 daily snapshots to compare.";
    }

    const user = await this.usersService.findOne(chatId);
    if (!user) return "User not found.";

    let message = `📅 **Monthly Wealth Review**\n\n`;
    message += `📊 **Growth**: ${perf.percentageChange >= 0 ? '📈' : '📉'} **${perf.percentageChange.toFixed(2)}%** this month.\n`;
    message += `💰 **Total Assets**: Rs. ${perf.lastTotal.toFixed(2)}\n\n`;

    message += `⚖️ **AI Rebalance Advice:**\n`;
    let adviceCount = 0;

    for (const p of user.portfolios) {
        const analysis = await this.analysisService.analyzeStock(p.stockSymbol);
        const currentVal = Number(p.quantity) * analysis.price;
        const allocation = (currentVal / perf.lastTotal) * 100;

        if (analysis.score < 40 && allocation > 15) {
            message += `• 🔴 **Trim ${p.stockSymbol}**: Stock score is low (${analysis.score}). Sell 20% to lock profit.\n`;
            adviceCount++;
        }
        else if (allocation > 25) {
            message += `• ⚠️ **Concentration**: ${p.stockSymbol} is ${allocation.toFixed(1)}% of your portfolio. Consider diversifying.\n`;
            adviceCount++;
        }
        else if (analysis.score > 80 && analysis.price < p.averagePrice) {
            message += `• 🟢 **Average Down ${p.stockSymbol}**: Currently below buy price but score is strong (${analysis.score}).\n`;
            adviceCount++;
        }
    }

    if (adviceCount === 0) {
        message += `✅ Your portfolio is well-balanced. No major changes needed.\n`;
    }

    message += `\n*Continue scanning daily for short-term opportunities.*`;
    
    await this.telegramService.sendMessage(chatId, message);
    return null;
  }

  // Pre-market scan at 8:30 AM IST
  @Cron('0 30 8 * * *', { name: 'pre_market_scan', timeZone: 'Asia/Kolkata' })
  async handlePreMarketScan() {
    this.logger.debug('Running pre-market scan...');
    // 1. Define Market Universe (Sector-wise Coverage)
    const marketUniverse = [
        // --- INDICES & ETFs ---
        'NIFTYBEES.NS', 'BANKBEES.NS', 'GOLDBEES.NS', 'SILVERBEES.NS',

        // --- BANKING & FINANCE ---
        'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK',
        'BAJFINANCE', 'BAJAJFINSV', 'JIOFIN', 'PFC', 'REC',

        // --- IT & TECH ---
        'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 

        // --- AUTO & EV ---
        'TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR',

        // --- ENERGY, OIL & POWER ---
        'RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'TATAPOWER', 'ADANIGREEN', 'BPCL', 'COALINDIA',

        // --- CONSUMER & FMCG ---
        'ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'TITAN', 
        'VBL', 'TRENT', 'DMART', 'ZOMATO', 'ASIANPAINT',

        // --- PHARMA & HEALTHCARE ---
        'SUNPHARMA', 'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'DIVISLAB',

        // --- METALS & COMMODITIES ---
        'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL',

        // --- INFRA, DEFENCE & RAILWAYS (High Growth) ---
        'LT', 'HAL', 'BEL', 'ADANIENT', 'ADANIPORTS', 'RVNL', 'IRFC', 'MAZDOCK'
    ];
    
    // Default list is now the entire market universe
    const allSymbols = new Set(marketUniverse);

    // 2. Fetch User Portfolios
    const users = await this.usersService.findAll();
    for (const user of users) {
        if (user.portfolios) {
            user.portfolios.forEach(p => allSymbols.add(p.stockSymbol));
        }
    }
    
    // 3. Scan Everything
    const watchlist = Array.from(allSymbols);
    this.logger.log(`Scanning Market (${watchlist.length} symbols)...`);

    let reportMap = new Map<string, any>(); 

    for (const symbol of watchlist) {
        try {
            const result = await this.analysisService.analyzeStock(symbol);
            reportMap.set(symbol, result);
            this.logger.log(`Analyzed ${symbol}: Score ${result.score} (${result.recommendation})`);
        } catch (e) {
            this.logger.error(`Failed to analyze ${symbol}: ${e.message}`);
        }
    }
    
    // 4. Send personalized reports based on BUDGET
    for (const user of users) {
        let message = "🌅 **Daily Market Insights**\n\n";
        
        // Helper to simplify technical jargon
        const simplifyReason = (reason: string) => {
            if (reason.includes("MACD")) return "Positive Momentum Signal";
            if (reason.includes("RSI")) return "Good Buying Zone";
            if (reason.includes("EMA")) return "Strong Uptrend";
            return reason;
        };

        // 4a. Portfolio Updates (Always show these, regardless of budget)
        const userPortfolioSymbols = user.portfolios ? user.portfolios.map(p => p.stockSymbol) : [];
        if (userPortfolioSymbols.length > 0) {
            message += "💼 **Your Portfolio Updates:**\n";
            for (const symbol of userPortfolioSymbols) {
                 const result = reportMap.get(symbol);
                 if (result) {
                    const simpleReason = simplifyReason(result.reasoning);
                    const icon = result.recommendation.includes('BUY') ? '🟢' : (result.recommendation.includes('SELL') ? '🔴' : '🟡');
                    message += `${icon} **${result.symbol}**\n   Action: ${result.recommendation}\n   Why: ${simpleReason}\n\n`;
                 }
            }
            message += "-----------------------------\n\n";
        }

        // 4b. Smart Allocation Strategy
        message += "🚀 **Smart Action Plan:**\n";
        
        // 1. Filter & Collect Opportunities
        let opportunities: any[] = [];
        for (const symbol of marketUniverse) {
             const result = reportMap.get(symbol);
             // Filter: Score > 55 (Quality) AND Buy Signal
             if (result && result.score > 55 && result.recommendation.includes('BUY')) {
                 opportunities.push(result);
             }
        }

        // 2. Sort by Score (Desc) -> Buy the BEST stocks first
        opportunities.sort((a, b) => b.score - a.score);

        // Priority: Use persisted cashBalance first, then fallback to budget if balance is 0
        let currentCash = Number(user.cashBalance) > 0 ? Number(user.cashBalance) : (Number(user.budget) || 0);
        const originalCash = currentCash;
        let allocatedCount = 0;

        if (opportunities.length === 0) {
            message += "No high-confidence buying opportunities found today. 📉\n";
        } else {
            for (const stock of opportunities) {
                if (currentCash >= stock.price) {
                    const qty = Math.floor(currentCash / stock.price);
                    const cost = qty * stock.price;
                    
                    currentCash -= cost;
                    const simpleReason = simplifyReason(stock.reasoning);
                    
                    message += `✅ **${stock.symbol}**\n`;
                    message += `   🛒 Buy: **${qty} Qty** @ Rs. ${stock.price}\n`;
                    message += `   💡 Why: ${simpleReason}\n\n`;
                    allocatedCount++;
                }
            }

            if (originalCash > 0) {
                message += "-----------------------------\n";
                message += `💰 **Available Cash**: Rs. ${originalCash.toFixed(2)}\n`;
                message += `📉 **Leftover**: Rs. ${currentCash.toFixed(2)}\n\n`;

                // --- LEFTOVER ADVICE ENGINE ---
                message += "💡 **Leftover Advice**:\n";
                if (currentCash > 50) {
                    // Try to find a high-score stock we skipped because of budget
                    const skipped = opportunities.find(o => o.price > currentCash && o.score > 70);
                    const parking = reportMap.get('GOLDBEES.NS');

                    if (parking && currentCash >= parking.price) {
                        const goldQty = Math.floor(currentCash / parking.price);
                        message += `• Park Rs. ${(goldQty * parking.price).toFixed(0)} in **GOLDBEES** to keep your money growing.\n`;
                    }
                    
                    if (skipped) {
                        message += `• Save the rest for **${skipped.symbol}**. Current price is Rs. ${skipped.price}, but it's a high-quality pick.\n`;
                    } else {
                        message += `• Keep the remaining as cash for a lower entry in your favorite stocks.\n`;
                    }
                } else {
                    message += "• Not enough left for extra shares. Stay calm and hold.\n";
                }
            }
        }

        if (user.telegramChatId) {
             try {
                await this.telegramService.sendMessage(user.telegramChatId, message);
             } catch (e) {
                this.logger.error(`Failed to send to ${user.telegramChatId}`);
             }
        }
    }
  }


  // Intraday scan every 15 minutes between 9:15 AM and 3:30 PM IST (Market hours)
  @Cron('0 */15 9-15 * * *', { name: 'intraday_opportunity_scan', timeZone: 'Asia/Kolkata' })
  async handleIntradayCrashCheck() {
    this.logger.debug('Running intraday dual-action scan...');
    
    // 1. Fetch all users and unique symbols to scan
    const users = await this.usersService.findAll();
    const marketUniverse = [
        'NIFTYBEES.NS', 'BANKBEES.NS', 'GOLDBEES.NS', 'RELIANCE', 'HDFCBANK', 
        'ICICIBANK', 'INFY', 'TCS', 'TATAMOTORS', 'SBI', 'HAL', 'BEL'
    ]; // Focused list for fast intraday scanning

    const symbolsToScan = new Set<string>(['^NSEI']); // Always scan Nifty
    users.forEach(u => u.portfolios?.forEach(p => symbolsToScan.add(p.stockSymbol)));
    marketUniverse.forEach(s => symbolsToScan.add(s));

    // 2. Perform Scans (Cache results to avoid duplicate API calls)
    const scanCache = new Map<string, any>();
    for (const symbol of symbolsToScan) {
        try {
            const result = await this.analysisService.analyzeStock(symbol);
            scanCache.set(symbol, result);
        } catch (e) {
            this.logger.error(`Intraday scan failed for ${symbol}: ${e.message}`);
        }
    }

    // 3. Process Alerts per User
    const nifty = scanCache.get('^NSEI');
    const isGlobalWeak = nifty && nifty.score < 40;

    for (const user of users) {
        if (!user.telegramChatId) continue;

        let alerts: string[] = [];

        // A. Global Alert
        if (isGlobalWeak) {
            alerts.push(`📉 **Global Alert**: Market (Nifty) is weak! Confidence Score: ${nifty.score}. Be careful.`);
        }

        // B. Portfolio Crash Check
        if (user.portfolios) {
            for (const p of user.portfolios) {
                const live = scanCache.get(p.stockSymbol);
                if (live && live.score < 35 && live.recommendation === 'SELL') {
                    alerts.push(`🚨 **Portfolio Crash**: **${p.stockSymbol}** is showing signs of breakdown! Score dropped to ${live.score}. Consider protecting capital.`);
                }
            }
        }

        // C. Buy Opportunity Alert (Only if user has cash)
        if (Number(user.cashBalance) > 500) {
            for (const s of marketUniverse) {
                const live = scanCache.get(s);
                // Trigger only on STRONG signals during the day
                if (live && live.score >= 85 && live.price <= (user.budget || 999999)) {
                    // Check if they already own it
                    const alreadyOwns = user.portfolios?.some(p => p.stockSymbol === s);
                    if (!alreadyOwns) {
                        alerts.push(`🚀 **Buy Opportunity!**: **${s}** just triggered a Strong Buy signal (Score: ${live.score}) at Rs. ${live.price}. It fits your budget!`);
                    }
                }
            }
        }

        // Send all alerts in one message for this user
        if (alerts.length > 0) {
            const finalMessage = alerts.join('\n\n');
            await this.telegramService.sendMessage(user.telegramChatId, finalMessage);
        }
    }
  }

  // EOD Analysis at 3:20 PM IST
  @Cron('0 20 15 * * *', { name: 'eod_analysis', timeZone: 'Asia/Kolkata' })
  async handleEODAnalysis() {
      this.logger.debug('Running EOD analysis...');
      await this.telegramService.sendAlertToAll('📊 EOD Analysis: Market closing. Review your positions.');
  }
}
