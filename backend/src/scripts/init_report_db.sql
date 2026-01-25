-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    word_url TEXT UNIQUE NOT NULL,
    word_path TEXT,
    publish_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    local_path TEXT,
    device_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report_embeddings table
CREATE TABLE IF NOT EXISTS report_embeddings (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(2560), -- Qwen/Qwen3-Embedding-4B dimension
    chunk_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster vector search
-- Note: 2560 embedding might exceed HNSW max dimension (2000) on some builds.
-- Using exact search for now, or ensure pgvector is built with large dim support.
-- CREATE INDEX IF NOT EXISTS report_embeddings_embedding_idx ON report_embeddings USING hnsw (embedding vector_cosine_ops);
