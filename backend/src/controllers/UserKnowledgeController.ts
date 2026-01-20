import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { UserKnowledgeService } from '../services/UserKnowledgeService';

// 使用 CommonJS 引入以避免 TS 类型问题
const multer = require('multer');

// 定义 Multer 文件接口
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

// ============================================================
// Multer 配置 - 使用内存存储，之后在 handler 中保存
// ============================================================

const fileFilter = (req: Request, file: MulterFile, cb: any) => {
    const allowedTypes = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'md'];
    const ext = path.extname(file.originalname).slice(1).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}`));
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB 限制
    }
});

// ============================================================
// 控制器方法
// ============================================================

export class UserKnowledgeController {

    /**
     * 上传文件
     * POST /api/knowledge/upload
     */
    static async uploadFile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const file = (req as any).file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // 解决中文文件名乱码问题
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const fileType = path.extname(originalName).slice(1).toLowerCase();

            // 保存文件到用户目录
            const userDir = UserKnowledgeService.getUserUploadDir(userId);
            const uniqueName = `${Date.now()}_${originalName}`;
            const filePath = path.join(userDir, uniqueName);
            fs.writeFileSync(filePath, file.buffer);

            // 1. 创建文件记录 (状态: parsing)
            const fileId = await UserKnowledgeService.createFileRecord(
                userId,
                originalName,
                fileType,
                file.size
            );


            console.log(`[KnowledgeController] File uploaded: ${originalName} (ID: ${fileId})`);

            // 2. 异步处理文件 (不阻塞响应)
            setImmediate(async () => {
                try {
                    await UserKnowledgeService.processFile(
                        fileId,
                        userId,
                        filePath,
                        fileType
                    );
                } catch (error: any) {
                    console.error(`[KnowledgeController] Async processing failed:`, error.message);
                }
            });

            // 3. 立即返回响应
            return res.json({
                success: true,
                message: 'File uploaded and processing started',
                data: {
                    id: fileId,
                    fileName: file.originalname,
                    fileType,
                    fileSize: file.size,
                    status: 'parsing'
                }
            });

        } catch (error: any) {
            console.error('[KnowledgeController] Upload error:', error.message);

            // Better error messages for common issues
            if (error.message?.includes('ECONNREFUSED') ||
                error.message?.includes('Connection terminated') ||
                error.message?.includes('timeout') ||
                error.message?.includes('getaddrinfo')) {
                return res.status(503).json({
                    error: '知识库数据库暂时不可用，请稍后重试',
                    details: error.message
                });
            }
            if (error.message?.includes('ENOENT')) {
                return res.status(500).json({
                    error: '文件存储目录不存在，请联系管理员',
                    details: error.message
                });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 获取用户文件列表
     * GET /api/knowledge/files
     */
    static async getFiles(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const files = await UserKnowledgeService.getUserFiles(userId);

            return res.json({
                success: true,
                data: files
            });

        } catch (error: any) {
            console.error('[KnowledgeController] Get files error:', error.message);

            // If PostgreSQL is unreachable, return empty list with warning instead of 500 error
            if (error.message?.includes('ECONNREFUSED') ||
                error.message?.includes('Connection terminated') ||
                error.message?.includes('timeout') ||
                error.message?.includes('getaddrinfo')) {
                console.warn('[KnowledgeController] PostgreSQL unavailable, returning empty list');
                return res.json({
                    success: true,
                    data: [],
                    warning: '知识库服务暂时不可用，请稍后重试'
                });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 删除文件
     * DELETE /api/knowledge/files/:id
     */
    static async deleteFile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = parseInt(req.params.id as string);
            if (isNaN(fileId)) {
                return res.status(400).json({ error: 'Invalid file ID' });
            }

            const deleted = await UserKnowledgeService.deleteFile(fileId, userId);

            if (deleted) {
                return res.json({
                    success: true,
                    message: 'File deleted successfully'
                });
            } else {
                return res.status(404).json({ error: 'File not found or access denied' });
            }

        } catch (error: any) {
            console.error('[KnowledgeController] Delete file error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 搜索用户知识库
     * POST /api/knowledge/search
     */
    static async search(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { query, limit = 5 } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const results = await UserKnowledgeService.search(userId, query, limit);

            return res.json({
                success: true,
                data: results
            });

        } catch (error: any) {
            console.error('[KnowledgeController] Search error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 获取文件状态
     * GET /api/knowledge/files/:id/status
     */
    static async getFileStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = parseInt(req.params.id as string);
            if (isNaN(fileId)) {
                return res.status(400).json({ error: 'Invalid file ID' });
            }

            const files = await UserKnowledgeService.getUserFiles(userId);
            const file = files.find(f => f.id === fileId);

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            return res.json({
                success: true,
                data: {
                    id: file.id,
                    fileName: file.file_name,
                    status: file.status,
                    chunkCount: file.chunk_count,
                    errorMessage: file.error_message
                }
            });

        } catch (error: any) {
            console.error('[KnowledgeController] Get status error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}
