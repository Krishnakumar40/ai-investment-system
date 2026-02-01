
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function checkPrice() {
    const symbols = ['GOLDBEES.NS', 'NIFTYBEES.NS'];
    const logPath = path.join(__dirname, 'price_log_compare.txt');
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    for (const symbol of symbols) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;

        try {
            log(`\n\n--- Checking ${symbol} ---`);
            log(`Fetching from: ${url}`);
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

            const result = response.data?.chart?.result?.[0];
            if (!result) {
                log("No data found");
            } else {
                const meta = result.meta;
                log(`Regular Market Price: ${meta.regularMarketPrice}`);
                log(`Chart Previous Close: ${meta.chartPreviousClose}`);
                log(`Regular Market Time (Unix): ${meta.regularMarketTime}`);
                log(`Regular Market Time (Date): ${new Date(meta.regularMarketTime * 1000).toString()}`);

                // Check the last timestamp in the chart
                const timestamps = result.timestamp || [];
                const lastTimestamp = timestamps[timestamps.length - 1];
                log(`Last Chart Timestamp (Unix): ${lastTimestamp}`);
                log(`Last Chart Timestamp (Date): ${new Date(lastTimestamp * 1000).toString()}`);
            }
        } catch (e) {
            log(`Error: ${e.message}`);
        }
    }

    fs.writeFileSync(logPath, output);
    console.log("Written log to " + logPath);
}

checkPrice();
