import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
    // Attempt to set a browser-like User-Agent via internal module options if exposed, 
    // or just rely on default. Recent versions allow more config.
});
// Force User-Agent override if possible or known workaround
// @ts-ignore
yahooFinance._opts = { ...yahooFinance._opts, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } };
import { z } from 'zod';

// --- Tool Definitions ---

export const GetStockQuoteDefinition = {
    name: "get_stock_quote",
    description: "Get real-time stock quote for a given symbol (e.g., AAPL, NVDA, 0700.HK).",
    schema: {
        symbol: z.string().describe("The stock symbol to query.")
    }
};

export const GetStockHistoryDefinition = {
    name: "get_stock_history",
    description: "Get historical stock data for a given symbol.",
    schema: {
        symbol: z.string().describe("The stock symbol to query."),
        period: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y']).optional().describe("Data period. Defaults to '1mo'.")
    }
};

// --- Handlers ---

export async function handleGetStockQuote(args: { symbol: string }) {
    console.log(`[Chat Log] Stock Quote: ${args.symbol}`);
    try {
        const quote = await yahooFinance.quote(args.symbol) as any;

        // Extract relevant fields to keep context size manageable
        const relevantData = {
            symbol: quote.symbol,
            shortName: quote.shortName || quote.longName,
            price: quote.regularMarketPrice,
            currency: quote.currency,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            marketCap: quote.marketCap
        };

        return {
            content: [{ type: "text" as const, text: JSON.stringify(relevantData, null, 2) }]
        };
    } catch (error: any) {
        console.error(`[Stock] Error fetching quote for ${args.symbol}:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Error fetching quote: ${error.message}. Please check if the symbol is correct.` }],
            isError: true
        };
    }
}

export async function handleGetStockHistory(args: { symbol: string, period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' }) {
    const period = args.period || '1mo';
    console.log(`[Chat Log] Stock History: ${args.symbol}, Period: ${period}`);

    // Calculate start date based on period (approximate)
    const queryOptions: any = { period1: period }; // yahoo-finance2 supports string intervals like '1mo' for queryOptions? 
    // Actually, 'historical' uses period1 and period2, or simplified args.
    // Let's use `chart` or `historical`. `historical` is better.
    // yahoo-finance2 historical(symbol, queryOptions)

    // Mapping period string to start date logic might be complex. 
    // The library supports `period1` as a date.

    const now = new Date();
    let startDate = new Date();

    switch (period) {
        case '1d': startDate.setDate(now.getDate() - 1); break;
        case '5d': startDate.setDate(now.getDate() - 5); break;
        case '1mo': startDate.setMonth(now.getMonth() - 1); break;
        case '3mo': startDate.setMonth(now.getMonth() - 3); break;
        case '6mo': startDate.setMonth(now.getMonth() - 6); break;
        case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
    }

    try {
        const result = await yahooFinance.historical(args.symbol, {
            period1: startDate.toISOString().split('T')[0], // YYYY-MM-DD
            period2: now.toISOString().split('T')[0]
        });

        // Limit data points to avoid token overflow
        // If getting 1y data, maybe sample it? Or just return simpler format.
        const formatted = (result as any[]).map((day: any) => ({
            date: day.date.toISOString().split('T')[0],
            open: day.open,
            high: day.high,
            low: day.low,
            close: day.close,
            volume: day.volume
        }));

        return {
            content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }]
        };
    } catch (error: any) {
        console.error(`[Stock] Error fetching history for ${args.symbol}:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Error fetching history: ${error.message}` }],
            isError: true
        };
    }
}
