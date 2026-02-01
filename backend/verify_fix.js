
const axios = require('axios');

async function checkPrice() {
    const symbol = 'GOLDBEES.NS';
    // const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;

    try {
        console.log(`Fetching from: ${url}`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const result = response.data?.chart?.result?.[0];
        if (!result) {
            console.log("No data found");
            return;
        }

        const meta = result.meta;
        const quote = result.indicators.quote[0];
        const closes = (quote.close || []).filter(c => c !== null);
        const lastClose = closes.length > 0 ? closes[closes.length - 1] : 0;

        console.log(`Regular Market Price: ${meta.regularMarketPrice}`);
        console.log(`Last Candle Close: ${lastClose}`);
        console.log(`Chart Previous Close: ${meta.chartPreviousClose}`);

        // Simulation of the fix logic
        let calculatedPrice = meta.regularMarketPrice;
        if (!calculatedPrice && closes.length > 0) {
            calculatedPrice = lastClose;
            console.log("Used Last Close (Fallback 1)");
        } else if (!calculatedPrice) {
            calculatedPrice = meta.chartPreviousClose || 0;
            console.log("Used Previous Close (Fallback 2)");
        } else {
            console.log("Used Regular Market Price (Primary)");
        }

        console.log(`Final Price: ${calculatedPrice}`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPrice();
