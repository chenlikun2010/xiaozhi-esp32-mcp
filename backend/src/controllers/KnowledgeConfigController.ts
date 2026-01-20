import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { AppDataSource } from '../db';
import { User } from '../entities/User';

const JWT_SECRET = process.env.JWT_SECRET || 'xiaozhi-secret-key';
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'wss://api.nocode.cc/mcp/';

// PostgreSQL 连接 (用于检查知识库状态)
const pool = new Pool({
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    max: 5,
});

pool.on('connect', (client: any) => {
    const schema = process.env.POSTGRES_SCHEMA || 'mcp';
    client.query(`SET search_path TO ${schema}, public`);
});

export class KnowledgeConfigController {

    /**
     * 获取用户知识库配置
     * GET /api/kb/config
     */
    static async getConfig(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOneBy({ id: userId });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 生成用户专属的 MCP Token
            const mcpToken = jwt.sign(
                { userId: user.id, type: 'mcp_knowledge' },
                JWT_SECRET,
                { expiresIn: '365d' } // MCP Token 有效期1年
            );

            // 生成 MCP 接入地址
            const mcpEndpoint = `${MCP_BASE_URL}?token=${mcpToken}`;

            // 检查用户是否有上传的文件
            const fileCountResult = await pool.query(
                `SELECT COUNT(*) as count FROM user_knowledge_files WHERE user_id = $1`,
                [userId]
            );
            const fileCount = parseInt(fileCountResult.rows[0]?.count || '0');

            return res.json({
                success: true,
                data: {
                    enabled: user.knowledgeEnabled,
                    mcpEndpoint: mcpEndpoint,
                    mcpToken: mcpToken,
                    fileCount: fileCount,
                    hasFiles: fileCount > 0
                }
            });

        } catch (error: any) {
            console.error('[KnowledgeConfig] Error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 切换知识库开关
     * POST /api/kb/toggle
     */
    static async toggleEnabled(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { enabled } = req.body;
            if (typeof enabled !== 'boolean') {
                return res.status(400).json({ error: 'enabled must be a boolean' });
            }

            const userRepo = AppDataSource.getRepository(User);
            await userRepo.update(userId, { knowledgeEnabled: enabled });

            console.log(`[KnowledgeConfig] User ${userId} set knowledgeEnabled = ${enabled}`);

            return res.json({
                success: true,
                data: { enabled }
            });

        } catch (error: any) {
            console.error('[KnowledgeConfig] Toggle error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * 验证 MCP Token 并返回用户信息
     * 用于 MCP 服务端验证请求
     * POST /api/kb/verify-token
     */
    static async verifyToken(req: Request, res: Response) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const decoded = jwt.verify(token, JWT_SECRET) as any;

            if (decoded.type !== 'mcp_knowledge') {
                return res.status(401).json({ error: 'Invalid token type' });
            }

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOneBy({ id: decoded.userId });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (!user.knowledgeEnabled) {
                return res.status(403).json({ error: 'Knowledge base is disabled for this user' });
            }

            // 检查用户是否有文件
            const fileCountResult = await pool.query(
                `SELECT COUNT(*) as count FROM user_knowledge_files WHERE user_id = $1 AND status = 'completed'`,
                [user.id]
            );
            const fileCount = parseInt(fileCountResult.rows[0]?.count || '0');

            return res.json({
                success: true,
                data: {
                    userId: user.id,
                    email: user.email,
                    hasFiles: fileCount > 0,
                    fileCount: fileCount
                }
            });

        } catch (error: any) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            console.error('[KnowledgeConfig] Verify token error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}
