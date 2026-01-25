import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    const handleSendCode = async () => {
        if (!email) {
            setError("请输入邮箱");
            return;
        }
        try {
            await axios.post('/api/send-verification-code', { email, type: 'register' });
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            alert("验证码已发送");
        } catch (err: any) {
            setError(err.response?.data?.message || '发送失败');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/register', { email, password, inviteCode: inviteCode || undefined, verificationCode });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || '注册失败');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-[350px]">
                <CardHeader>
                    <CardTitle>注册</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="邮箱"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="验证码"
                                value={verificationCode}
                                onChange={e => setVerificationCode(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSendCode}
                                disabled={countdown > 0}
                                className="w-32 shrink-0"
                            >
                                {countdown > 0 ? `${countdown}s` : '发送验证码'}
                            </Button>
                        </div>
                        <Input
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="邀请码 (可选)"
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">注册</Button>
                        <div className="text-center text-sm">
                            <Link to="/login" className="text-blue-500">已有账号？登录</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
