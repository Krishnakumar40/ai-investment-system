const yahooFinance = require('yahoo-finance2').default;

async function debugQuote() {
    try {
        console.log("1. Fetching AAPL (US)...");
        const quoteUS = await yahooFinance.quote('AAPL');
        console.log("AAPL Price:", quoteUS.regularMarketPrice);
        console.log("AAPL Keys:", Object.keys(quoteUS).join(', '));

        console.log("\n2. Fetching RELIANCE.NS (India)...");
        const quoteIN = await yahooFinance.quote('RELIANCE.NS');
        console.log("RELIANCE Price:", quoteIN.regularMarketPrice);
        console.log("RELIANCE Keys:", Object.keys(quoteIN).join(', '));

    } catch (e) {
        console.error("FULL ERROR:", e);
        if (e.errors) {
            console.error("INNER ERRORS:", JSON.stringify(e.errors, null, 2));
        }
    }
}

debugQuote();
