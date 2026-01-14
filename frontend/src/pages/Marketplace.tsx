import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Plus } from 'lucide-react';
import { Input } from '../components/ui/input';

interface Service {
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
}

export default function Marketplace() {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [wssUrl, setWssUrl] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await axios.get('/api/services');
                setServices(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchServices();
    }, []);

    const handleAdd = async () => {
        if (!selectedService || !wssUrl) return;
        try {
            await axios.post('/api/instances', {
                serviceId: selectedService.id,
                xiaozhiWssUrl: wssUrl
            });
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert("添加实例失败。请检查您的输入。");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Duplicate for now, should be a layout) */}
            <div className="w-64 bg-white border-r p-6 hidden md:block">
                <h1 className="text-2xl font-bold mb-8 text-primary">小智 MCP</h1>
                <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dashboard')}>仪表盘</Button>
                    <Button variant="secondary" className="w-full justify-start">服务市场</Button>
                    <Button variant="ghost" className="w-full justify-start">设置</Button>
                </nav>
            </div>

            <div className="flex-1 p-8">
                <h2 className="text-3xl font-bold mb-8">服务市场</h2>

                {/* Service List */}
                {!selectedService ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map(service => (
                            <Card key={service.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                                        <span className="text-2xl">⚡</span>
                                    </div>
                                    <CardTitle>{service.name}</CardTitle>
                                    <CardDescription>{service.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => setSelectedService(service)}>
                                        <Plus className="mr-2 h-4 w-4" /> 安装
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    /* Installation Form */
                    <div className="max-w-2xl mx-auto">
                        <Button variant="ghost" onClick={() => setSelectedService(null)} className="mb-4">← 返回市场</Button>
                        <Card>
                            <CardHeader>
                                <CardTitle>安装 {selectedService.name}</CardTitle>
                                <CardDescription>输入您的 MCP 实例连接详情。</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">小智 WebSocket 地址</label>
                                    <Input
                                        placeholder="wss://api.xiaozhi.me/mcp/?token=..."
                                        value={wssUrl}
                                        onChange={e => setWssUrl(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        这是小智平台为该智能体提供的 WebSocket 连接地址。
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSelectedService(null)}>取消</Button>
                                    <Button onClick={handleAdd} disabled={!wssUrl}>添加实例</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
