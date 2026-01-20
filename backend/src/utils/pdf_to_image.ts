/**
 * PDF to Image Conversion Utility
 * 
 * 使用 pdf-to-img 库将 PDF 转换为图片 Buffer 数组
 * 
 * 关键修复历史:
 * - 原版使用 pdf-img-convert，但由于多版本 pdfjs-dist 冲突导致 "Image or Canvas expected" 错误
 * - 尝试使用 pdfjs-dist + canvas + polyfill，仍然失败
 * - 最终解决方案: 使用 pdf-to-img 库，它内部正确处理了 Node.js 环境
 */

/**
 * 将 PDF Buffer 转换为图片 Buffer 数组
 * 
 * @param pdfBuffer PDF 文件 Buffer
 * @param dpi 目标分辨率，默认 150 (scale = dpi / 72)
 * @returns Promise<Buffer[]> 图片 Buffer 数组 (PNG 格式)
 */
export async function convertPdfToImages(pdfBuffer: Buffer, dpi: number = 150): Promise<Buffer[]> {
    try {
        // 动态导入 pdf-to-img (ESM module)
        const { pdf } = await import('pdf-to-img');

        // 计算缩放比例 (PDF 标准是 72 DPI)
        const scale = dpi / 72.0;

        // 获取页数用于日志
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(pdfBuffer);
        const numPages = data.numpages;
        console.log(`[PDF Converter] Total pages: ${numPages}`);

        const imageBuffers: Buffer[] = [];
        let pageNum = 0;

        // 使用 pdf-to-img 转换
        for await (const image of await pdf(pdfBuffer, { scale })) {
            pageNum++;

            // image 是 Uint8Array (PNG 格式)
            const buffer = Buffer.from(image);
            imageBuffers.push(buffer);

            console.log(`[PDF Converter] Converted page ${pageNum}/${numPages}`);
        }

        console.log(`[PDF Converter] Successfully converted ${imageBuffers.length} pages.`);
        return imageBuffers;

    } catch (error: any) {
        console.error('[PDF Converter] Error converting PDF to images:', error.message);
        throw error;
    }
}

// 测试用例 (注释掉)
/*
import * as fs from 'fs';
async function test() {
    const buf = fs.readFileSync('test.pdf');
    const images = await convertPdfToImages(buf);
    if (images.length > 0) {
        fs.writeFileSync('page1.png', images[0]);
        console.log('Test completed, saved page1.png');
    }
}
test().catch(console.error);
*/
