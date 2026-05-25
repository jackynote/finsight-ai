
import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Menu, RefreshCw } from 'lucide-react';

import { AuthModule } from './features/auth/Auth';
import { Sidebar } from './components/layout/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FinanceProvider, useFinance } from './contexts/FinanceContext';

import DashboardPage from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import AssetsPage from './pages/Assets';
import AssistantPage from './pages/Assistant';
import InsightsPage from './pages/Insights';

const AppModuleContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { totals } = useFinance();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeLabel = useMemo(() => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/assistant': return 'AI Assistant';
      case '/transactions': return 'Transactions';
      case '/assets': return 'Assets';
      case '/insights': return 'AI Insights';
      default: return 'FinSight AI';
    }
  }, [location.pathname]);

  return (
    <div className="h-screen bg-white text-slate-900 flex flex-col md:flex-row overflow-hidden">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-40">
        <span className="font-bold text-lg">FinSight AI</span>
        <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
      </div>

      <Sidebar 
        totals={totals} user={user} onLogout={logout}
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
      />

      <main className={`flex-1 ${location.pathname === '/assistant' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-8 lg:p-12'}`}>
        <div className={`${location.pathname === '/assistant' ? 'max-w-none h-full' : 'max-w-6xl mx-auto space-y-8'}`}>
          {location.pathname !== '/assistant' && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">{activeLabel}</h1>
                <p className="text-slate-500">Managing {user?.name.split(' ')[0]}'s wealth.</p>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { user, login, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <RefreshCw className="animate-spin w-8 h-8 text-slate-900" />
    </div>
  );
  
  if (!user) return <AuthModule onLogin={(token, userData) => login(token, userData)} />;
  
  return (
    <BrowserRouter>
      <FinanceProvider>
        <AppModuleContent />
      </FinanceProvider>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
