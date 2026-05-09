
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { format } from 'date-fns';

interface ActivationCode {
    id: number;
    code: string;
    durationDays: number;
    isUsed: boolean;
    usedBy?: number;
    usedAt?: string;
    createdAt: string;
}

export default function CodeManagement() {
    const [codes, setCodes] = useState<ActivationCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [genCount, setGenCount] = useState(1);
    const [genDays, setGenDays] = useState(30);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            const res = await axios.get('/api/admin/codes');
            setCodes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await axios.post('/api/admin/codes/generate', { count: genCount, durationDays: genDays });
            fetchCodes();
            alert("生成成功");
        } catch (error: unknown) {
            console.error(error);
            if (axios.isAxiosError<{ message?: string }>(error)) {
                alert("生成失败: " + (error.response?.data?.message || error.message));
            } else {
                alert("生成失败");
            }
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">激活码管理</h2>

                <div className="flex items-end gap-2 bg-white p-4 rounded-lg shadow-sm border">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">数量</label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={genCount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenCount(parseInt(e.target.value))}
                            className="w-20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">天数</label>
                        <Input
                            type="number"
                            value={genDays}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenDays(parseInt(e.target.value))}
                            className="w-24"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={generating}>
                        {generating ? '生成中...' : '生成激活码'}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">激活码</th>
                            <th className="px-6 py-3">时长(天)</th>
                            <th className="px-6 py-3">状态</th>
                            <th className="px-6 py-3">创建时间</th>
                            <th className="px-6 py-3">使用者ID</th>
                            <th className="px-6 py-3">使用时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {codes.map(code => (
                            <tr key={code.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{code.id}</td>
                                <td className="px-6 py-4 font-mono font-medium">{code.code}</td>
                                <td className="px-6 py-4">{code.durationDays}</td>
                                <td className="px-6 py-4">
                                    {code.isUsed ? (
                                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">已使用</span>
                                    ) : (
                                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">未使用</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{format(new Date(code.createdAt), 'yyyy-MM-dd')}</td>
                                <td className="px-6 py-4">{code.usedBy || '-'}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {code.usedAt ? format(new Date(code.usedAt), 'yyyy-MM-dd HH:mm') : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center text-gray-500">加载中...</div>}
            </div>
        </div>
    );
}
