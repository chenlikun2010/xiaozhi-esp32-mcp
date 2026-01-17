import { z } from "zod";
// import puppeteer from 'puppeteer'; 
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

// City dictionary mapping (Simplified based on Python repo)
// In a production app, this might be better stored in a separate JSON or DB
const CITIES_DICT: Record<string, string> = {
    "上海": "SHA",
    "北京": "BJS",
    "成都": "CTU",
    "广州": "CAN",
    "深圳": "SZX",
    "重庆": "CKG",
    "西安": "SIA",
    "杭州": "HGH",
    "武汉": "WUH",
    "南京": "NKG",
    "昆明": "KMG",
    "长沙": "CSX",
    "海口": "HAK",
    "三亚": "SYX",
    "青岛": "TAO",
    "厦门": "XMN",
    "天津": "TSN",
    "大连": "DLC",
    "哈尔滨": "HRB",
    "沈阳": "SHE",
    "乌鲁木齐": "URC",
    "拉萨": "LXA",
    // Add "City(Code)" format support implicitly by logic or expanding this map
};

function getCityCode(cityName: string): string | null {
    // 1. Direct match
    if (CITIES_DICT[cityName]) return CITIES_DICT[cityName].toLowerCase();

    // 2. Case insensitive match for codes
    const upperInput = cityName.toUpperCase();
    if (Object.values(CITIES_DICT).includes(upperInput)) return upperInput.toLowerCase();

    // 3. Try to find key match if user inputs "City(CODE)"
    for (const [key, val] of Object.entries(CITIES_DICT)) {
        if (key === cityName) return val.toLowerCase();
    }

    return null;
}

export const SearchFlightTicketsDefinition = {
    name: "search_flight_tickets",
    schema: {
        departure_city: z.string().describe("出发城市，例如：上海、北京、SHA"),
        destination_city: z.string().describe("到达城市，例如：广州、CAN"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").describe("出发日期 (YYYY-MM-DD)")
    }
};

export async function handleSearchFlightTickets(args: { departure_city: string, destination_city: string, date: string }) {
    const fromCode = getCityCode(args.departure_city);
    const toCode = getCityCode(args.destination_city);

    if (!fromCode || !toCode) {
        return {
            content: [{ type: "text" as const, text: `错误：无法识别的城市名称。请使用常见城市中文名（如北京）或机场三字码（如PEK）。` }]
        };
    }

    // Ctrip URL: https://flights.ctrip.com/online/list/oneway-{from}-{to}?_=1&depdate={date}&cabin=Y_S_C_F
    const url = `https://flights.ctrip.com/online/list/oneway-${fromCode}-${toCode}?_=1&depdate=${args.date}&cabin=Y_S_C_F`;
    console.log(`[FlightTool] Searching: ${url}`);

    let browser;
    try {
        const executablePath = process.platform === 'darwin'
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : undefined; // On Linux/Server, let Puppeteer try to find it or use bundled

        browser = await puppeteer.launch({
            headless: true,
            executablePath: fs.existsSync(executablePath || '') ? executablePath : undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                // '--disable-blink-features=AutomationControlled' // Stealth plugin handles this
            ],
            // ignoreDefaultArgs: ["--enable-automation"] // Stealth plugin handles this
        });

        const page = await browser.newPage();

        // Stealth plugin handles webdriver masking
        // await page.evaluateOnNewDocument(() => {
        //     Object.defineProperty(navigator, 'webdriver', {
        //         get: () => false,
        //     });
        //     // @ts-ignore
        //     window.navigator.chrome = { runtime: {} };
        // });

        // Anti-detection: Set User Agent (Stealth might set one, but setting a specific recent one is good)
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Referer': 'https://flights.ctrip.com/'
        });

        // Go to URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("[FlightTool] Page loaded, scrolling...");

        // Scroll to trigger lazy loading (similar to Python logic)
        await autoScroll(page);

        // Wait a bit for JS to render
        await new Promise(r => setTimeout(r, 3000));

        // Scrape flight items
        const flights = await page.evaluate(() => {
            const items = document.querySelectorAll('.flight-item'); // Ctrip class name might vary, this is based on inspection or Python repo clues
            // Note: Ctrip class names are often obfuscated or change. 
            // The Python repo used: .flight-item
            // If that fails, we might need more generic selectors.

            const results: any[] = [];
            items.forEach((item: any, index: number) => {
                if (index >= 10) return; // Limit to 10

                try {
                    const airlineEl = item.querySelector('.airline-name span');
                    const airline = airlineEl ? airlineEl.textContent?.trim() : 'Unknown';

                    const flightNoEl = item.querySelector('.plane-No');
                    const flightNo = flightNoEl ? flightNoEl.textContent?.trim() : '';

                    const departTimeEl = item.querySelector('.depart-box .time');
                    const departTime = departTimeEl ? departTimeEl.textContent?.trim() : '';

                    const airportTimeEl = item.querySelector('.depart-box .name');
                    const departAirport = airportTimeEl ? airportTimeEl.textContent?.trim() : '';

                    const arriveTimeEl = item.querySelector('.arrive-box .time');
                    const arriveTime = arriveTimeEl ? arriveTimeEl.textContent?.trim() : '';

                    const arriveAirportEl = item.querySelector('.arrive-box .name');
                    const arriveAirport = arriveAirportEl ? arriveAirportEl.textContent?.trim() : '';

                    const priceEl = item.querySelector('.price');
                    const price = priceEl ? priceEl.textContent?.trim() : 'Unknown';

                    if (flightNo && departTime && price) {
                        results.push({
                            flight_no: flightNo,
                            airline,
                            depart_time: departTime,
                            depart_airport: departAirport,
                            arrive_time: arriveTime,
                            arrive_airport: arriveAirport,
                            price
                        });
                    }
                } catch (e) {
                    // ignore item error
                }
            });
            return results;
        });

        console.log(`[FlightTool] Found ${flights.length} flights`);

        if (flights.length === 0) {
            console.log("[FlightTool] No flights found (likely soft-block).");

            // Fallback: Check if there's a specific "no flights" message
            const pageText = await page.evaluate(() => document.body.innerText);
            if (pageText.includes("抱歉")) {
                return { content: [{ type: "text" as const, text: `抱歉，未找到 ${args.date} 从 ${args.departure_city} 到 ${args.destination_city} 的航班。` }] };
            }
            return { content: [{ type: "text" as const, text: `查询成功，但未能解析到航班信息。可能是由于携程的反爬虫策略导致数据被屏蔽。建议稍后重试或使用真实浏览器访问。` }] };
        }

        // Format Output
        let outputText = `✈️ 航班查询结果 (${args.departure_city} -> ${args.destination_city} @ ${args.date})\n\n`;
        flights.forEach((f: any, i: number) => {
            outputText += `${i + 1}. ${f.airline} ${f.flight_no}\n`;
            outputText += `   🛫 ${f.depart_time} ${f.depart_airport}\n`;
            outputText += `   🛬 ${f.arrive_time} ${f.arrive_airport}\n`;
            outputText += `   💰 ${f.price}\n\n`;
        });

        return {
            content: [{ type: "text" as const, text: outputText }]
        };

    } catch (error: any) {
        console.error("[FlightTool] Error:", error);
        return {
            content: [{ type: "text" as const, text: `查询失败: ${error.message}` }]
        };
    } finally {
        if (browser) await browser.close();
    }
}

async function autoScroll(page: any) {
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Stop scrolling after a certain depth or if reached bottom
                if (totalHeight >= 3000 || totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });
}
