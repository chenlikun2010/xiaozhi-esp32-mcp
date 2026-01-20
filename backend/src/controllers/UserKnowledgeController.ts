import { Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UserKnowledgeService } from '../services/UserKnowledgeService';

// ============================================================
// Multer 配置
// ============================================================

const storage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        const userId = req.user?.id || req.body?.userId;
        if (!userId) {
            return cb(new Error('User ID is required'), '');
        }
        const userDir = UserKnowledgeService.getUserUploadDir(userId);
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        // 使用时间戳 + 原始文件名避免冲突
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'md'];
    const ext = path.extname(file.originalname).slice(1).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}`));
    }
};

export const upload = multer({
    storage,
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
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileType = path.extname(file.originalname).slice(1).toLowerCase();

            // 1. 创建文件记录 (状态: parsing)
            const fileId = await UserKnowledgeService.createFileRecord(
                userId,
                file.originalname,
                fileType,
                file.size
            );

            console.log(`[KnowledgeController] File uploaded: ${file.originalname} (ID: ${fileId})`);

            // 2. 异步处理文件 (不阻塞响应)
            setImmediate(async () => {
                try {
                    await UserKnowledgeService.processFile(
                        fileId,
                        userId,
                        file.path,
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
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 获取用户文件列表
     * GET /api/knowledge/files
     */
    static async getFiles(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
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
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 删除文件
     * DELETE /api/knowledge/files/:id
     */
    static async deleteFile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = parseInt(req.params.id);
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
            const userId = (req as any).user?.id;
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
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = parseInt(req.params.id);
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
