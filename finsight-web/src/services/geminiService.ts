
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight, Asset, ChatAction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  
  const prompt = `
    Analyze these financial transactions and provide 3 actionable insights.
    Transactions: ${JSON.stringify(transactions)}
    
    Focus on:
    1. Saving opportunities.
    2. Spending patterns or anomalies.
    3. General financial health tips.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A catchy title for the insight" },
              content: { type: Type.STRING, description: "Detailed explanation of the insight" },
              type: { type: Type.STRING, enum: ["saving", "warning", "tip"], description: "The nature of the insight" }
            },
            required: ["title", "content", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return [{
      title: "Keep Tracking!",
      content: "Continue logging your transactions to unlock personalized AI insights about your spending habits.",
      type: "tip"
    }];
  }
};

export const processChatMessage = async (
  message: string, 
  context: { transactions: Transaction[], assets: Asset[] }
): Promise<{ content: string; action: ChatAction }> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  
  const systemInstruction = `
    You are FinSight AI, a helpful and professional financial assistant.
    Your goal is to help users manage their finances through conversation.
    
    Current Date: ${new Date().toISOString().split('T')[0]}
    
    You can perform these actions:
    1. ADD_TRANSACTION: When a user wants to log an expense or income. 
       Requires: amount (number), description (string), type ('income' or 'expense'), category (string).
    2. SHOW_INSIGHTS: When a user asks for advice, summary, or how they are doing.
    3. UPDATE_ASSET: When a user mentions a price change for an asset they own.
    4. NONE: For general conversation.
    
    Context:
    - Transactions: ${JSON.stringify(context.transactions.slice(0, 5))} (last 5)
    - Assets: ${JSON.stringify(context.assets)}
    
    Respond in JSON format:
    {
      "content": "Your friendly response to the user",
      "action": {
        "type": "ADD_TRANSACTION" | "SHOW_INSIGHTS" | "UPDATE_ASSET" | "NONE",
        "data": { ... relevant data for the action ... }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            action: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["ADD_TRANSACTION", "SHOW_INSIGHTS", "UPDATE_ASSET", "NONE"] },
                data: { type: Type.OBJECT }
              },
              required: ["type"]
            }
          },
          required: ["content", "action"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      content: "I'm sorry, I encountered an error processing your request. How else can I help?",
      action: { type: 'NONE' }
    };
  }
};
