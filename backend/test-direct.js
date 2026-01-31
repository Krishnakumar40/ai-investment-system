const axios = require('axios');

async function testDirect() {
    try {
        const symbol = '^NSEI';
        // const symbol = 'ZOMATO.NS'; 
        // const symbol = 'SUZLON.NS';
        // Use the chart endpoint which is often open
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
        console.log(`Fetching ${url}...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const result = response.data.chart.result[0];
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const currency = meta.currency;

        console.log("Success!");
        console.log(`Symbol: ${meta.symbol}`);
        console.log(`Price: ${price} ${currency}`);
        console.log("Data Length:", result.timestamp.length);

    } catch (error) {
        console.error("Error fetching data:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data).substring(0, 200));
        }
    }
}

testDirect();
