import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Layout from '../components/Layout';
import { Plus, Play, Square, Trash2, Power } from 'lucide-react';
import { cn } from '../lib/utils';

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

            {/* Instance List */}
            <div className="grid gap-4">
                {instances.map(instance => (
                    <Card key={instance.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                            <div className="p-3 bg-gray-100 rounded-full flex-shrink-0">
                                <Power className={cn("h-6 w-6", instance.active ? "text-green-500" : "text-gray-400")} />
                            </div>
                            <div className="flex-1 sm:hidden">
                                <h3 className="font-semibold text-lg">{instance.service ? `${instance.service.name} #${instance.id}` : `MCP 服务 #${instance.serviceId}`}</h3>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-w-0">
                            <h3 className="font-semibold text-lg hidden sm:block">{instance.service ? `${instance.service.name} #${instance.id}` : `MCP 服务 #${instance.serviceId}`}</h3>
                            <p className="text-sm text-gray-500 font-mono truncate w-full block">{instance.xiaozhiWssUrl}</p>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-2 mt-2 sm:mt-0 relative z-10 shrink-0 min-w-fit whitespace-nowrap">
                            <div className={cn("px-2 py-1 rounded text-xs uppercase font-bold",
                                instance.status === 'running' ? 'bg-green-100 text-green-700' :
                                    instance.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                                {instance.status}
                            </div>
                            <div className="flex gap-2">
                                {instance.status !== 'running' ? (
                                    <Button size="sm" type="button" onClick={() => handleStart(instance.id)}><Play className="h-4 w-4 mr-1" /> 启动</Button>
                                ) : (
                                    <Button size="sm" variant="destructive" type="button" onClick={() => handleStop(instance.id)}><Square className="h-4 w-4 mr-1" /> 停止</Button>
                                )}
                                <Button size="icon" variant="ghost" type="button" onClick={() => handleDelete(instance.id)}><Trash2 className="h-4 w-4 text-gray-500" /></Button>
                            </div>
                        </div>
                    </Card>
                ))}
                {instances.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">未找到实例。请在上方添加一个。</div>
                )}
            </div>
        </Layout>
    );
}
