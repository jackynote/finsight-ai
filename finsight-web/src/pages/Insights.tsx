
import React, { useState, useEffect } from 'react';
import { financeService } from '../features/finance/financeService';
import { AIInsight } from '../types';

const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const { insights: aiInsights } = await financeService.getAiInsights();
        setInsights(aiInsights);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading insights...</div>;
  }

  return (
    <div className="space-y-6">
      {insights.map((insight, index) => (
        <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
              {index + 1}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{insight.type || 'AI Insight'}</h3>
          </div>
          <p className="text-slate-600 leading-relaxed">{insight.content}</p>
        </div>
      ))}
      {insights.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No insights generated yet. Add more data to get AI-powered recommendations.
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
