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
 * 已下线：OCR 工具已随知识库功能一并移除。
 */

export async function recognizePage(): Promise<string> {
  throw new Error('该功能已下线。');
}
