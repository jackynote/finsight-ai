
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Briefcase, Sparkles, LogOut, X, Bot, Info, Settings, ChevronDown, Coins } from 'lucide-react';

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
    { id: 'assistant', path: '/assistant', icon: Bot, label: 'Playground' },
    { id: 'transactions', path: '/transactions', icon: Receipt, label: 'Transactions' },
    { id: 'assets', path: '/assets', icon: Briefcase, label: 'Assets' },
    { id: 'insights', path: '/insights', icon: Sparkles, label: 'AI Insights' },
  ];

  if (user?.role === 'ADMIN') {
    menuItems.splice(4, 0, {
      id: 'currency-rates',
      path: '/currency-rates',
      icon: Coins,
      label: 'Currency Rates',
    });
  }

  return (
    <aside className={`
      fixed inset-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
      w-64 bg-[#f8f9fa] border-r border-slate-200 flex flex-col
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6">
        <div className="flex items-center justify-between md:mb-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-slate-900">FinSight AI</span>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X /></button>
        </div>

        <nav className="flex flex-col gap-0.5 mt-4">
          {menuItems.map((item) => (
            <NavLink 
              key={item.id}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${isActive ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-200/50'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={item.id === 'assistant' ? 'text-slate-900' : 'text-slate-500'} />
                <span>{item.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 space-y-1">
        <div className="mb-6 mx-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">Upgrade to unlock more</p>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">Access higher limits, Pro models, and more.</p>
          <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold transition-all">Learn more</button>
        </div>

        {/* <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200/50 transition-all">
          <Search size={18} className="text-slate-500" /> <span>Search</span>
        </button> */}
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200/50 transition-all">
          <Info size={18} className="text-slate-500" /> <span>What's new</span>
        </button>
        {/* <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200/50 transition-all">
          <Key size={18} className="text-slate-500" /> <span>Get API key</span>
        </button> */}
        <NavLink 
          to="/settings"
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <Settings size={18} className="text-slate-500" /> <span>Settings</span>
        </NavLink>
        
        <div className="pt-2 mt-2 border-t border-slate-200">
          <div className="flex items-center justify-between px-3 py-2 group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-600 truncate group-hover:text-slate-900 transition-colors">{user.email}</span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
