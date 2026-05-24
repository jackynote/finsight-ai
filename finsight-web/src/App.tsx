
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Plus, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction, TransactionType, AIInsight, Asset, ChatMessage } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_ASSETS } from './constants';
import { io, Socket } from 'socket.io-client';

import { AuthModule } from './features/auth/Auth';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { AssistantView } from './features/assistant/AssistantView';
import { Modals } from './components/common/Modals';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { financeService } from './features/finance/financeService';

const AppModuleContent: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<'transaction' | 'asset' | 'updatePrice' | ''>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
      auth: { token }
    });

    newSocket.on('messageResponse', (response) => {
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        action: response.action
      };
      setChatHistory(prev => [...prev, assistantMsg]);

      // Update Local State if action executed on backend
      if (response.actionResult) {
        if (response.action.type === 'ADD_TRANSACTION') {
          setTransactions(prev => [response.actionResult, ...prev]);
        } else if (response.action.type === 'UPDATE_ASSET') {
          setAssets(prev => prev.map(a => a.id === response.actionResult.id ? response.actionResult : a));
        }
      }
    });

    newSocket.on('isTyping', (typing) => {
      setIsAITyping(typing);
    });

    newSocket.on('chatHistory', (history) => {
      const formatted = history.map((h: any) => ({
        id: h.id,
        role: h.role,
        content: h.content,
        timestamp: h.created_at,
        action: h.action_type ? { type: h.action_type, data: h.action_data } : undefined
      }));
      setChatHistory(formatted);
    });

    newSocket.emit('getChatHistory');

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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

  const totals = useMemo(() => {
    const txTotals = transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.INCOME) acc.income += Number(curr.amount);
      else acc.expenses += Number(curr.amount);
      return acc;
    }, { income: 0, expenses: 0 });
    const assetValue = assets.reduce((acc, asset) => acc + (Number(asset.current_price) * Number(asset.quantity)), 0);
    const assetPurchaseValue = assets.reduce((acc, asset) => acc + (Number(asset.purchase_price) * Number(asset.quantity)), 0);
    const liquidBalance = txTotals.income - txTotals.expenses;
    return { ...txTotals, balance: liquidBalance, assetValue, assetGain: assetValue - assetPurchaseValue, netWorth: liquidBalance + assetValue };
  }, [transactions, assets]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, asts] = await Promise.all([
          financeService.getTransactions(),
          financeService.getAssets(),
        ]);
        setTransactions(txs);
        setAssets(asts);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (transactions.length === 0 && assets.length === 0) return;
      setIsLoadingInsights(true);
      try {
        const { insights } = await financeService.getAiInsights();
        setInsights(insights);
      } catch (error) {
        console.error("Error fetching AI insights:", error);
      } finally {
        setIsLoadingInsights(false);
      }
    };
    fetchAIInsights();
  }, [transactions.length, assets.length]);

  const handleSendMessage = (content: string) => {
    if (!socket) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMsg]);
    
    socket.emit('sendMessage', { message: content });
  };

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      date: new Date().toISOString().split('T')[0],
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as TransactionType,
    };
    try {
      const newTx = await financeService.createTransaction(data);
      setTransactions(prev => [newTx, ...prev]);
      setIsModalOpen('');
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      date: new Date().toISOString().split('T')[0],
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      purchase_price: Number(formData.get('purchasePrice')),
      current_price: Number(formData.get('purchasePrice')), 
      quantity: Number(formData.get('quantity')),
    };
    try {
      // @ts-ignore - Backend use snake_case for some fields
      const newAsset = await financeService.createAsset(data);
      setAssets(prev => [...prev, newAsset]);
      setIsModalOpen('');
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const formData = new FormData(e.currentTarget);
    const newPrice = Number(formData.get('currentPrice'));
    try {
      const updated = await financeService.updateAsset(selectedAsset.id, { current_price: newPrice });
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? updated : a));
      setIsModalOpen('');
      setSelectedAsset(null);
    } catch (error) {
      console.error("Error updating asset price:", error);
    }
  };

  const handleGlobalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isModalOpen === 'transaction') handleTransactionSubmit(e);
    if (isModalOpen === 'asset') handleAssetSubmit(e);
    if (isModalOpen === 'updatePrice') handleUpdatePrice(e);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-40">
        <span className="font-bold text-lg">FinSight AI</span>
        <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
      </div>

      <Sidebar 
        totals={totals} user={user} onLogout={logout}
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">{activeLabel}</h1>
              <p className="text-slate-500">Managing {user?.name.split(' ')[0]}'s wealth.</p>
            </div>
            {location.pathname !== '/' && location.pathname !== '/assistant' && location.pathname !== '/insights' && (
              <button 
                onClick={() => setIsModalOpen(location.pathname === '/assets' ? 'asset' : 'transaction')} 
                className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"
              >
                <Plus size={20} /> <span>Add {location.pathname === '/assets' ? 'Asset' : 'Entry'}</span>
              </button>
            )}
          </div>

          <Routes>
            <Route path="/" element={<DashboardView totals={totals} transactions={transactions} assets={assets} insights={insights} setActiveTab={(tab) => navigate(`/${tab}`)} />} />
            <Route path="/assistant" element={<AssistantView totals={totals} onSendMessage={handleSendMessage} chatHistory={chatHistory} isAITyping={isAITyping} />} />
            <Route path="/transactions" element={
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Details</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm text-slate-600">{tx.date}</td>
                        <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-900">{tx.description}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{tx.category}</p></td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            } />
            <Route path="/assets" element={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                  <div key={asset.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{asset.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase">{asset.quantity} Units</p>
                      </div>
                      <button onClick={() => { setSelectedAsset(asset); setIsModalOpen('updatePrice'); }} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl transition-colors">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <div><p className="text-sm text-slate-500">Value</p><p className="text-2xl font-bold">${(Number(asset.current_price) * Number(asset.quantity)).toLocaleString()}</p></div>
                      <div className={`text-right font-bold flex items-center gap-1 ${Number(asset.current_price) >= Number(asset.purchase_price) ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(asset.current_price) >= Number(asset.purchase_price) ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(((Number(asset.current_price) - Number(asset.purchase_price)) / (Number(asset.purchase_price) || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            } />
            <Route path="/insights" element={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingInsights ? [1,2,3].map(i => <div key={i} className="bg-slate-50 h-48 rounded-3xl animate-pulse" />) : 
                  insights.map((insight, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border ${insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' : insight.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                      <h3 className="font-bold text-lg text-slate-900 mb-2">{insight.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{insight.content}</p>
                    </div>
                  ))
                }
              </div>
            } />
          </Routes>
        </div>
      </main>

      {isModalOpen && <Modals isModalOpen={isModalOpen} onClose={() => setIsModalOpen('')} onSubmit={handleGlobalSubmit} selectedAsset={selectedAsset} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
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
      <AppModuleContent />
    </BrowserRouter>
  );
};

export default App;
