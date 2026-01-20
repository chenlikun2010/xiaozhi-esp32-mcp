import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { label: '仪表盘', path: '/dashboard' },
        { label: '服务市场', path: '/marketplace' },
        { label: '知识库', path: '/knowledge' },
        { label: '设置', path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
                <h1 className="text-xl font-bold text-primary">小慧机器人 MCP 服务平台</h1>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r p-6 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:block",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <h1 className="text-2xl font-bold mb-8 text-primary hidden md:block">小慧机器人 MCP 服务平台</h1>
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <Button
                            key={item.path}
                            variant={location.pathname === item.path ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                navigate(item.path);
                                setSidebarOpen(false);
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full">
                {children}
            </main>
        </div>
    );
}
