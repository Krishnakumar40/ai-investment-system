import yfinance as yf
import pandas as pd
import numpy as np

def calculate_technical_score(symbol: str):
    try:
        # Fetch live data for 1 year
        ticker = yf.Ticker(symbol + ".NS")
        hist = ticker.history(period="1y")
        
        if hist.empty:
            return {"score": 0, "reasoning": "No Live Data found for " + symbol}
            
        # --- Manual Calculation (No pandas_ta dependency) ---
        
        # EMA
        hist['EMA_50'] = hist['Close'].ewm(span=50, adjust=False).mean()
        hist['EMA_200'] = hist['Close'].ewm(span=200, adjust=False).mean()
        
        # RSI
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        hist['RSI_14'] = 100 - (100 / (1 + rs))
        
        # Latest values
        latest = hist.iloc[-1]
        close = latest['Close']
        ema50 = latest['EMA_50']
        ema200 = latest['EMA_200']
        rsi = latest['RSI_14']
        
        score = 50 # Neutral start
        reasons = []
        
        # Trend Logic
        if close > ema50 > ema200:
            score += 30
            reasons.append(f"Strong Uptrend (Price {close:.0f} > EMA50 > EMA200)")
        elif close < ema50 < ema200:
            score -= 30
            reasons.append(f"Downtrend (Price {close:.0f} < EMA50 < EMA200)")
        elif close > ema200:
            score += 10
            reasons.append("Above 200 EMA (Long term bullish)")
            
        # RSI Logic
        # Handle NaN efficiently
        if pd.isna(rsi):
            rsi = 50
            
        if 50 <= rsi <= 70:
            score += 10
            reasons.append(f"Bullish RSI ({rsi:.0f})")
        elif rsi > 70:
            score -= 10
            reasons.append(f"Overbought RSI ({rsi:.0f})")
        elif rsi < 30:
            score += 20
            reasons.append(f"Oversold RSI ({rsi:.0f}) - Bounce Candidate")
            
        return {"score": min(100, max(0, score)), "reasoning": "; ".join(reasons)}
        
    except Exception as e:
        return {"score": 0, "reasoning": f"Analysis Error: {str(e)}"}
