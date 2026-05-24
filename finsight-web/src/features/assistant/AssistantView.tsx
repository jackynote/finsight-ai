
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, Wallet, User, Bot, AlertCircle } from 'lucide-react';
import { ChatMessage, Transaction, Asset } from '../../types';

interface AssistantProps {
  totals: any;
  onSendMessage: (message: string) => Promise<void>;
  chatHistory: ChatMessage[];
  isAITyping: boolean;
}

export const AssistantView: React.FC<AssistantProps> = ({ 
  totals, 
  onSendMessage, 
  chatHistory, 
  isAITyping
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAITyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAITyping) return;
    onSendMessage(input);
    setInput('');
  };

  const quickActions = [
    { label: "Add $50 for Groceries", icon: <Wallet size={14} /> },
    { label: "How am I doing?", icon: <Sparkles size={14} /> },
    { label: "Check my assets", icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center">
                <Bot size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Welcome to FinSight AI</h3>
                <p className="text-sm max-w-xs">I'm your personal financial assistant. You can tell me things like "I just spent $20 on coffee" or ask "How is my portfolio doing?"</p>
              </div>
            </div>
          )}

          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.content}
                  {msg.action && msg.action.type !== 'NONE' && (
                    <div className="mt-3 pt-3 border-t border-slate-200/20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                      <AlertCircle size={12} /> Action Executed: {msg.action.type}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isAITyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {quickActions.map((action, i) => (
              <button 
                key={i}
                onClick={() => onSendMessage(action.label)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your money..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm"
              disabled={isAITyping}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isAITyping}
              className="absolute right-2 top-2 bottom-2 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
