import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, Play, Square, Trash2, Power } from 'lucide-react';
import { cn } from '../lib/utils';

interface Instance {
    id: number;
    serviceId: number;
    xiaozhiWssUrl: string;
    status: string;
    startTime?: string;
    active: boolean;
}

export default function Dashboard() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        fetchInstances();
        const interval = setInterval(fetchInstances, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r p-6 hidden md:block">
                <h1 className="text-2xl font-bold mb-8 text-primary">小智 MCP</h1>
                <nav className="space-y-2">
                    <Button variant="secondary" className="w-full justify-start">仪表盘</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/marketplace')}>服务市场</Button>
                    <Button variant="ghost" className="w-full justify-start">设置</Button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold">仪表盘</h2>
                        <p className="text-muted-foreground">欢迎回来, {user.email}</p>
                    </div>
                    <div>
                        <Card className="p-4 bg-primary text-primary-foreground">
                            <div className="text-sm opacity-80">邀请码</div>
                            <div className="text-xl font-mono font-bold tracking-wider">{user.inviteCode || 'N/A'}</div>
                        </Card>
                        <Button className="mt-4 w-full bg-white text-primary hover:bg-gray-100" onClick={() => navigate('/marketplace')}>
                            <Plus className="mr-2 h-4 w-4" /> 新增实例
                        </Button>
                    </div>
                </div>

                {/* Instance List */}
                <div className="grid gap-4">
                    {instances.map(instance => (
                        <Card key={instance.id} className="flex flex-row items-center p-4 gap-4">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <Power className={cn("h-6 w-6", instance.active ? "text-green-500" : "text-gray-400")} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">MCP 服务 #{instance.serviceId}</h3>
                                <p className="text-sm text-gray-500 font-mono truncate max-w-[400px]">{instance.xiaozhiWssUrl}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("px-2 py-1 rounded text-xs uppercase font-bold",
                                    instance.status === 'running' ? 'bg-green-100 text-green-700' :
                                        instance.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                                    {instance.status}
                                </div>
                                {instance.status !== 'running' ? (
                                    <Button size="sm" onClick={() => handleStart(instance.id)}><Play className="h-4 w-4 mr-1" /> 启动</Button>
                                ) : (
                                    <Button size="sm" variant="destructive" onClick={() => handleStop(instance.id)}><Square className="h-4 w-4 mr-1" /> 停止</Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(instance.id)}><Trash2 className="h-4 w-4 text-gray-500" /></Button>
                            </div>
                        </Card>
                    ))}
                    {instances.length === 0 && !loading && (
                        <div className="text-center text-gray-500 py-12">未找到实例。请在上方添加一个。</div>
                    )}
                </div>
            </div>
        </div>
    );
}
