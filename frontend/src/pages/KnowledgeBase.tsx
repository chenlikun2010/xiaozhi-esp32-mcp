import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Layout from '../components/Layout';

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

export default function KnowledgeBase() {
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 获取文件列表
    const fetchFiles = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kb/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setFiles(data.data);
            } else {
                setError(data.error || 'Failed to fetch files');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);



    // 初始加载
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // 轮询处理中的文件状态
    useEffect(() => {
        const processingFiles = files.filter(f =>
            f.status === 'parsing' || f.status === 'processing' || f.status === 'pending'
        );

        if (processingFiles.length > 0) {
            const intervalId = setInterval(() => {
                fetchFiles();
            }, 5000);

            return () => clearInterval(intervalId);
        }
    }, [files, fetchFiles]);

    // 上传文件
    const uploadFile = async (file: File) => {
        setUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/kb/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                fetchFiles(); // 刷新列表
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    // 删除文件
    const deleteFile = async (fileId: number) => {
        if (!window.confirm('确定要删除这个文件吗？相关的向量数据也会被删除。')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kb/file/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                fetchFiles(); // 刷新列表
            } else {
                setError(data.error || 'Delete failed');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    // 拖拽处理
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    // 状态标签
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            pending: 'bg-gray-500',
            parsing: 'bg-yellow-500',
            processing: 'bg-blue-500',
            completed: 'bg-green-500',
            failed: 'bg-red-500',
        };
        const labels: Record<string, string> = {
            pending: '等待中',
            parsing: '解析中',
            processing: '处理中',
            completed: '已完成',
            failed: '失败',
        };
        return (
            <span className={`px-2 py-1 rounded text-white text-xs ${styles[status] || 'bg-gray-500'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📚</span>
                            知识库管理
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* 错误提示 */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                {error}
                                <button
                                    className="ml-2 underline"
                                    onClick={() => setError(null)}
                                >
                                    关闭
                                </button>
                            </div>
                        )}

                        {/* 使用说明 */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">💡</span>
                                <h3 className="text-lg font-medium text-gray-800">如何使用知识库</h3>
                            </div>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><strong>步骤 1：</strong>在此页面上传您的文档（PDF、Word、Excel、PPT、TXT、图片 等）</p>
                                <p><strong>步骤 2：</strong>等待文档处理完成（状态变为"已完成"）</p>
                                <p><strong>步骤 3：</strong>前往 <a href="/marketplace" className="text-blue-600 underline hover:text-blue-800">服务市场</a>，添加"个人知识库助手"服务</p>
                                <p><strong>步骤 4：</strong>粘贴您的机器人 WebSocket 地址，点击启动</p>
                                <p><strong>步骤 5：</strong>在机器人中对话，即可智能检索您上传的文档内容！</p>
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                                当前知识库共有 <strong>{files.filter(f => f.status === 'completed').length}</strong> 个已完成处理的文件。
                            </p>
                        </div>

                        {/* 上传区域 */}
                        <div
                            className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                            ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                                onChange={handleFileInput}
                                disabled={uploading}
                            />
                            <div className="text-4xl mb-2">📄</div>
                            <div className="text-lg font-medium text-gray-700">
                                {uploading ? '上传中...' : '拖拽文件到这里，或点击选择文件'}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                支持 PDF, Word, PowerPoint, Excel, TXT, Markdown, 图片
                            </div>
                        </div>

                        {/* 文件列表 */}
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">加载中...</div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                暂无文件，请上传您的知识库文档
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">文件名</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">大小</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">分片数</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">上传时间</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {files.map((file) => (
                                            <tr key={file.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">
                                                            {file.file_type === 'pdf' ? '📕' :
                                                                file.file_type === 'docx' || file.file_type === 'doc' ? '📘' :
                                                                    file.file_type === 'pptx' || file.file_type === 'ppt' ? '📙' :
                                                                        file.file_type === 'xlsx' || file.file_type === 'xls' ? '📗' :
                                                                            ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.file_type) ? '🖼️' : '📄'}
                                                        </span>
                                                        <span className="text-sm font-medium truncate max-w-xs" title={file.file_name}>
                                                            {file.file_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {formatFileSize(file.file_size)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={file.status} />
                                                    {file.status === 'failed' && file.error_message && (
                                                        <span className="ml-2 text-xs text-red-500" title={file.error_message}>
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {file.chunk_count || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {formatDate(file.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                        onClick={() => deleteFile(file.id)}
                                                    >
                                                        🗑️ 删除
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
