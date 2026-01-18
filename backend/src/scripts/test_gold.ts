
import { handleGetGoldPrice } from '../mcp/tools/GoldPriceTool';

const test = async () => {
    console.log("Testing Gold Price Tool...");

    // Test USD
    console.log("\n1. Fetching Gold Price (USD)...");
    const res = await handleGetGoldPrice({ currency: 'USD' });
    if (res.isError) {
        console.error("FAIL:", res.content[0].text);
    } else {
        console.log("PASS:", res.content[0].text);
    }
};

test();
