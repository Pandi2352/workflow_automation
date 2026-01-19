import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, Settings, User, Layers, Database, Lock, Book } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ icon: Icon, path, label }: { icon: any, path: string, label: string }) => (
    <div className="relative group">
        <button 
            onClick={() => navigate(path)}
            className={`p-3 rounded-lg transition-all flex justify-center w-full cursor-pointer ${
                isActive(path) 
                ? 'text-[#10b981] bg-[#10b981]/10' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <Icon size={20} strokeWidth={1.5} />
        </button>
        {/* Tooltip */}
        <div className="absolute left-14 top-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {label}
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-16 bg-white border-r border-slate-200 py-4 flex flex-col items-center justify-between z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        <div className="space-y-6 w-full px-2">
            <div className="flex justify-center mb-6">
                <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    <Zap size={20} fill="currentColor" />
                </div>
            </div>
            
            <nav className="space-y-2 flex flex-col items-center">
                <NavItem icon={Home} path="/dashboard" label="Overview" />
                <NavItem icon={Layers} path="/workflows" label="Workflows" />
                <NavItem icon={Database} path="/databases" label="Data Tables" />
                <NavItem icon={Book} path="/documentation" label="Documentation" />
                <NavItem icon={Lock} path="/credentials" label="Credentials" />
            </nav>
        </div>

        <div className="space-y-2 w-full px-2 flex flex-col items-center">
            <NavItem icon={Settings} path="/settings" label="Settings" />
            <div className="h-px w-8 bg-slate-200 my-2"></div>
            <NavItem icon={User} path="/profile" label="Profile" />
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto bg-[#f8f9fb]">
        <Outlet />
      </main>
    </div>
  );
};
