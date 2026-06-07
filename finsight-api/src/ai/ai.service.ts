import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { TransactionCategoriesService } from '../transaction-categories/transaction-categories.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Asset } from '../assets/entities/asset.entity';

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

interface GeminiContent {
  role: 'user' | 'model';
  parts: {
    text: string;
  }[];
}

interface AIActionResponse {
  type: 'ADD_TRANSACTION' | 'SHOW_INSIGHTS' | 'SHOW_TRANSACTIONS' | 'NONE';
  data?: Record<string, unknown>;
}

interface AIMessageResponse {
  content: string;
  action: AIActionResponse;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TransactionSummaryItem {
  date: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

interface TransactionContextSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  availableDateRange: {
    start: string;
    end: string;
  } | null;
  recentTransactions: {
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category_code: string;
    description: string | null;
  }[];
  dailyTotals: TransactionSummaryItem[];
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
    private readonly transactionCategoriesService: TransactionCategoriesService,
  ) {}

  onModuleInit() {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelId = this.configService.get<string>('GEMINI_MODEL_ID') || 'gemini-2.5-flash';
    this.baseUrl = this.configService.get<string>('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com';

    this.logger.log(`AI Service initializing with model: ${this.modelId}, API Key length: ${this.apiKey?.length || 0}`);
    if (this.configService.get<string>('GEMINI_BASE_URL')) {
      this.logger.log(`Using custom base URL: ${this.baseUrl}`);
    }

    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in environment variables');
    }
  }

  async generateContent(payload: Record<string, unknown>): Promise<GeminiResponse> {
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
      throw new Error(`Gemini API failed: ${response.status} ${response.statusText} - ${errorText}`);
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
      transactions: Transaction[];
      assets: Asset[];
      conversationHistory?: ConversationMessage[];
    },
  ): Promise<AIMessageResponse> {
    if (!this.apiKey) {
      return {
        content: 'AI Service is not configured properly.',
        action: { type: 'NONE' },
      };
    }

    const categories = await this.transactionCategoriesService.findAll();
    const categoryList = categories.map((category) => `${category.code} (${category.value})`).join(', ');
    const transactionContext = this.buildTransactionContext(context.transactions);
    const contents = this.buildGeminiContents(message, transactionContext, context.assets, context.conversationHistory);

    const systemInstruction = `
      You are FinSight AI, a professional financial assistant.
      Current Date: ${new Date().toISOString().split('T')[0]}
      
      Actions you can trigger:
      1. ADD_TRANSACTION: { "amount": number, "description": string, "type": "income" | "expense", "category_code": string }
      2. SHOW_INSIGHTS: {}
      3. SHOW_TRANSACTIONS: { "startDate"?: string, "endDate"?: string, "type"?: "income" | "expense", "category_code"?: string, "limit"?: number }
      4. NONE: {}

      Categories: ${categoryList}.
      IMPORTANT: use the category_code field exactly as one of the codes above.
      IMPORTANT: relative dates like "yesterday" and "last week" should be interpreted using Current Date above.

      Rules for transaction questions:
      - Use Transaction Summary for totals by day, date range, income, expense, and net queries.
      - Use recentTransactions for conversational follow-up and examples.
      - Use SHOW_TRANSACTIONS when the user asks to list, show, or inspect individual transactions.
      - If the requested date is outside the availableDateRange, say you cannot verify it from the available transaction data and ask for a date within the available range.
      - If the requested date is inside the availableDateRange but there is no matching dailyTotals entry, treat that day as zero transactions and zero expense.

      Respond ONLY in JSON format:
      {
        "content": "Your friendly message",
        "action": { "type": "ACTION_TYPE", "data": { ... } }
      }
    `;

    try {
      const result = await this.generateContent({
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }],
        },
      });

      const responseText = result.candidates[0].content.parts[0].text;
      return JSON.parse(responseText) as AIMessageResponse;
    } catch (error) {
      this.logger.error('Gemini Error:', error);
      return {
        content: "I'm having trouble connecting to my brain. Please try again later.",
        action: { type: 'NONE' },
      };
    }
  }

  private buildGeminiContents(message: string, transactionContext: TransactionContextSummary, assets: Asset[], conversationHistory?: ConversationMessage[]): GeminiContent[] {
    const contents: GeminiContent[] = [
      {
        role: 'user',
        parts: [
          {
            text: ['Financial context:', `Transaction Summary: ${JSON.stringify(transactionContext)}`, `Current Assets: ${JSON.stringify(assets)}`].join('\n'),
          },
        ],
      },
    ];

    if (conversationHistory?.length) {
      contents.push(
        ...conversationHistory.map<GeminiContent>((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      );
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    return contents;
  }

  private buildTransactionContext(transactions: Transaction[]): TransactionContextSummary {
    const normalizedTransactions = transactions
      .map((transaction) => {
        const date = this.normalizeDate(transaction.date);
        const amount = Number(transaction.amount) || 0;

        return {
          date,
          amount,
          type: transaction.type,
          category_code: transaction.category_code,
          description: transaction.description ?? null,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const totals = normalizedTransactions.reduce(
      (acc, transaction) => {
        acc.transactionCount += 1;
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
        }

        return acc;
      },
      {
        totalIncome: 0,
        totalExpense: 0,
        transactionCount: 0,
      },
    );

    const dailyTotalsMap = new Map<string, TransactionSummaryItem>();
    for (const transaction of normalizedTransactions) {
      const current = dailyTotalsMap.get(transaction.date) ?? {
        date: transaction.date,
        income: 0,
        expense: 0,
        net: 0,
        transactionCount: 0,
      };

      if (transaction.type === 'income') {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      current.net = current.income - current.expense;
      current.transactionCount += 1;
      dailyTotalsMap.set(transaction.date, current);
    }

    const dailyTotals = Array.from(dailyTotalsMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    const availableDateRange =
      normalizedTransactions.length > 0
        ? {
            start: normalizedTransactions[normalizedTransactions.length - 1].date,
            end: normalizedTransactions[0].date,
          }
        : null;

    return {
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      net: totals.totalIncome - totals.totalExpense,
      transactionCount: totals.transactionCount,
      availableDateRange,
      recentTransactions: normalizedTransactions.slice(0, 5),
      dailyTotals,
    };
  }

  private normalizeDate(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(value);
  }

  async generateAndSaveInsights(userId: string, transactions: Transaction[], assets: Asset[]): Promise<{ insights: (AIInsight | AIInsightItem)[] }> {
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
            parts: [{ text: 'Generate 3 financial insights based on my data.' }],
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
        return await this.aiInsightRepository.manager.transaction(async (manager) => {
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
        });
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
  async generateInsights(transactions: Transaction[], assets: Asset[]) {
    // This would be without persistence, kept for safety or temporary use
    return this.generateAndSaveInsights('unknown', transactions, assets);
  }
}
