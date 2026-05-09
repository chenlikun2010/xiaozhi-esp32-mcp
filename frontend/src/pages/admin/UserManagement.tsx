
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { format } from 'date-fns';

interface User {
    id: number;
    email: string;
    role: string;
    expireDate: string;
    invitationCode: string;
    createdAt: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<number | null>(null);
    const [editExpire, setEditExpire] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id: number) => {
        try {
            await axios.put(`/api/admin/users/${id}`, { expireDate: editExpire });
            setEditId(null);
            fetchUsers();
        } catch {
            alert("Failed to update user");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">用户管理</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">邮箱</th>
                            <th className="px-6 py-3">角色</th>
                            <th className="px-6 py-3">邀请码</th>
                            <th className="px-6 py-3">过期时间</th>
                            <th className="px-6 py-3">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{user.id}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">{user.invitationCode}</td>
                                <td className="px-6 py-4">
                                    {editId === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="datetime-local"
                                                value={editExpire}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditExpire(e.target.value)}
                                                className="h-8 w-48 text-xs"
                                            />
                                        </div>
                                    ) : (
                                        <span className={new Date(user.expireDate) < new Date() ? 'text-red-500 font-bold' : 'text-green-600'}>
                                            {format(new Date(user.expireDate), 'yyyy-MM-dd HH:mm')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editId === user.id ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSave(user.id)}>保存</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>取消</Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditId(user.id);
                                                // Format for datetime-local input: YYYY-MM-DDThh:mm
                                                const d = new Date(user.expireDate);
                                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                setEditExpire(d.toISOString().slice(0, 16));
                                            }}
                                        >
                                            修改过期时间
                                        </Button>
                                    )}
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
