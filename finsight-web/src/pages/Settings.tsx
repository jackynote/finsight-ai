
import React, { useState, useEffect } from 'react';
import { Save, User, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../features/auth/authService';
import { financeService } from '../features/finance/financeService';
import { Currency } from '../types';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [defaultCurrency, setDefaultCurrency] = useState(user?.defaultCurrency || 'USD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await financeService.getCurrencies();
        setCurrencies(data);
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };
    fetchCurrencies();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await authService.updateProfile({ name, defaultCurrency });
      updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage your account information and preferences.</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-semibold">{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text" 
                placeholder="Your Name" 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-slate-900 transition-all text-slate-900" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Default Currency</label>
            <div className="relative">
              <Globe className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <select 
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-slate-900 transition-all text-slate-900 appearance-none"
              >
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-slate-400 text-xs ml-1">This currency will be used to display your total balance across the platform.</p>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all mt-4 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? (
              <Save className="animate-pulse w-5 h-5" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Account Security</h3>
        <p className="text-slate-500 text-sm">Email: {user?.email}</p>
        <button 
          className="mt-4 text-slate-900 font-bold text-sm hover:underline"
          onClick={() => alert('Change password functionality coming soon!')}
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
