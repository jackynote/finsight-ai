
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wallet, LayoutDashboard, Receipt, Briefcase, Sparkles, LogOut, X, Bot } from 'lucide-react';

interface SidebarProps {
  totals: any;
  user: any;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ totals, user, onLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'assistant', path: '/assistant', icon: Bot, label: 'AI Assistant' },
    { id: 'transactions', path: '/transactions', icon: Receipt, label: 'Transactions' },
    { id: 'assets', path: '/assets', icon: Briefcase, label: 'Assets' },
    { id: 'insights', path: '/insights', icon: Sparkles, label: 'AI Insights' }
  ];

  return (
    <aside className={`
      fixed inset-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
      w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-8
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between md:block">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-lg"><Wallet className="w-6 h-6 text-white" /></div>
          <span className="font-bold text-xl tracking-tight text-slate-900">FinSight AI</span>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X /></button>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <NavLink 
            key={item.id}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Net Worth</p>
          <p className="text-2xl font-bold text-slate-900">${totals.netWorth.toLocaleString()}</p>
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
