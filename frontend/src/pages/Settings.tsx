import { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import Layout from '../components/Layout';

export default function Settings() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.post('/api/change-password', { oldPassword, newPassword });
            setMessage('密码修改成功');
            setOldPassword('');
            setNewPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || '修改失败');
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">设置</h2>

                <Card>
                    <CardHeader>
                        <CardTitle>修改密码</CardTitle>
                        <CardDescription>定期更新密码以保护您的账户安全。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">当前密码</label>
                                <Input
                                    type="password"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    placeholder="输入当前密码"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">新密码</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="输入新密码"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {message && <p className="text-green-500 text-sm">{message}</p>}
                            <Button type="submit">保存更改</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="mt-8 border-red-100">
                    <CardHeader>
                        <CardTitle className="text-red-600">账户操作</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                if (confirm('确定要退出登录吗？')) {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    window.location.href = '/login';
                                }
                            }}
                        >
                            退出登录
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
