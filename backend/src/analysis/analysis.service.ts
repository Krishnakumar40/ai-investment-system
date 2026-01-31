import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { RSI, EMA, MACD, ADX, BollingerBands } from 'technicalindicators';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  async analyzeStock(symbol: string) {
    try {
      // Don't append .NS for indices (starting with ^) or if already present
      const formattedSymbol = (symbol.startsWith('^') || symbol.endsWith('.NS')) 
        ? symbol 
        : `${symbol}.NS`;
        
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1y`;
      
      const response = await axios.get(url, {
         headers: { 'User-Agent': 'Mozilla/5.0' },
         timeout: 5000 
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) throw new Error('Invalid API response');

      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      const currentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 0;
      
      const closes = (quote.close || []).filter((c: any) => c !== null);
      const highs = (quote.high || []).filter((h: any) => h !== null);
      const lows = (quote.low || []).filter((l: any) => l !== null);
      const volumes = (quote.volume || []).filter((v: any) => v !== null);

      if (closes.length < 50) return { score: 0, reasoning: 'Insufficient Data', price: currentPrice, symbol, recommendation: 'HOLD' };

      // 1. Trend (EMA 50/200 & ADX)
      const ema50 = EMA.calculate({ period: 50, values: closes }).pop();
      const ema200 = EMA.calculate({ period: 200, values: closes }).pop();
      const adxData = ADX.calculate({ period: 14, high: highs, low: lows, close: closes }).pop();
      
      // 2. Momentum (RSI & MACD)
      const rsi = RSI.calculate({ period: 14, values: closes }).pop();
      const macds = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
      const currentMacd = macds[macds.length - 1];
      const prevMacd = macds[macds.length - 2];

      // 3. Volatility (Bollinger Bands)
      const bb = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 }).pop();

      // 4. Volume Surge
      const avgVolume20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const currentVolume = volumes[volumes.length - 1];
      const volumeSurge = currentVolume / avgVolume20;

      // --- ADVANCED SCORING ENGINE (0-100) ---
      let score = 50;
      const reasons: string[] = [];

      // A. Trend Component (Max +40 / -30)
      if (ema50 && ema200) {
          const isUptrend = currentPrice > ema50 && ema50 > ema200;
          const trendStrength = adxData?.adx || 0;

          if (isUptrend) {
              score += (trendStrength > 25) ? 40 : 20;
              reasons.push(trendStrength > 25 ? 'Strong Secular Uptrend' : 'Healthy Uptrend');
          } else if (currentPrice < ema50) {
              score -= 30;
              reasons.push('Bearish Trend Configuration');
          }
      }

      // B. Momentum Component (Max +30 / -30)
      if (rsi) {
          if (rsi < 30) { score += 25; reasons.push('Super Oversold (Value Buy)'); }
          else if (rsi > 75) { score -= 20; reasons.push('Overbought / Exhaustion Zone'); }
          else if (rsi > 55 && rsi < 70) { score += 10; reasons.push('Positive Price Flow'); }
      }

      if (currentMacd && prevMacd && 
          currentMacd.MACD !== undefined && currentMacd.signal !== undefined && 
          prevMacd.MACD !== undefined && prevMacd.signal !== undefined) {
          if (currentMacd.MACD > currentMacd.signal && prevMacd.MACD <= prevMacd.signal) {
              score += 20; reasons.push('Bullish MACD Cross');
          } else if (currentMacd.MACD < currentMacd.signal && prevMacd.MACD >= prevMacd.signal) {
              score -= 25; reasons.push('Bearish Momentum Shift');
          }
      }

      // C. Support/Resistance (Max +15)
      if (bb && currentPrice < bb.lower) {
          score += 15; reasons.push('Lower BB Support Bounce');
      }

      // D. Money Flow (Max +15 / -10)
      if (volumeSurge > 2.0) {
          score += 15; reasons.push(`Heavy Inst. Buying (${volumeSurge.toFixed(1)}x Vol)`);
      } else if (volumeSurge > 1.2) {
          score += 5; reasons.push('Positive Volume Divergence');
      } else if (volumeSurge < 0.4) {
          score -= 10; reasons.push('Declining Interest (Low Vol)');
      }

      // Final Precision Thresholds
      let recommendation = 'HOLD';
      if (score >= 85) recommendation = 'STRONG BUY';
      else if (score >= 70) recommendation = 'BUY';
      else if (score <= 30) recommendation = 'SELL';

      return {
        symbol,
        price: currentPrice,
        score: Math.min(100, Math.max(0, score)),
        reasoning: reasons.join('; '),
        recommendation
      };

    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return { symbol, price: 0, score: 0, reasoning: 'Scan Error', recommendation: 'HOLD' };
    }
  }
}
