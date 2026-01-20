import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SILICONFLOW_API_KEY;
const BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
// 用户指定的默认模型，也可以通过环境变量覆盖
const MODEL_NAME = process.env.SILICONFLOW_OCR_MODEL || 'deepseek-ai/DeepSeek-OCR';

interface OCRConfig {
    maxRetries?: number;
    timeoutMs?: number;
    model?: string;
}

const DEFAULT_CONFIG: OCRConfig = {
    maxRetries: 3,
    timeoutMs: 30000,
    model: MODEL_NAME
};

/**
 * 识别单张图片中的文字 (OCR)
 * 使用 SiliconFlow DeepSeek-VL2 模型
 * 
 * @param base64Image 图片的 Base64 编码 (不包含 "data:image/jpeg;base64," 前缀，如果包含请自行处理，本函数会尝试兼容)
 * @param config 配置项 (超时、重试次数、模型名)
 * @returns 识别到的文字内容
 */
export async function recognizePage(base64Image: string, config: OCRConfig = {}): Promise<string> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { maxRetries, timeoutMs, model } = finalConfig;

    // 确保 base64 格式正确 (添加 data URI scheme 如果缺失)
    // 假设大多是 png 或 jpeg，DeepSeek VL 通常支持
    let imageUrl = base64Image;
    if (!base64Image.startsWith('data:')) {
        // 默认假设为 jpeg，实际大多数模型对 mime type 不太敏感，只要是 base64
        imageUrl = `data:image/jpeg;base64,${base64Image}`;
    }

    const payload = {
        model: model,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl
                        }
                    },
                    {
                        type: "text",
                        text: "请识别图片中的所有文字。如果是表格，请保持其逻辑结构。直接输出识别到的文字内容，不要输出任何解释说明。"
                    }
                ]
            }
        ],
        max_tokens: 4096, // 给予足够的输出空间
        temperature: 0.1  // 低温度以保证准确性
    };

    let attempt = 0;
    let lastError: any;

    while (attempt <= (maxRetries || 0)) {
        try {
            console.log(`[DeepSeek-OCR] Attempt ${attempt + 1}/${(maxRetries || 0) + 1} using model ${model}...`);

            const response = await axios.post(`${BASE_URL}/chat/completions`, payload, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: timeoutMs
            });

            const data = response.data as any;
            if (data && data.choices && data.choices.length > 0) {
                const content = data.choices[0].message.content;
                console.log(`[DeepSeek-OCR] Success! Length: ${content.length}`);
                return content;
            } else {
                throw new Error('Invalid response structure from SiliconFlow API');
            }

        } catch (error: any) {
            lastError = error;
            const isRetryable = isRetryableError(error);
            const errorMessage = error.response?.data?.error?.message || error.message;

            console.warn(`[DeepSeek-OCR] Attempt ${attempt + 1} failed: ${errorMessage}`);

            if (!isRetryable || attempt >= (maxRetries || 0)) {
                break;
            }

            attempt++;
            // Exponential backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`[DeepSeek-OCR] All ${attempt} attempts failed.`);
    throw lastError;
}

function isRetryableError(error: any): boolean {
    if (error.code === 'ECONNABORTED') return true; // Timeout
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status === 429 || status >= 500; // Rate limit or Server error
}
