import { handleGetExchangeRate, handleConvertCurrency } from './tools/ExchangeRateTool';

const test = async () => {
    console.log("Testing Exchange Rate Tools...");

    // 1. Get Exchange Rate (Base USD)
    console.log("\n--- 1. Get Exchange Rate (USD -> EUR,CNY,JPY) ---");
    const rateRes = await handleGetExchangeRate({ base: 'USD', symbols: 'EUR,CNY,JPY' });
    if (rateRes.isError) {
        console.error("Rate Error:", rateRes.content[0].text);
    } else {
        const data = JSON.parse(rateRes.content[0].text);
        console.log(`Base: ${data.base}, Date: ${data.date}`);
        console.log(`Rates:`, data.rates);
    }

    // 2. Convert Currency (100 USD -> CNY)
    console.log("\n--- 2. Convert Currency (100 USD -> CNY) ---");
    const convRes = await handleConvertCurrency({ amount: 100, from: 'USD', to: 'CNY' });
    if (convRes.isError) {
        console.error("Convert Error:", convRes.content[0].text);
    } else {
        const data = JSON.parse(convRes.content[0].text);
        console.log(`${data.baseAmount} ${data.baseCurrency} = ${data.targetAmount} ${data.targetCurrency}`);
        console.log(`Rate: ${data.rate}`);
    }
};

test().catch(console.error);
