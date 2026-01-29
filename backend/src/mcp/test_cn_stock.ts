import { handleGetStockQuote } from './tools/StockTool';

const test = async () => {
    console.log("Testing CN Stock Tools...");

    // 1. Get Quote (SH Stock)
    console.log("\n--- 1. Get Quote (600519.SS - Moutai) ---");
    const quoteResSH = await handleGetStockQuote({ symbol: '600519.SS' });
    if (quoteResSH.isError) {
        console.error("Quote Error:", quoteResSH.content[0].text);
    } else {
        const data = JSON.parse(quoteResSH.content[0].text);
        console.log(`Source: ${data.source}`);
        console.log(`Symbol: ${data.symbol}, Name: ${data.shortName}, Price: ${data.price} ${data.currency}`);
    }

    // 2. Get Quote (SZ Stock)
    console.log("\n--- 2. Get Quote (000001.SZ - Ping An) ---");
    const quoteResSZ = await handleGetStockQuote({ symbol: '000001.SZ' });
    if (quoteResSZ.isError) {
        console.error("Quote Error:", quoteResSZ.content[0].text);
    } else {
        const data = JSON.parse(quoteResSZ.content[0].text);
        console.log(`Source: ${data.source}`);
        console.log(`Symbol: ${data.symbol}, Name: ${data.shortName}, Price: ${data.price} ${data.currency}`);
    }
};

test().catch(console.error);
