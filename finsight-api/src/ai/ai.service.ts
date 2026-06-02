import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight } from './entities/ai-insight.entity';

export interface AIInsightItem {
  title: string;
  content: string;
  type: string;
}

export interface AIInsightResponse {
  insights: AIInsightItem[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private apiKey?: string;
  private modelId: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AIInsight)
    private readonly aiInsightRepository: Repository<AIInsight>,
  ) {}

  onModuleInit() {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelId =
      this.configService.get<string>('GEMINI_MODEL_ID') || 'gemini-1.5-flash';
    this.baseUrl =
      this.configService.get<string>('GEMINI_BASE_URL') ||
      'https://generativelanguage.googleapis.com';

    this.logger.log(
      `AI Service initializing with model: ${this.modelId}, API Key length: ${this.apiKey?.length || 0}`,
    );
    if (this.configService.get<string>('GEMINI_BASE_URL')) {
      this.logger.log(`Using custom base URL: ${this.baseUrl}`);
    }

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not defined in environment variables',
      );
    }
  }

  async generateContent(payload: any): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;

    this.logger.log(`Calling Gemini API: ${url}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as GeminiResponse;
    return result;
  }

  async findAllByUserId(userId: string) {
    return this.aiInsightRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async processMessage(
    message: string,
    context: {
      transactions: any[];
      assets: any[];
      conversationHistory?: Array<{ role: string; content: string }>;
    },
  ) {
    if (!this.apiKey) {
      return {
        content: 'AI Service is not configured properly.',
        action: { type: 'NONE' },
      };
    }

    // Format conversation history for the prompt
    const conversationContext = context.conversationHistory
      ?.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')
      || 'No recent conversation history.';

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
      
      Recent Conversation (last 15 minutes):
      ${conversationContext}

      Respond ONLY in JSON format:
      {
        "content": "Your friendly message",
        "action": { "type": "ACTION_TYPE", "data": { ... } }
      }
    `;

    try {
      const result = await this.generateContent({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }],
        },
      });

      const responseText = result.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Gemini Error:', error);
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
    if (!this.apiKey) {
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
      const result = await this.generateContent({
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

      const responseText = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(responseText) as AIInsightResponse;

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
      this.logger.error('Gemini Insights Error:', error);
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
