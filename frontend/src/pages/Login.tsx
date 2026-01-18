import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || '登录失败');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-[350px]">
                <CardHeader>
                    <CardTitle>登录</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="邮箱"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">登录</Button>
                        <div className="flex justify-between text-sm mt-4">
                            <Link to="/register" className="text-blue-500">没账号？注册</Link>
                            <Link to="/forgot-password" className="text-gray-500 hover:text-gray-700">忘记密码？</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
