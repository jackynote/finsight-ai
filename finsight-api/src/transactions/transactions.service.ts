import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { User } from '../auth/entities/user.entity';
import { CurrenciesService } from '../currencies/currencies.service';
import { TransactionCategoriesService } from '../transaction-categories/transaction-categories.service';

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
    const categoryCode =
      createTransactionDto.category_code ?? createTransactionDto.category;

    if (!categoryCode) {
      throw new NotFoundException('Transaction category is required');
    }

    const category = await this.transactionCategoriesService.findByCode(
      categoryCode,
    );

    // If no currency provided (e.g. from AI), use user's default currency
    if (!currencyId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.defaultCurrency) {
        try {
          const currency = await this.currenciesService.findByCode(
            user.defaultCurrency,
          );
          currencyId = currency.id;
        } catch (e) {
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
      relations: { currency: { rates: true }, category: true },
      order: { date: 'DESC', created_at: 'DESC' },
    });
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

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ) {
    const transaction = await this.findOne(id, userId);
    const { category_code, category, ...updateData } = updateTransactionDto;
    const updateCategoryCode = category_code ?? category;

    Object.assign(transaction, updateData);

    if (updateCategoryCode) {
      const category = await this.transactionCategoriesService.findByCode(
        updateCategoryCode,
      );
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
