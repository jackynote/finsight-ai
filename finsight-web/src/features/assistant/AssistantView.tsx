
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, Wallet, User, Bot, Wrench, Globe, Mic, Plus, ChevronDown, Share2, Settings } from 'lucide-react';
import { ChatMessage } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';

interface AssistantProps {
  totals?: any;
  onSendMessage: (message: string) => void;
  chatHistory: ChatMessage[];
  isAITyping: boolean;
  onLoadOlderMessages?: () => void;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
}

export const AssistantView: React.FC<AssistantProps> = ({ 
  onSendMessage,
  chatHistory, 
  isAITyping,
  onLoadOlderMessages,
  hasMore = false,
  isLoadingOlder = false
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const topMarkerRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      lastScrollHeight.current = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAITyping]);

  // Intersection Observer to detect when user scrolls near top
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When top marker becomes visible, load older messages
          if (entry.isIntersecting && hasMore && !isLoadingOlder && onLoadOlderMessages) {
            onLoadOlderMessages();
          }
        });
      },
      { root: scrollRef.current, rootMargin: '100px' }
    );

    if (topMarkerRef.current) {
      observer.observe(topMarkerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingOlder, onLoadOlderMessages]);

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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className="h-0.5 w-5 bg-slate-600 rounded-full"></span>
              <span className="h-0.5 w-3 bg-slate-600 rounded-full"></span>
              <span className="h-0.5 w-5 bg-slate-600 rounded-full"></span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">Playground</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Share2 size={18} /></button>
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Settings size={18} /></button>
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Plus size={18} /></button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pt-8 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto px-6 space-y-8 pb-8">
            {/* Top marker for intersection observer */}
            <div ref={topMarkerRef} className="h-1"></div>

            {/* Loading older messages indicator */}
            {isLoadingOlder && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  Loading older messages...
                </div>
              </div>
            )}

            {chatHistory.length === 0 && !isLoadingOlder && (
              <div className="py-20 flex flex-col items-center text-center space-y-6">
                <h2 className="text-4xl text-slate-400 font-light">Explore FinSight models</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-12">
                  <div className="p-6 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-all cursor-pointer text-left group">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Featured</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Test out our most advanced financial models.</p>
                  </div>
                  <div className="p-6 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-all cursor-pointer text-left group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <Bot size={18} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Wealth Advisory</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Build your portfolio strategies with Gemini 3.</p>
                  </div>
                  <div className="p-6 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-all cursor-pointer text-left group">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                      <TrendingUp size={18} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Market Analysis</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Real-time market insights and predictions.</p>
                  </div>
                </div>
              </div>
            )}

            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    {msg.role === 'user' ? (
                      <div className="text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl text-slate-800 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="text-slate-800 py-2">
                        <MarkdownMessage content={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isAITyping && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="py-4 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="shrink-0 bg-white border-t border-slate-100 py-6 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
              {quickActions.map((action, i) => (
                <button 
                  key={i}
                  onClick={() => onSendMessage(action.label)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-400 transition-all flex items-center gap-2 shadow-sm"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/20 transition-all">
              <form onSubmit={handleSubmit} className="flex flex-col">
                <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Start typing a prompt to see what our models can do"
                  className="w-full bg-transparent border-none resize-none py-3 px-4 focus:ring-0 focus:outline-none focus-visible:outline-none text-slate-800 placeholder:text-slate-400"
                  disabled={isAITyping}
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-2 text-slate-500 hover:bg-white rounded-xl transition-all flex items-center gap-2 text-xs font-medium">
                      <Wrench size={16} /> <span className="hidden sm:inline">Tools</span>
                    </button>
                    <button type="button" className="p-2 text-slate-500 hover:bg-white rounded-xl transition-all flex items-center gap-2 text-xs font-medium bg-blue-50/50 text-blue-600 border border-blue-100">
                      <Globe size={16} /> <span className="hidden sm:inline">Grounding with Google Search</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-2 text-slate-500 hover:bg-white rounded-xl transition-all">
                      <Mic size={18} />
                    </button>
                    <button type="button" className="p-2 text-slate-500 hover:bg-white rounded-xl transition-all">
                      <Plus size={18} />
                    </button>
                    <button 
                      type="submit"
                      disabled={!input.trim() || isAITyping}
                      className="ml-2 bg-slate-200 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 hover:text-white disabled:opacity-50 transition-all"
                    >
                      Run <Send size={14} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-4">
              FinSight AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
