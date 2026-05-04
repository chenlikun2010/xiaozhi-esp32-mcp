import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';

interface KnowledgeFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'parsing' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  error_message?: string;
  created_at: string;
}

const API_BASE = '/api';

function fileIcon(type: string) {
  if (type === 'pdf') return '📕';
  if (type === 'docx' || type === 'doc') return '📘';
  if (type === 'pptx' || type === 'ppt') return '📙';
  if (type === 'xlsx' || type === 'xls') return '📗';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(type)) return '🖼️';
  return '📄';
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const STATUS_LABEL: Record<string, string> = { pending: '等待中', parsing: '解析中', processing: '处理中', completed: '已完成', failed: '失败' };
const STATUS_CLASS: Record<string, string> = {
  pending: 'app-badge-pending', parsing: 'app-badge-processing', processing: 'app-badge-processing',
  completed: 'app-badge-completed', failed: 'app-badge-failed',
};

export default function KnowledgeBase() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/kb/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFiles(data.data);
      else setError(data.error || '获取文件列表失败');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  useEffect(() => {
    const processing = files.filter(f => ['parsing', 'processing', 'pending'].includes(f.status));
    if (processing.length > 0) {
      const t = setInterval(fetchFiles, 5000);
      return () => clearInterval(t);
    }
  }, [files, fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/kb/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (data.success) fetchFiles();
      else setError(data.error || '上传失败');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: number) => {
    if (!confirm('确定要删除这个文件吗？相关的向量数据也会被删除。')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/kb/file/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchFiles();
      else setError(data.error || '删除失败');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const completedCount = files.filter(f => f.status === 'completed').length;

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <div className="app-page-tag">KNOWLEDGE BASE</div>
        <h2 className="app-page-title">知识库</h2>
        <div className="app-page-sub">上传文档，让 AI 助手检索您的私人知识</div>
      </div>

      {/* Usage guide */}
      <div className="app-info" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, color: '#00c8ff', marginBottom: 8, fontSize: 12 }}>// 使用说明</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            '步骤 1：在此页面上传文档（PDF、Word、Excel、PPT、TXT、图片等）',
            '步骤 2：等待文档处理完成（状态变为「已完成」）',
            '步骤 3：前往服务市场，添加「个人知识库助手」服务',
            '步骤 4：粘贴机器人 WebSocket 地址，启动实例',
            '步骤 5：在机器人中对话，即可智能检索您的文档内容',
          ].map((s, i) => <div key={i}>{s}</div>)}
        </div>
        <div style={{ marginTop: 10, color: '#3d5a7a' }}>
          当前已完成处理：<span style={{ color: '#00ff9d' }}>{completedCount}</span> 个文件
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="app-error" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: .6 }}>✕</button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn('drop-zone', dragActive && 'active', uploading && 'disabled')}
        style={{ marginBottom: 24 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById('kb-file-input')?.click()}
      >
        <input
          id="kb-file-input"
          type="file"
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div className="app-spinner" /></div>
            <div className="drop-zone-text">上传中...</div>
          </>
        ) : (
          <>
            <div className="drop-zone-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="rgba(0,200,255,0.4)" strokeWidth="1.5">
                <path d="M16 22V10M10 16l6-6 6 6"/><rect x="4" y="22" width="24" height="6" rx="2"/>
              </svg>
            </div>
            <div className="drop-zone-text">拖拽文件到这里，或点击选择文件</div>
            <div className="drop-zone-sub">支持 PDF · Word · PPT · Excel · TXT · Markdown · 图片</div>
          </>
        )}
      </div>

      {/* File list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="app-spinner" />
        </div>
      ) : files.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">📂</div>
          <div className="app-empty-title">知识库为空</div>
          <div className="app-empty-desc">上传您的第一份文档，开始构建私人知识库</div>
        </div>
      ) : (
        <div className="app-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>大小</th>
                <th>状态</th>
                <th>分片数</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td className="primary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{fileIcon(file.file_type)}</span>
                      <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.file_name}>
                        {file.file_name}
                      </span>
                    </div>
                  </td>
                  <td>{formatSize(file.file_size)}</td>
                  <td>
                    <span className={`app-badge ${STATUS_CLASS[file.status] || 'app-badge-stopped'}`}>
                      {STATUS_LABEL[file.status] || file.status}
                    </span>
                    {file.status === 'failed' && file.error_message && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: '#ff6b6b' }} title={file.error_message}>⚠</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "'Share Tech Mono',monospace" }}>{file.chunk_count || '—'}</td>
                  <td style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11 }}>
                    {new Date(file.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <button className="app-btn app-btn-danger app-btn-sm" onClick={() => deleteFile(file.id)}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10H3z"/></svg>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
