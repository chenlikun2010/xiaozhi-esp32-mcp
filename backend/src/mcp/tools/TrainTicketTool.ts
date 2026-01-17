import axios from 'axios';
import { z } from 'zod';
import https from 'https';

// --- Tool Definitions ---

export const SearchTrainTicketsDefinition = {
    name: "search_train_tickets",
    description: "Search for train tickets between two cities in China (e.g., Beijing to Shanghai).",
    schema: {
        from: z.string().describe("Departure city name (e.g., 北京, 上海, 广州)."),
        to: z.string().describe("Arrival city name (e.g., 南京, 杭州, 深圳)."),
        date: z.string().describe("Departure date in YYYY-MM-DD format (e.g., 2024-05-01).")
    }
};

// --- Station Code Mapping (Major Cities) ---
// Source: Common 12306 station codes
const STATION_MAP: Record<string, string> = {
    "北京": "BJP", "北京北": "VAP", "北京南": "VNP", "北京西": "BXP",
    "上海": "SHH", "上海南": "SNH", "上海虹桥": "AOH",
    "天津": "TJP", "天津西": "TXP", "天津南": "TIP",
    "广州": "GZQ", "广州南": "IZQ", "广州东": "GGQ",
    "深圳": "SZQ", "深圳北": "IOQ",
    "杭州": "HZH", "杭州东": "HGH",
    "南京": "NJH", "南京南": "NKH",
    "武汉": "WHN", "汉口": "HKN", "武昌": "WCN",
    "西安": "XAY", "西安北": "EAY",
    "成都": "CDW", "成都东": "ICW",
    "重庆": "CQW", "重庆北": "CUW",
    "长沙": "CSQ", "长沙南": "CWQ",
    "郑州": "ZZF", "郑州东": "ZAF",
    "苏州": "SZH", "苏州北": "OHH",
    "厦门": "XMS", "厦门北": "XKS",
    "青岛": "QDK",
    "大连": "DLT",
    "沈阳": "SYT",
    "哈尔滨": "HBB",
    "昆明": "KMM",
    "贵阳": "GIW",
    "南宁": "NNZ",
    "福州": "FZS",
    "南昌": "NCG",
    "合肥": "HFH",
    "济南": "JNK",
    "太原": "TYV",
    "石家庄": "SJP",
    "兰州": "LZJ",
    "西宁": "XNO",
    "银川": "YIJ",
    "拉萨": "LSO",
    "乌鲁木齐": "WMR"
};

// Reverse lookup for display
const CODE_TO_NAME: Record<string, string> = Object.entries(STATION_MAP).reduce((acc, [name, code]) => {
    acc[code] = name;
    return acc;
}, {} as Record<string, string>);

function getStationCode(city: string): string | undefined {
    // Try exact match
    if (STATION_MAP[city]) return STATION_MAP[city];
    // Try fuzzy match (e.g. "北京" matches "北京南" if strict mapping fails, but better to be precise)
    // For now, simple exact match or appending "站" (rarely needed).
    return undefined;
}

// --- Handlers ---

// 12306 API frequently changes. Current known endpoint pattern:
// https://kyfw.12306.cn/otn/leftTicket/query?leftTicketDTO.train_date=2024-01-01&leftTicketDTO.from_station=BJP&leftTicketDTO.to_station=SHH&purpose_codes=ADULT
const API_BASE = 'https://kyfw.12306.cn/otn/leftTicket';

export async function handleSearchTrainTickets(args: { from: string, to: string, date: string }) {
    console.log(`[Chat Log] Train Search: ${args.from} -> ${args.to} on ${args.date}`);

    const fromCode = getStationCode(args.from);
    const toCode = getStationCode(args.to);

    if (!fromCode || !toCode) {
        return {
            content: [{ type: "text" as const, text: `Error: Unknown station. Currently supported major cities: 北京, 上海, 广州, 深圳, 杭州, 南京, etc. Checked: ${args.from} (${fromCode}), ${args.to} (${toCode})` }],
            isError: true
        };
    }

    try {
        // 12306 often blocks non-browser UAs or aggressive IPs. 
        // We need headers to look like a browser.
        // Also handling self-signed certs via httpsAgent.
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // The query URL logic for 12306 is weird; it sometimes uses 'queryA', 'queryZ', etc.
        // We will try the standard 'query' first.
        const queryUrl = `${API_BASE}/query?leftTicketDTO.train_date=${args.date}&leftTicketDTO.from_station=${fromCode}&leftTicketDTO.to_station=${toCode}&purpose_codes=ADULT`;

        const response = await axios.get(queryUrl, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': '_jc_save_fromStation=' + escape(args.from + ',' + fromCode) + '; _jc_save_toStation=' + escape(args.to + ',' + toCode) + '; _jc_save_fromDate=' + args.date
            }
        } as any);

        const data = response.data as any;

        if (data.status && data.data && data.data.result) {
            // Parse the weird pipe-delimited string format of 12306
            // Format roughly: ...|预订|240000G1010|G101|VNP|AOH|VNP|AOH|06:23|11:59|05:36|Y|...
            // Indices (approx): 
            // 3: Train No (G101)
            // 4: From Station Code
            // 5: To Station Code
            // 6: From Station Name Code? (usually matches 4)
            // 7: To Station Name Code?
            // 8: Start Time
            // 9: Arrive Time
            // 10: Duration
            // 13: Date?
            // 30: 2nd Class Seat (ZY) ?? - layout changes often
            // 31: 1st Class Seat (ZE) ??
            // 32: Business Seat (SWZ) ??

            const trains = data.data.result.map((item: string) => {
                const fields = item.split('|');
                const trainNo = fields[3];
                const fromStationCode = fields[6];
                const toStationCode = fields[7];
                const startTime = fields[8];
                const arriveTime = fields[9];
                const duration = fields[10];

                const canBook = fields[11] === 'Y';

                // Prices are not in this main list usually, need separate query or complex map.
                // Seat availability indices (can vary):
                // 32: Business
                // 31: First Class
                // 30: Second Class
                // 29: ??
                // 28: ??
                // 26: No Seat?
                // 23: Soft Sleeper (RW)
                // 28: Hard Sleeper (YW) ??

                const business = fields[32] || '--';
                const first = fields[31] || '--';
                const second = fields[30] || '--';

                return {
                    train: trainNo,
                    from: CODE_TO_NAME[fromStationCode] || fromStationCode,
                    to: CODE_TO_NAME[toStationCode] || toStationCode,
                    start: startTime,
                    arrive: arriveTime,
                    duration: duration,
                    seats: {
                        business: business,
                        first: first,
                        second: second
                    },
                    canBook: canBook ? "Yes" : "No"
                };
            }).slice(0, 10); // Limit to top 10 to save tokens

            return {
                content: [{ type: "text" as const, text: JSON.stringify(trains, null, 2) }]
            };
        } else {
            console.warn("[Train] 12306 API format changed or empty.", JSON.stringify(data));
            return {
                content: [{ type: "text" as const, text: "No trains found or API structure changed. 12306 APIs are strict; this might be a blocking issue." }]
            };
        }

    } catch (error: any) {
        console.error(`[Train] Error fetching data:`, error.message);
        return {
            content: [{ type: "text" as const, text: `Error fetching train data: ${error.message}. Network might be blocked.` }],
            isError: true
        };
    }
}
