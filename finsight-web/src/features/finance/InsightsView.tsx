
import React, { useState, useEffect } from 'react';
import { AIInsight } from '../../types';
import { financeService } from './financeService';

export const InsightsView: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const { insights: data } = await financeService.getAiInsights();
        setInsights(data);
      } catch (error) {
        console.error("Error fetching AI insights:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="bg-slate-50 h-48 rounded-3xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insights.map((insight, idx) => (
        <div key={idx} className={`p-6 rounded-3xl border ${insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' : insight.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
          <h3 className="font-bold text-lg text-slate-900 mb-2">{insight.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{insight.content}</p>
        </div>
      ))}
    </div>
  );
};
