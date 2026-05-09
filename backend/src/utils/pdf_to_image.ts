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
 * 已下线：PDF 转图片工具已随知识库功能一并移除。
 */

export async function convertPdfToImages(): Promise<Buffer[]> {
  throw new Error('该功能已下线。');
}
