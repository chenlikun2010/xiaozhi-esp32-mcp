import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';
import wechatSupport from '../assets/wechat-support.jpg';
import { X } from 'lucide-react';

interface ActivationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ActivationModal({ isOpen, onClose, onSuccess }: ActivationModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleActivate = async () => {
        if (!code) return;
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/activate', { code });
            // Update local user data
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.expireDate = res.data.user.expireDate;
            localStorage.setItem('user', JSON.stringify(user));

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || '激活失败，请检查验证码');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">购买激活时长</h2>
                    <p className="text-sm text-muted-foreground">
                        请扫描下方二维码联系客服购买激活码。
                    </p>
                </div>

                <div className="flex flex-col items-center py-4 gap-4">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border bg-gray-50">
                        <img src={wechatSupport} alt="WeChat Support" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">微信号：McpManageSupport</p>

                    <div className="w-full space-y-2 mt-2">
                        <label className="text-sm font-medium">输入激活码</label>
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="例如：VIP-MONTH"
                            className="text-center font-mono tracking-widest uppercase"
                        />
                        {error && <div className="text-sm text-red-500 flex items-center justify-center">{error}</div>}
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
                    <Button variant="outline" onClick={onClose}>取消</Button>
                    <Button onClick={handleActivate} disabled={loading || !code}>
                        {loading ? '激活中...' : '立即激活'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
