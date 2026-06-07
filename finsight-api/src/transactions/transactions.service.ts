import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { User } from '../auth/entities/user.entity';
import { CurrenciesService } from '../currencies/currencies.service';
import { TransactionCategoriesService } from '../transaction-categories/transaction-categories.service';

interface AssistantTransactionQuery {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  category_code?: string;
  limit?: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly currenciesService: CurrenciesService,
    private readonly transactionCategoriesService: TransactionCategoriesService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    let currencyId = createTransactionDto.currency_id;
    const categoryCode = createTransactionDto.category_code ?? createTransactionDto.category;

    if (!categoryCode) {
      throw new NotFoundException('Transaction category is required');
    }

    const category = await this.transactionCategoriesService.findByCode(categoryCode);

    // If no currency provided (e.g. from AI), use user's default currency
    if (!currencyId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.defaultCurrency) {
        try {
          const currency = await this.currenciesService.findByCode(user.defaultCurrency);
          currencyId = currency.id;
        } catch {
          // Fallback to USD or leave null
        }
      }
    }

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      category_code: category.code,
      category,
      currency_id: currencyId,
      user_id: userId,
      date: createTransactionDto.date || new Date().toISOString().split('T')[0],
    });
    return this.transactionRepository.save(transaction);
  }

  async findAll(userId: string) {
    return this.transactionRepository.find({
      where: { user_id: userId },
      relations: { currency: true, category: true },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findForAssistant(userId: string, query: AssistantTransactionQuery = {}) {
    const take = Number.isFinite(query.limit) ? Math.min(Math.max(Math.floor(query.limit ?? 10), 1), 50) : 10;
    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.currency', 'currency')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.user_id = :userId', { userId });

    if (query.startDate) {
      qb.andWhere('transaction.date >= :startDate', { startDate: query.startDate.slice(0, 10) });
    }

    if (query.endDate) {
      qb.andWhere('transaction.date <= :endDate', { endDate: query.endDate.slice(0, 10) });
    }

    if (query.type) {
      qb.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.category_code) {
      qb.andWhere('transaction.category_code = :categoryCode', { categoryCode: query.category_code });
    }

    const [transactions, total] = await qb.orderBy('transaction.date', 'DESC').addOrderBy('transaction.created_at', 'DESC').take(take).getManyAndCount();

    const summary = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount) || 0;
        const transactionDate = transaction.date instanceof Date ? transaction.date.toISOString().slice(0, 10) : String(transaction.date).slice(0, 10);
        acc.count += 1;
        if (transaction.type === 'income') {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }

        if (!acc.dateRange.start || transactionDate < acc.dateRange.start) {
          acc.dateRange.start = transactionDate;
        }
        if (!acc.dateRange.end || transactionDate > acc.dateRange.end) {
          acc.dateRange.end = transactionDate;
        }

        return acc;
      },
      {
        count: 0,
        income: 0,
        expense: 0,
        net: 0,
        dateRange: { start: '', end: '' },
      },
    );

    summary.net = summary.income - summary.expense;

    return {
      transactions,
      total,
      summary,
      appliedFilters: {
        startDate: query.startDate?.slice(0, 10),
        endDate: query.endDate?.slice(0, 10),
        type: query.type,
        category_code: query.category_code,
        limit: take,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: { currency: true, category: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.user_id !== userId) {
      throw new ForbiddenException('You do not own this transaction');
    }

    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto, userId: string) {
    const transaction = await this.findOne(id, userId);
    const { category_code, category, ...updateData } = updateTransactionDto;
    const updateCategoryCode = category_code ?? category;

    Object.assign(transaction, updateData);

    if (updateCategoryCode) {
      const category = await this.transactionCategoriesService.findByCode(updateCategoryCode);
      transaction.category_code = category.code;
      transaction.category = category;
    }

    return this.transactionRepository.save(transaction);
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);
    return this.transactionRepository.remove(transaction);
  }
}
