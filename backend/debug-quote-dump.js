const yahooFinance = require('yahoo-finance2').default;
const fs = require('fs');

async function debugQuote() {
    try {
        console.log("Fetching quote for RELIANCE.NS...");
        const quote = await yahooFinance.quote('RELIANCE.NS');

        console.log("Writing full quote to quote-dump.json...");
        fs.writeFileSync('quote-dump.json', JSON.stringify(quote, null, 2));

        console.log("Done. Check quote-dump.json");
    } catch (e) {
        console.error("Error:", e);
        fs.writeFileSync('quote-dump.json', JSON.stringify({ error: e.message, fullError: e }, null, 2));
    }
}

debugQuote();
