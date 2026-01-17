import axios from 'axios';
import { z } from 'zod';

// --- Tool Definitions ---

export const GetExchangeRateDefinition = {
    name: "get_exchange_rate",
    description: "Get current exchange rates for a base currency.",
    schema: {
        base: z.string().optional().describe("Base currency code (e.g., USD, EUR, CNY). Defaults to USD."),
        symbols: z.string().optional().describe("Comma-separated list of target currencies to filter (e.g., 'EUR,JPY').")
    }
};

export const ConvertCurrencyDefinition = {
    name: "convert_currency",
    description: "Convert a specific amount from one currency to another.",
    schema: {
        amount: z.number().describe("Amount to convert."),
        from: z.string().describe("Source currency code (e.g., USD)."),
        to: z.string().describe("Target currency code (e.g., CNY).")
    }
};

// --- Handlers ---

const API_BASE = 'https://api.frankfurter.app';

export async function handleGetExchangeRate(args: { base?: string, symbols?: string }) {
    const base = (args.base || 'USD').toUpperCase();
    console.log(`[Chat Log] Exchange Rate: Base=${base}, Symbols=${args.symbols || 'All'}`);

    try {
        let url = `${API_BASE}/latest?from=${base}`;
        if (args.symbols) {
            url += `&to=${args.symbols.toUpperCase()}`;
        }

        const response = await axios.get(url);
        const data = response.data as any;

        return {
            content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
        };
    } catch (error: any) {
        console.error(`[Exchange] Error fetching rates:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Error fetching rates: ${error.message}. Ensure currency codes are valid (e.g., USD, EUR, CNY).` }],
            isError: true
        };
    }
}

export async function handleConvertCurrency(args: { amount: number, from: string, to: string }) {
    const from = args.from.toUpperCase();
    const to = args.to.toUpperCase();
    console.log(`[Chat Log] Convert: ${args.amount} ${from} -> ${to}`);

    try {
        if (from === to) {
            return {
                content: [{ type: "text" as const, text: JSON.stringify({ amount: args.amount, currency: to, rate: 1 }, null, 2) }]
            };
        }

        const url = `${API_BASE}/latest?amount=${args.amount}&from=${from}&to=${to}`;
        const response = await axios.get(url);
        const data = response.data as any;

        // Data format: { amount: 100, base: 'USD', date: '...', rates: { CNY: 7.25 } }
        const resultAmount = data.rates[to];
        const rate = resultAmount / args.amount;

        const result = {
            baseAmount: args.amount,
            baseCurrency: from,
            targetAmount: resultAmount,
            targetCurrency: to,
            rate: rate,
            date: data.date
        };

        return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
        };
    } catch (error: any) {
        console.error(`[Exchange] Error converting currency:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Error converting currency: ${error.message}. Ensure currency codes are valid.` }],
            isError: true
        };
    }
}
