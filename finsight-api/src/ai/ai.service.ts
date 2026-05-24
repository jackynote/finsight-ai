import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class AiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async processMessage(message: string, context: { transactions: any[]; assets: any[] }) {
    if (!this.model) {
      return {
        content: 'AI Service is not configured properly.',
        action: { type: 'NONE' },
      };
    }

    const systemInstruction = `
      You are FinSight AI, a professional financial assistant.
      Current Date: ${new Date().toISOString().split('T')[0]}
      
      Actions you can trigger:
      1. ADD_TRANSACTION: { "amount": number, "description": string, "type": "income" | "expense", "category": string }
      2. UPDATE_ASSET: { "name": string, "current_price": number }
      3. SHOW_INSIGHTS: {}
      4. NONE: {}

      Categories: FOOD_DRINK, SHOPPING, HOUSING, TRANSPORTATION, ENTERTAINMENT, HEALTH, INVESTMENT, INCOME, OTHERS.

      Context:
      - Last 5 Transactions: ${JSON.stringify(context.transactions)}
      - Current Assets: ${JSON.stringify(context.assets)}

      Respond ONLY in JSON format:
      {
        "content": "Your friendly message",
        "action": { "type": "ACTION_TYPE", "data": { ... } }
      }
    `;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }],
        },
      });

      const response = result.response;
      return JSON.parse(response.text()) as any;
    } catch (error) {
      console.error('Gemini Error:', error);
      return {
        content:
          "I'm having trouble connecting to my brain. Please try again later.",
        action: { type: 'NONE' },
      };
    }
  }

  async generateInsights(transactions: any[], assets: any[]) {
    if (!this.model) {
      throw new Error('AI Service is not configured properly.');
    }

    const systemInstruction = `
      You are FinSight AI, a financial analyst.
      Analyze the user's financial data (transactions and assets) and provide exactly 3 actionable insights or observations.
      
      Data:
      - Transactions: ${JSON.stringify(transactions)}
      - Assets: ${JSON.stringify(assets)}

      Respond ONLY in JSON format:
      {
        "insights": [
          { "title": "Insight title", "content": "Insight description", "type": "success" | "warning" | "info" }
        ]
      }
    `;

    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Generate 3 financial insights based on my data.' },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }],
        },
      });

      const response = result.response;
      return JSON.parse(response.text()) as any;
    } catch (error) {
      console.error('Gemini Insights Error:', error);
      return {
        insights: [
          {
            title: 'Analysis unavailable',
            content: 'We could not generate insights at this time.',
            type: 'info',
          },
        ],
      };
    }
  }
}
