import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: Code + Reset
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/forgot-password', { email });
            setMessage('验证码已发送，请检查控制台（Mock Email）。');
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || '发送失败');
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/reset-password', { email, code, newPassword });
            alert('密码重置成功，请登录。');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || '重置失败');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-[400px]">
                <CardHeader>
                    <CardTitle>忘记密码</CardTitle>
                    <CardDescription>
                        {step === 1 ? "输入注册邮箱以获取验证码" : "输入验证码并设置新密码"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="邮箱地址"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full">获取验证码</Button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm mb-4">
                                {message}
                            </div>
                            <Input
                                type="text"
                                placeholder="验证码 (6位数字)"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="新密码"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full">重置密码</Button>
                        </form>
                    )}
                    <div className="text-center text-sm mt-4">
                        <Link to="/login" className="text-blue-500">返回登录</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
