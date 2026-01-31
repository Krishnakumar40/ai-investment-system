import yfinance as yf

def calculate_fundamental_score(symbol: str):
    try:
        ticker = yf.Ticker(symbol + ".NS")
        info = ticker.info
        
        # yfinance sometimes returns empty info or None
        if not info or info.get('regularMarketPrice') is None:
             # Fallback: try fetching fast_info if available (newer yfinance)
             # but for now, just return specific error
             return {"score": 0, "reasoning": "No Fundamental Info found"}
        
        score = 0
        reasons = []
        
        # ROE
        roe = info.get('returnOnEquity', 0)
        if roe and roe > 0.15:
            score += 25
            reasons.append(f"High ROE ({roe*100:.1f}%)")
        
        # Revenue Growth
        rev_growth = info.get('revenueGrowth', 0)
        if rev_growth and rev_growth > 0.15:
            score += 25
            reasons.append(f"Strong Rev Growth ({rev_growth*100:.1f}%)")
            
        # Margins / Earnings
        profit_margin = info.get('profitMargins', 0)
        if profit_margin and profit_margin > 0.10:
             score += 25
             reasons.append(f"Healthy Margins ({profit_margin*100:.1f}%)")
            
        # Debt (Approximate via debtToEquity)
        debt = info.get('debtToEquity', 100)
        if debt and debt < 50:
            score += 25
            reasons.append(f"Low Debt ({debt}%)")
            
        if score == 0:
            reasons.append("Weak Fundamentals")
            
        return {"score": min(100, score), "reasoning": "; ".join(reasons)}
    except Exception as e:
         return {"score": 0, "reasoning": f"Fundamental Error: {str(e)}"}
