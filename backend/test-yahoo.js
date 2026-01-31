const axios = require('axios');

async function testYahoo() {
    const symbol = 'ZOMATO.BO';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    console.log(`Fetching ${url}...`);

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`Status: ${response.status}`);
        const result = response.data?.chart?.result?.[0];
        if (result) {
            const price = result.meta.regularMarketPrice;
            console.log(`Success! Price: ${price}`);
        } else {
            console.log('No result found in data');
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
        if (e.response) {
            console.error(`Response Status: ${e.response.status}`);
            console.error(`Response Data: ${JSON.stringify(e.response.data)}`);
        }
    }
}

testYahoo();
