
import React, { useState } from 'react';
import { Wallet, User, Mail, Lock, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../../api/api';

interface AuthModuleProps {
  onLogin: (token: string, user: any) => void;
}

export const AuthModule: React.FC<AuthModuleProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (view === 'login') {
        const response = await api.post('/auth/login', { email, password });
        onLogin(response.data.access_token, response.data.user);
      } else {
        await api.post('/auth/register', { email, password, name });
        const response = await api.post('/auth/login', { email, password });
        onLogin(response.data.access_token, response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex bg-slate-900 p-3 rounded-2xl mb-4 shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FinSight AI</h1>
          <p className="text-slate-500 mt-2">Intelligence in every transaction.</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setView('login')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setView('register')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                  <input name="name" required type="text" placeholder="John Doe" className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-slate-900 transition-all text-slate-900" />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input name="email" required type="email" placeholder="hello@finsight.ai" className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-slate-900 transition-all text-slate-900" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input name="password" required type="password" placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-slate-900 transition-all text-slate-900" />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all mt-4 flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? (
                <RefreshCw className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <span>{view === 'login' ? 'Secure Login' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
