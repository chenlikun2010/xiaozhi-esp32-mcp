
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, Key, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6 text-blue-400" />
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin/dashboard">
                        <Button variant={isActive('/admin/dashboard') ? "secondary" : "ghost"} className="w-full justify-start text-white hover:text-white hover:bg-slate-800">
                            <Users className="mr-2 h-4 w-4" /> 用户管理
                        </Button>
                    </Link>
                    <Link to="/admin/codes">
                        <Button variant={isActive('/admin/codes') ? "secondary" : "ghost"} className="w-full justify-start text-white hover:text-white hover:bg-slate-800">
                            <Key className="mr-2 h-4 w-4" /> 激活码管理
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> 退出登录
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
