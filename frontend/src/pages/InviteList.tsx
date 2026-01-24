import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Layout from '../components/Layout';
import { Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { copyToClipboard } from '../lib/utils';

interface InvitedUser {
    email: string;
    giftDays: number;
    createdAt: string;
    expireDate: string;
}

export default function InviteList() {
    const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch invited users
    useEffect(() => {
        const fetchInvited = async () => {
            try {
                const res = await axios.get('/api/user/invited');
                setInvitedUsers(res.data);
            } catch (error) {
                console.error("Failed to fetch invited users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvited();
    }, []);

    const inviteLink = `${window.location.origin}/register?inviteCode=${user.inviteCode}`;

    const handleCopy = async () => {
        const success = await copyToClipboard(inviteLink);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            // Fallback alert if even execCommand fails (rare)
            alert('复制失败，请手动复制：\n' + inviteLink);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" onClick={() => navigate('/dashboard')}>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            邀请新用户
                        </h2>
                    </Button>
                    <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                        已邀请 {invitedUsers.length} 人
                    </div>
                    <div className="flex-1"></div>
                    <Button
                        onClick={handleCopy}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? '已复制链接' : '复制邀请链接'}
                    </Button>
                </div>

                {/* Invite Info Card */}
                <Card className="bg-[#1e293b] text-white border-0 p-8 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-gray-400 mb-2">我的邀请码</div>
                            <div className="text-4xl font-mono tracking-wider mb-4">{user.inviteCode || 'LOADING'}</div>
                            <div className="text-gray-400 text-sm">
                                每邀请 1 位新用户注册，双方使用期均延长 7 天
                            </div>
                        </div>
                        <div className="text-right text-gray-400 text-sm mt-2">
                            使用到期: {user.expireDate ? new Date(user.expireDate).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                </Card>

                {/* Users Table */}
                <div className="bg-[#1e293b] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#2d3748] text-gray-300 font-medium">
                            <tr>
                                <th className="px-6 py-4">受邀用户</th>
                                <th className="px-6 py-4">赠送天数</th>
                                <th className="px-6 py-4">注册时间</th>
                                <th className="px-6 py-4">试用截止</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">加载中...</td>
                                </tr>
                            ) : invitedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        暂无邀请记录，快去邀请朋友吧！
                                    </td>
                                </tr>
                            ) : (
                                invitedUsers.map((u, index) => (
                                    <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                                        <td className="px-6 py-4 text-blue-400">{u.giftDays} 天</td>
                                        <td className="px-6 py-4">{new Date(u.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Relative indicator logic could go here */}
                                                {new Date(u.expireDate) < new Date() && <span className="h-2 w-2 rounded-full bg-red-500"></span>}
                                                {new Date(u.expireDate) >= new Date() && <span className="h-2 w-2 rounded-full bg-green-500"></span>}
                                                {new Date(u.expireDate).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
