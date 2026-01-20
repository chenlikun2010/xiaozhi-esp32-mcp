import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

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

interface KnowledgeConfig {
    enabled: boolean;
    mcpEndpoint: string;
    mcpToken: string;
    fileCount: number;
    hasFiles: boolean;
}

const API_BASE = '/api';

export default function KnowledgeBase() {
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [config, setConfig] = useState<KnowledgeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [toggling, setToggling] = useState(false);

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

    // 获取配置信息
    const fetchConfig = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kb/config`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setConfig(data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch config:', err);
        }
    }, []);

    // 切换知识库开关
    const toggleConfig = async (enabled: boolean) => {
        setToggling(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kb/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled }),
            });
            const data = await response.json();
            if (data.success) {
                setConfig(prev => prev ? { ...prev, enabled } : null);
            } else {
                setError(data.error || 'Failed to toggle');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setToggling(false);
        }
    };

    // 复制到剪贴板
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 初始加载
    useEffect(() => {
        fetchFiles();
        fetchConfig();
    }, [fetchFiles, fetchConfig]);

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
        <div className="p-6 max-w-6xl mx-auto">
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

                    {/* MCP 接入配置 */}
                    {config && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🔌</span>
                                    <h3 className="text-lg font-medium text-gray-800">MCP 接入设置</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        {config.enabled ? '已启用' : '已禁用'}
                                    </span>
                                    <button
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                            } ${toggling ? 'opacity-50' : ''}`}
                                        onClick={() => toggleConfig(!config.enabled)}
                                        disabled={toggling}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {config.enabled && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-600 block mb-1">MCP 接入地址</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={config.mcpEndpoint}
                                                className="flex-1 px-3 py-2 text-sm bg-white border rounded-lg text-gray-700"
                                            />
                                            <button
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                                onClick={() => copyToClipboard(config.mcpEndpoint)}
                                            >
                                                {copied ? '✓ 已复制' : '复制'}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        将此地址配置到小智等 MCP 客户端，即可通过对话检索您的个人知识库。
                                        当前知识库共有 <strong>{config.fileCount}</strong> 个文件。
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

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
                            accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls"
                            onChange={handleFileInput}
                            disabled={uploading}
                        />
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-lg font-medium text-gray-700">
                            {uploading ? '上传中...' : '拖拽文件到这里，或点击选择文件'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            支持 PDF, Word, PowerPoint, Excel, TXT, Markdown
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
                                                                    file.file_type === 'xlsx' || file.file_type === 'xls' ? '📗' : '📄'}
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
    );
}
