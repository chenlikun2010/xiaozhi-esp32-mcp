-- ============================================================
-- 小慧机器人 - 个人知识库 数据库初始化脚本
-- 适配：阿里云 RDS PostgreSQL + SiliconFlow BGE-M3 (1024维)
-- ============================================================

-- 确保 pgvector 扩展已启用
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. 用户文件表 (user_knowledge_files)
-- 记录用户上传的文件信息
-- ============================================================
CREATE TABLE IF NOT EXISTS user_knowledge_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,                          -- 关联用户ID
    file_name VARCHAR(255) NOT NULL,                   -- 原始文件名
    file_type VARCHAR(20) NOT NULL,                    -- 文件类型: pdf, docx, txt, md 等
    file_size BIGINT DEFAULT 0,                        -- 文件大小(字节)
    status VARCHAR(20) DEFAULT 'pending',              -- 状态: pending, parsing, completed, failed
    chunk_count INTEGER DEFAULT 0,                     -- 分片数量
    error_message TEXT,                                -- 失败时的错误信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为 user_id 创建索引，加速用户文件列表查询
CREATE INDEX IF NOT EXISTS idx_user_knowledge_files_user_id 
    ON user_knowledge_files(user_id);

-- 为 status 创建索引，加速待处理文件查询
CREATE INDEX IF NOT EXISTS idx_user_knowledge_files_status 
    ON user_knowledge_files(status);

-- ============================================================
-- 2. 用户知识向量表 (user_knowledge_embeddings)
-- 存储文件分片的向量数据
-- ============================================================
CREATE TABLE IF NOT EXISTS user_knowledge_embeddings (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES user_knowledge_files(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,                          -- 冗余存储，便于快速按用户检索
    content TEXT NOT NULL,                             -- 文本段落内容
    embedding vector(2560) NOT NULL,                   -- Qwen/Qwen3-Embedding-4B 向量 (2560维)
    chunk_index INTEGER DEFAULT 0,                     -- 分片序号
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为 user_id 创建普通索引，确保检索时能快速定位到该用户的数据
CREATE INDEX IF NOT EXISTS idx_user_knowledge_embeddings_user_id 
    ON user_knowledge_embeddings(user_id);

-- 为 file_id 创建索引，加速按文件查询
CREATE INDEX IF NOT EXISTS idx_user_knowledge_embeddings_file_id 
    ON user_knowledge_embeddings(file_id);

-- 为 embedding 字段创建 HNSW 索引，加速向量相似度搜索
-- 使用余弦距离 (cosine distance) 作为相似度度量
-- 2560维向量超出 HNSW 2000维限制，暂时禁用索引，使用精确搜索
-- CREATE INDEX IF NOT EXISTS idx_user_knowledge_embeddings_hnsw 
--     ON user_knowledge_embeddings 
--     USING hnsw (embedding vector_cosine_ops)
--     WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 示例查询：按用户进行语义搜索
-- ============================================================
-- SELECT 
--     ukf.file_name,
--     uke.content,
--     1 - (uke.embedding <=> $query_embedding::vector) as similarity
-- FROM user_knowledge_embeddings uke
-- JOIN user_knowledge_files ukf ON ukf.id = uke.file_id
-- WHERE uke.user_id = $user_id
--   AND 1 - (uke.embedding <=> $query_embedding::vector) > 0.3
-- ORDER BY uke.embedding <=> $query_embedding::vector ASC
-- LIMIT 5;

COMMENT ON TABLE user_knowledge_files IS '小慧机器人 - 用户上传的知识库文件';
COMMENT ON TABLE user_knowledge_embeddings IS '小慧机器人 - 知识库文件向量嵌入';
