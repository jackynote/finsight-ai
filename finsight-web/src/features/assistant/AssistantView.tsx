import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Send, Sparkles, TrendingUp, Wallet, User, Bot, Mic } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrollRef = useRef(false);
  const isPrependingHistoryRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);

  const scrollToBottom = () => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || chatHistory.length === 0) return;

    if (isPrependingHistoryRef.current) {
      const nextScrollHeight = container.scrollHeight;
      const scrollDelta = nextScrollHeight - previousScrollHeightRef.current;
      container.scrollTop += scrollDelta;
      isPrependingHistoryRef.current = false;
      return;
    }

    if (!hasInitialScrollRef.current) {
      const frameId = requestAnimationFrame(() => {
        scrollToBottom();
        hasInitialScrollRef.current = true;
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [chatHistory, isAITyping]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollingUp = container.scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = container.scrollTop;

    if (
      !scrollingUp ||
      container.scrollTop > 24 ||
      !hasMore ||
      isLoadingOlder ||
      !onLoadOlderMessages
    ) {
      return;
    }

    previousScrollHeightRef.current = container.scrollHeight;
    isPrependingHistoryRef.current = true;
    onLoadOlderMessages();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAITyping || isSubmittingRef.current) return;

    const message = input.trim();
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setInput('');
    onSendMessage(message);
    queueMicrotask(() => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    });
  };

  const quickActions = [
    { label: "Add $50 for Groceries", icon: <Wallet size={14} /> },
    { label: "How am I doing?", icon: <Sparkles size={14} /> },
    { label: "Check my assets", icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header removed to maximize chat space */}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pt-6 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto px-6 space-y-8 pb-8">
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
        <div className="shrink-0 bg-white border-t border-slate-100 py-4 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage(action.label)}
                  disabled={isAITyping}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-400 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/20 transition-all"
            >
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isSubmittingRef.current || isAITyping || !input.trim()) return;
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask FinSight anything..."
                className="min-h-11 max-h-36 flex-1 bg-transparent border-none resize-none py-3 px-4 focus:ring-0 focus:outline-none focus-visible:outline-none text-slate-800 placeholder:text-slate-400"
                disabled={isAITyping || isSubmitting}
              />
              <button
                type="button"
                aria-label="Voice input"
                className="mb-0.5 p-3 text-slate-500 hover:bg-white hover:text-slate-900 rounded-2xl transition-all disabled:opacity-50"
                disabled={isAITyping || isSubmitting}
              >
                <Mic size={18} />
              </button>
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || isAITyping || isSubmitting}
                className="mb-0.5 bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-center hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-70 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
