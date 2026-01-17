import { handleGetStockQuote, handleGetStockHistory } from './tools/StockTool';

const test = async () => {
    console.log("Testing Stock Tools...");

    // 1. Get Quote (US Stock)
    console.log("\n--- 1. Get Quote (AAPL) ---");
    const quoteRes = await handleGetStockQuote({ symbol: 'AAPL' });
    if (quoteRes.isError) {
        console.error("Quote Error:", quoteRes.content[0].text);
    } else {
        const data = JSON.parse(quoteRes.content[0].text);
        console.log(`Symbol: ${data.symbol}, Price: ${data.price} ${data.currency}`);
    }

    // 2. Get Quote (HK Stock)
    console.log("\n--- 2. Get Quote (0700.HK) ---");
    const quoteResHK = await handleGetStockQuote({ symbol: '0700.HK' });
    if (quoteResHK.isError) {
        console.error("Quote Error:", quoteResHK.content[0].text);
    } else {
        const data = JSON.parse(quoteResHK.content[0].text);
        console.log(`Symbol: ${data.symbol}, Name: ${data.shortName}, Price: ${data.price} ${data.currency}`);
    }

    // 3. Get History
    console.log("\n--- 3. Get History (NVDA, 5d) ---");
    const histRes = await handleGetStockHistory({ symbol: 'NVDA', period: '5d' });
    if (histRes.isError) {
        console.error("History Error:", histRes.content[0].text);
    } else {
        const history = JSON.parse(histRes.content[0].text);
        console.log(`Received ${history.length} data points.`);
        if (history.length > 0) {
            console.log("First day:", history[0]);
            console.log("Last day:", history[history.length - 1]);
        }
    }
};

test().catch(console.error);
