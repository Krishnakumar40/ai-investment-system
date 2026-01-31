const YahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        const yf = new YahooFinance();
        console.log("Instance created.");

        console.log("Attempting to fetch quote for RELIANCE.NS...");
        const quote = await yf.quote('RELIANCE.NS');
        console.log("Quote success. Price:", quote.regularMarketPrice);

        const history = await yf.historical('RELIANCE.NS', { period1: '2023-01-01' });
        console.log("History success. Items:", history.length);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
