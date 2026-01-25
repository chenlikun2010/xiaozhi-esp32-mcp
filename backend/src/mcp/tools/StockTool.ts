import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import iconv from 'iconv-lite';
import { z } from 'zod';

// Initialize YahooFinance with options to suppress noise
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey']
});
// Override User-Agent in case it helps with some blocks, but we rely on Sina fallback mostly.
// @ts-ignore
yahooFinance._opts = { ...yahooFinance._opts, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } };

// --- Tool Definitions ---

export const GetStockQuoteDefinition = {
    name: "get_stock_quote",
    description: "Get real-time stock quote for a given symbol (e.g., AAPL, NVDA, 0700.HK, 600519.SS). Automatically falls back to alternative sources if blocked.",
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

// --- Helpers ---

function normalizeToSinaCode(symbol: string): string | null {
    const s = symbol.toUpperCase();

    // HK Stocks: 0700.HK -> rt_hk00700
    if (s.endsWith('.HK')) {
        const code = s.replace('.HK', '');
        return `rt_hk${code}`;
    }

    // US Stocks: AAPL -> gb_aapl
    // Simple heuristic: if no suffix and length <= 5, assume US.
    if (!s.includes('.') && s.length <= 5) {
        return `gb_${s.toLowerCase()}`;
    }

    // CN A-Shares: 600519.SS -> sh600519, 000001.SZ -> sz000001
    if (s.endsWith('.SS')) {
        return `sh${s.replace('.SS', '')}`;
    }
    if (s.endsWith('.SZ')) {
        return `sz${s.replace('.SZ', '')}`;
    }

    return null;
}

async function fetchSinaStock(sinaCode: string) {
    const url = `http://hq.sinajs.cn/list=${sinaCode}`;
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
            'Referer': 'https://finance.sina.com.cn/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000
    });
    return iconv.decode(response.data as Buffer, 'gb18030');
}

function parseSinaResponse(sinaCode: string, responseText: string) {
    const matches = responseText.match(/="(.*)";/);
    if (!matches || !matches[1]) return null;
    const data = matches[1].split(',');
    if (data.length < 5) return null; // Invalid data

    // Output normalized to look like Yahoo's for consistency
    let result: any = {
        symbol: sinaCode, // Keep internal code or map back?
        source: 'Sina Finance'
    };

    if (sinaCode.startsWith('rt_hk')) {
        // HK: EnName, CnName, Open, PrevClose, High, Low, Last, Change, Change%
        result.symbol = sinaCode.replace('rt_hk', '').toUpperCase() + '.HK';
        result.shortName = data[0]; // English name often
        result.longName = data[1];
        result.currency = 'HKD';
        result.regularMarketPrice = parseFloat(data[6]);
        result.regularMarketChange = parseFloat(data[7]);
        result.regularMarketChangePercent = parseFloat(data[8]);
        result.regularMarketDayHigh = parseFloat(data[4]);
        result.regularMarketDayLow = parseFloat(data[5]);
        result.regularMarketOpen = parseFloat(data[2]);
        result.regularMarketPreviousClose = parseFloat(data[3]);
    } else if (sinaCode.startsWith('gb_')) {
        // US: Name, Price, Change%, Time, Change, Open, High, Low
        result.symbol = sinaCode.replace('gb_', '').toUpperCase();
        result.shortName = data[0];
        result.currency = 'USD';
        result.regularMarketPrice = parseFloat(data[1]);
        result.regularMarketChange = parseFloat(data[4]);
        result.regularMarketChangePercent = parseFloat(data[2]);
        result.regularMarketOpen = parseFloat(data[5]);
        result.regularMarketDayHigh = parseFloat(data[6]);
        result.regularMarketDayLow = parseFloat(data[7]);
    } else {
        // CN: Name, Open, PrevClose, Price, High, Low
        // Infer SS or SZ from code? simplified.
        result.symbol = sinaCode;
        result.shortName = data[0];
        result.currency = 'CNY';
        result.regularMarketPrice = parseFloat(data[3]);
        result.regularMarketOpen = parseFloat(data[1]);
        result.regularMarketPreviousClose = parseFloat(data[2]);
        result.regularMarketDayHigh = parseFloat(data[4]);
        result.regularMarketDayLow = parseFloat(data[5]);

        // Calculate change manually for CN
        if (result.regularMarketPrice && result.regularMarketPreviousClose) {
            result.regularMarketChange = parseFloat((result.regularMarketPrice - result.regularMarketPreviousClose).toFixed(3));
            result.regularMarketChangePercent = parseFloat(((result.regularMarketChange / result.regularMarketPreviousClose) * 100).toFixed(2));
        }
    }

    return result;
}

// --- Handlers ---

export async function handleGetStockQuote(args: { symbol: string }) {
    console.log(`[Stock] Fetching quote for: ${args.symbol}`);

    // Strategy: Try Yahoo first (better data), catch error, try Sina fallback.
    try {
        const quote = await yahooFinance.quote(args.symbol) as any;
        console.log(`[Stock] Yahoo success for ${args.symbol}`);

        const relevantData = {
            symbol: quote.symbol,
            shortName: quote.shortName || quote.longName,
            price: quote.regularMarketPrice,
            currency: quote.currency,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            marketCap: quote.marketCap,
            source: "Yahoo Finance"
        };

        return {
            content: [{ type: "text" as const, text: JSON.stringify(relevantData, null, 2) }]
        };
    } catch (error: any) {
        console.warn(`[Stock] Yahoo failed for ${args.symbol}: ${error.message}. Trying Sina fallback...`);

        // Sina Fallback
        const sinaCode = normalizeToSinaCode(args.symbol);
        if (sinaCode) {
            try {
                const raw = await fetchSinaStock(sinaCode);
                const parsed = parseSinaResponse(sinaCode, raw);

                if (parsed) {
                    // Normalize keys to match "relevantData" above
                    const relevantData = {
                        symbol: parsed.symbol,
                        shortName: parsed.shortName,
                        price: parsed.regularMarketPrice,
                        currency: parsed.currency,
                        change: parsed.regularMarketChange,
                        changePercent: parsed.regularMarketChangePercent,
                        high: parsed.regularMarketDayHigh,
                        low: parsed.regularMarketDayLow,
                        source: "Sina Finance (Fallback)"
                        // marketCap missing in simple sina api
                    };
                    console.log(`[Stock] Sina success for ${sinaCode}`);
                    return {
                        content: [{ type: "text" as const, text: JSON.stringify(relevantData, null, 2) }]
                    };
                } else {
                    console.warn(`[Stock] Sina parsed null for ${sinaCode}`);
                }
            } catch (sinaError: any) {
                console.error(`[Stock] Sina failed for ${sinaCode}:`, sinaError.message);
            }
        } else {
            console.warn(`[Stock] No Sina code mapping for ${args.symbol}`);
        }

        // If fallback fails, return error
        return {
            content: [{ type: "text" as const, text: `Error fetching quote: ${error.message}. Fallback also failed.` }],
            isError: true
        };
    }
}

export async function handleGetStockHistory(args: { symbol: string, period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' }) {
    const period = args.period || '1mo';
    console.log(`[Stock] History: ${args.symbol}, Period: ${period}`);

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
            period1: startDate.toISOString().split('T')[0],
            period2: now.toISOString().split('T')[0]
        });

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
