
import axios from 'axios';
import { z } from 'zod';
import * as crypto from 'crypto';

// --- Tool Definitions ---

export const GetExpressInfoDefinition = {
    name: "get_express_info",
    description: "Query express delivery tracking information. Supports major Chinese couriers. REQUIRED: 'com' (company code or name) and 'num' (tracking number). For SF Express, 'phone' is also required.",
    schema: {
        com: z.string().describe("Courier company code or name. You can use standard codes (e.g., 'shunfeng') or common Chinese names (e.g., '顺丰', '圆通'). We will automatically map them."),
        num: z.string().describe("Tracking number."),
        phone: z.string().optional().describe("Sender or recipient phone number. REQUIRED for SF Express, otherwise the query will fail.")
    }
};

// --- Configuration ---
const CONFIG = {
    key: 'wTloGUmn7543',
    customer: 'A0DC7F0E698F1229687B373AF4110408'
};

// --- Handlers ---

const COM_MAP: Record<string, string> = {
    '顺丰': 'shunfeng',
    'sf': 'shunfeng',
    'SF': 'shunfeng',
    '圆通': 'yuantong',
    'yto': 'yuantong',
    '中通': 'zhongtong',
    'zto': 'zhongtong',
    '申通': 'shentong',
    'sto': 'shentong',
    '韵达': 'yunda',
    'yd': 'yunda',
    '邮政': 'youzhengguonei',
    'ems': 'ems',
    '京东': 'jd',
    'jd': 'jd',
    '极兔': 'jtexpress',
    'jt': 'jtexpress',
    '德邦': 'debangwuliu',
    'db': 'debangwuliu'
};

export async function handleGetExpressInfo(args: { com: string; num: string; phone?: string }) {
    console.log(`[Chat Log] Express Query Input:`, JSON.stringify(args));
    try {
        let { com, num, phone } = args;

        // 1. Normalize Company Code
        // If com is in map (keys), use the value. Otherwise verify if it is already a valid code?
        // We trust the map or use the original if not found (assuming LLM was right).
        // Also handle "顺丰速运" fuzzy match?

        let targetCom = com.toLowerCase().trim();

        // Try exact match in map
        if (COM_MAP[targetCom] || COM_MAP[com]) {
            targetCom = COM_MAP[targetCom] || COM_MAP[com];
        } else {
            // Fuzzy match check
            for (const key in COM_MAP) {
                if (targetCom.includes(key)) {
                    targetCom = COM_MAP[key];
                    break;
                }
            }
        }

        console.log(`[Express] Normalized company: ${com} -> ${targetCom}`);

        const paramObj: any = {
            com: targetCom,
            num,
            resultv2: '1' // Enable advanced parsing
        };

        if (phone) {
            paramObj.phone = phone;
        }

        const paramStr = JSON.stringify(paramObj);

        // Sign = MD5(param + key + customer).toUpperCase()
        const signStr = paramStr + CONFIG.key + CONFIG.customer;
        const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

        const formData = new URLSearchParams();
        formData.append('customer', CONFIG.customer);
        formData.append('sign', sign);
        formData.append('param', paramStr);

        const response = await axios.post('https://poll.kuaidi100.com/poll/query.do', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data: any = response.data;
        console.log(`[Express] API Response:`, JSON.stringify(data));

        // Kuaidi100 Returns:
        // { "message": "ok", "nu": "...", "ischeck": "1", "condition": "F00", "com": "...", "status": "200", "state": "3", "data": [...] }
        // state: 0-In transit, 1-Picked up, 2-Trouble, 3-Signed, 4-Returned, 5-Delivering, 6-Returning

        if (data.status !== '200') {
            // Enhance error message for specific cases
            if (data.message && data.message.includes("公司")) {
                throw new Error(`快递公司编码错误 (${targetCom})。请尝试提供准确的快递公司名称或英文编码。`);
            }
            throw new Error(data.message || "查询失败，请检查单号或稍后再试");
        }

        const stateMap: Record<string, string> = {
            '0': '在途',
            '1': '揽收',
            '2': '疑难',
            '3': '签收',
            '4': '退签',
            '5': '派件',
            '6': '退回'
        };

        const stateText = stateMap[data.state] || '未知状态';
        const tracks = data.data || [];

        // Format the latest 5 tracks
        const history = tracks.slice(0, 10).map((t: any) => {
            return `${t.time} - ${t.context}`;
        }).join('\n');

        const resultText = `物流状态: ${stateText}\n快递公司: ${targetCom}\n单号: ${num}\n\n最近物流详情:\n${history}`;

        return {
            content: [{ type: "text" as const, text: resultText }]
        };

    } catch (error: any) {
        console.error(`[Express] Error fetching info:`, error.message);
        // Return a friendly error message to the LLM so it can explain to the user
        return {
            content: [{ type: "text" as const, text: `查询失败: ${error.message}` }],
            isError: true
        };
    }
}
