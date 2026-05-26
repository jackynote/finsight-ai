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

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    let currencyId = createTransactionDto.currency_id;

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
      currency_id: currencyId,
      user_id: userId,
      date: createTransactionDto.date || new Date().toISOString().split('T')[0],
    });
    return this.transactionRepository.save(transaction);
  }

  async findAll(userId: string) {
    return this.transactionRepository.find({
      where: { user_id: userId },
      relations: { currency: { rates: true } },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: { currency: true },
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
    Object.assign(transaction, updateTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);
    return this.transactionRepository.remove(transaction);
  }
}
