-- ============================================================
-- 小智 MCP 报告解读系统 - 数据库初始化脚本
-- 目标数据库: 阿里云 RDS PostgreSQL
-- 数据库名: fcbaogao
-- 注意: 使用专用 schema 'mcp' 避免 public schema 权限问题
-- ============================================================

-- 1. 开启 pgvector 扩展 (需要超级用户权限或已预安装)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建专用 schema
CREATE SCHEMA IF NOT EXISTS mcp;

-- 设置搜索路径
SET search_path TO mcp, public;

-- 3. 创建报告状态枚举类型
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE mcp.report_status AS ENUM ('pending', 'processing', 'completed');
    END IF;
END$$;

-- 4. 创建 reports 表
CREATE TABLE IF NOT EXISTS mcp.reports (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    word_url        VARCHAR(2048) NOT NULL,
    publish_time    TIMESTAMP WITH TIME ZONE,
    status          mcp.report_status NOT NULL DEFAULT 'pending',
    local_path      VARCHAR(1024),
    device_id       VARCHAR(128) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 为 word_url 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_word_url ON mcp.reports(word_url);

-- 为 device_id 创建索引 (支持按设备查询)
CREATE INDEX IF NOT EXISTS idx_reports_device_id ON mcp.reports(device_id);

-- 为 status 创建索引 (支持按状态筛选)
CREATE INDEX IF NOT EXISTS idx_reports_status ON mcp.reports(status);

-- 为 publish_time 创建索引 (支持时间范围查询)
CREATE INDEX IF NOT EXISTS idx_reports_publish_time ON mcp.reports(publish_time DESC);

-- 为 created_at 创建索引 (支持最新报告查询)
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON mcp.reports(created_at DESC);

-- 5. 创建 report_embeddings 表
CREATE TABLE IF NOT EXISTS mcp.report_embeddings (
    id              BIGSERIAL PRIMARY KEY,
    report_id       BIGINT NOT NULL REFERENCES mcp.reports(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    embedding       vector(1024) NOT NULL,
    chunk_index     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 为 report_id 创建索引 (支持按报告查询所有段落)
CREATE INDEX IF NOT EXISTS idx_report_embeddings_report_id ON mcp.report_embeddings(report_id);

-- 6. 为 embedding 字段创建 HNSW 索引 (优化向量相似度搜索)
-- HNSW 参数说明:
--   m: 每个节点的最大连接数，越大精度越高但索引越大 (推荐 16-64)
--   ef_construction: 构建时的搜索宽度，越大构建越慢但索引质量越高 (推荐 64-200)
-- 使用余弦相似度 (cosine) 作为距离度量，适合文本嵌入
CREATE INDEX IF NOT EXISTS idx_report_embeddings_hnsw 
ON mcp.report_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);

-- 7. 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION mcp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 reports 表创建触发器
DROP TRIGGER IF EXISTS trigger_reports_updated_at ON mcp.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON mcp.reports
    FOR EACH ROW
    EXECUTE FUNCTION mcp.update_updated_at_column();

-- ============================================================
-- 连接池与并发优化建议 (注释说明)
-- ============================================================
-- 针对 1000 台设备并发查询的优化建议:
-- 
-- a) 连接池配置 (在应用层配置，如 pgBouncer 或 Node.js pg-pool):
--    - 最大连接数: 建议 100-200 (RDS 实例规格决定上限)
--    - 空闲超时: 30-60 秒
--    - 连接队列: 启用等待队列避免连接耗尽
--
-- b) 查询优化:
--    - 向量搜索时使用 LIMIT 限制返回数量
--    - 使用预编译语句 (Prepared Statements)
--    - 考虑添加读副本分担查询压力
--
-- c) HNSW 搜索参数 (运行时设置):
--    SET hnsw.ef_search = 100;  -- 搜索时的候选集大小，越大越精确但越慢
--
-- d) 应用连接时设置搜索路径:
--    SET search_path TO mcp, public;

-- ============================================================
-- 示例查询: 向量相似度搜索
-- ============================================================
-- SET search_path TO mcp, public;
-- SELECT re.id, re.content, r.title,
--        1 - (re.embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
-- FROM report_embeddings re
-- JOIN reports r ON r.id = re.report_id
-- WHERE r.status = 'completed'
-- ORDER BY re.embedding <=> '[0.1, 0.2, ...]'::vector
-- LIMIT 10;
-- ============================================================

-- 输出成功信息
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '- schema mcp 已创建';
    RAISE NOTICE '- mcp.reports 表已创建';
    RAISE NOTICE '- mcp.report_embeddings 表已创建';
    RAISE NOTICE '- HNSW 向量索引已创建';
END$$;
