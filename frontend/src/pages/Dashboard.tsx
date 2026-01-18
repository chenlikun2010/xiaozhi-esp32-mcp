import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Layout from '../components/Layout';
import { Plus, Play, Square, Trash2, Power, CreditCard, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ActivationModal } from '../components/ActivationModal';


interface Instance {
    id: number;
    serviceId: number;
    xiaozhiWssUrl: string;
    status: string;
    startTime?: string;
    active: boolean;
    service?: {
        name: string;
    };
}

export default function Dashboard() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [showActivateModal, setShowActivateModal] = useState(false);

    // Check expiration
    const expireDate = user.expireDate ? new Date(user.expireDate) : null;
    const isExpired = expireDate ? expireDate < new Date() : false;

    // Add token interceptor
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchInstances = async () => {
        try {
            const res = await axios.get('/api/instances');
            setInstances(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!isExpired) {
            fetchInstances();
            const interval = setInterval(fetchInstances, 5000); // Poll every 5s
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [isExpired]);

    const handleStart = async (id: number) => {
        try {
            await axios.post(`/api/instances/${id}/start`);
            fetchInstances();
        } catch (error) {
            console.error(error);
        }
    };

    const handleStop = async (id: number) => {
        try {
            await axios.post(`/api/instances/${id}/stop`);
            fetchInstances();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除这个实例吗？")) return;
        try {
            await axios.delete(`/api/instances/${id}`);
            fetchInstances();
        } catch (error) {
            console.error(error);
        }
    };

    if (isExpired) {
        return (
            <Layout>
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">欢迎回来, {user.email?.split('@')[0]}</h2>
                </div>

                <Card className="bg-[#1e293b] text-white border-0 p-8 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-medium text-gray-300 mb-8">用户激活状态</h3>

                    <div className="flex-1 flex flex-col justify-center items-start space-y-4">
                        <div className="flex items-center text-red-400 gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-bold text-lg">试用期已过期</span>
                        </div>

                        <p className="text-gray-400">请购买激活时长继续使用服务</p>

                        <p className="text-gray-500 text-sm">
                            使用到期时间: {expireDate ? expireDate.toLocaleString() : 'N/A'}
                        </p>
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-6 text-lg"
                            onClick={() => setShowActivateModal(true)}
                        >
                            <CreditCard className="mr-2 h-5 w-5" /> 购买激活时长
                        </Button>
                    </div>
                </Card>

                <ActivationModal
                    isOpen={showActivateModal}
                    onClose={() => setShowActivateModal(false)}
                    onSuccess={() => window.location.reload()}
                />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold">仪表盘</h2>
                    <p className="text-muted-foreground">欢迎回来, {user.email}</p>
                </div>
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
                    <Card className="p-3 md:p-4 bg-primary text-primary-foreground md:w-auto">
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm opacity-80">邀请码</span>
                            <span className="text-lg md:text-xl font-mono font-bold tracking-wider">{user.inviteCode || 'N/A'}</span>
                        </div>
                    </Card>
                    <Button className="w-full md:w-auto bg-white text-primary hover:bg-gray-100 border border-gray-200 shadow-sm" onClick={() => navigate('/marketplace')}>
                        <Plus className="mr-2 h-4 w-4" /> 新增实例
                    </Button>
                </div>
            </div>

            {/* Instance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map(instance => (
                    <Card key={instance.id} className="flex flex-col overflow-hidden border-2 hover:border-primary/50 transition-colors">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Power className={cn("h-8 w-8", instance.active ? "text-green-600" : "text-gray-400")} />
                                </div>
                                <div className={cn("px-3 py-1 rounded-full text-sm font-bold border",
                                    instance.status === 'running' ? 'bg-green-50 text-green-700 border-green-200' :
                                        instance.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                                    {instance.status === 'running' ? '运行中' :
                                        instance.status === 'error' ? '异常' : '已停止'}
                                </div>
                            </div>

                            <h3 className="font-bold text-xl mb-1 line-clamp-1" title={instance.service ? instance.service.name : `MCP 服务 #${instance.serviceId}`}>
                                {instance.service ? instance.service.name : `MCP 服务 #${instance.serviceId}`}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">ID: {instance.id}</p>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                                <p className="text-xs text-gray-500 font-mono mb-1">WebSocket 地址</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs flex-1 truncate select-all">{instance.xiaozhiWssUrl}</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                        const text = instance.xiaozhiWssUrl;
                                        if (navigator.clipboard && window.isSecureContext) {
                                            navigator.clipboard.writeText(text).then(() => {
                                                alert("WebSocket 地址已复制到剪贴板！");
                                            }).catch(() => {
                                                prompt("复制失败，请手动复制：", text);
                                            });
                                        } else {
                                            prompt("请手动复制 WebSocket 地址：", text);
                                        }
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50/50 border-t grid grid-cols-2 gap-3">
                            {instance.status !== 'running' ? (
                                <Button
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-sm flex items-center justify-center gap-2"
                                    onClick={() => handleStart(instance.id)}
                                >
                                    <Play className="h-5 w-5" /> 启动
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    className="w-full font-bold h-12 text-lg shadow-sm flex items-center justify-center gap-2"
                                    onClick={() => handleStop(instance.id)}
                                >
                                    <Square className="h-5 w-5" /> 停止
                                </Button>
                            )}

                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-12 text-lg flex items-center justify-center gap-2"
                                onClick={() => handleDelete(instance.id)}
                            >
                                <Trash2 className="h-5 w-5" /> 删除
                            </Button>
                        </div>
                    </Card>
                ))}
                {instances.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无服务实例</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">您还没有创建任何 MCP 服务实例。去服务市场挑选一个吧！</p>
                        <Button size="lg" onClick={() => navigate('/marketplace')}>
                            前往服务市场
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
