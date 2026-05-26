import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIInsight } from './entities/ai-insight.entity';

export interface AIInsightItem {
  title: string;
  content: string;
  type: string;
}

export interface AIInsightResponse {
  insights: AIInsightItem[];
}

@Injectable()
export class AiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AIInsight)
    private readonly aiInsightRepository: Repository<AIInsight>,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelId =
      this.configService.get<string>('GEMINI_MODEL_ID') || 'gemini-2.5-flash';
    
    console.log(`AI Service initializing with model: ${modelId}, API Key length: ${apiKey?.length || 0}`);

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelId });

    // Check connectivity in background
    fetch('https://generativelanguage.googleapis.com/')
      .then((res) => console.log(`Gemini API connectivity check: ${res.status}`))
      .catch((err) => console.error('Gemini API connectivity check failed:', err));
  }

  async findAllByUserId(userId: string) {
    return this.aiInsightRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async processMessage(
    message: string,
    context: { transactions: any[]; assets: any[] },
  ) {
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
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Gemini Error:', error);
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        if ((error as any).cause) {
          console.error('Error Cause:', (error as any).cause);
        }
      }
      return {
        content:
          "I'm having trouble connecting to my brain. Please try again later.",
        action: { type: 'NONE' },
      };
    }
  }

  async generateAndSaveInsights(
    userId: string,
    transactions: any[],
    assets: any[],
  ): Promise<{ insights: (AIInsight | AIInsightItem)[] }> {
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
      const data = JSON.parse(response.text()) as AIInsightResponse;

      if (data.insights && Array.isArray(data.insights)) {
        return await this.aiInsightRepository.manager.transaction(
          async (manager) => {
            // Clear old insights for this user
            await manager.delete(AIInsight, { user_id: userId });

            // Save new insights
            const entities = data.insights.map((ins) =>
              manager.create(AIInsight, {
                user_id: userId,
                title: ins.title,
                content: ins.content,
                type: ins.type,
              }),
            );
            const savedEntities = await manager.save(entities);
            return { insights: savedEntities };
          },
        );
      }

      return data;
    } catch (error) {
      console.error('Gemini Insights Error:', error);
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        if ((error as any).cause) {
          console.error('Error Cause:', (error as any).cause);
        }
      }
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

  // Legacy method for backward compatibility if needed, but we'll use generateAndSaveInsights
  async generateInsights(transactions: any[], assets: any[]) {
    // This would be without persistence, kept for safety or temporary use
    return this.generateAndSaveInsights('unknown', transactions, assets);
  }
}
