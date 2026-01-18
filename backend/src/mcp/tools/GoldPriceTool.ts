
import axios from 'axios';
import { z } from 'zod';

// --- Tool Definitions ---

export const GetGoldPriceDefinition = {
    name: "get_gold_price",
    description: "Get the real-time spot price of Gold (XAU/USD). Returns the current price in USD per ounce.",
    schema: {
        currency: z.enum(['USD']).optional().describe("Target currency. Currently only USD is supported.")
    }
};

// --- Handlers ---

export async function handleGetGoldPrice(args: { currency?: string }) {
    console.log(`[Chat Log] Gold Price Query (API)`);
    try {
        // Using goldprice.org public data API which is reliable and free
        const url = 'https://data-asg.goldprice.org/dbXRates/USD';

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = response.data as any;
        // Expected format: {"items":[{"curr":"USD","xauPrice":4596.34,...}]}

        if (!data.items || data.items.length === 0) {
            throw new Error("Invalid API response format");
        }

        const item = data.items[0];

        const relevantData = {
            symbol: "XAUUSD",
            name: "Gold Spot",
            price: item.xauPrice,
            currency: item.curr,
            change: item.chgXau,
            changePercent: item.pcXau,
            time: data.date
        };

        return {
            content: [{ type: "text" as const, text: JSON.stringify(relevantData, null, 2) }]
        };
    } catch (error: any) {
        console.error(`[Gold] Error fetching price:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Failed to fetch gold price: ${error.message}` }],
            isError: true
        };
    }
}
