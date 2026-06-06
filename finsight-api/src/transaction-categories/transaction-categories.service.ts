import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionCategoryEntity } from './entities/transaction-category.entity';

const DEFAULT_TRANSACTION_CATEGORIES = [
  { code: 'FOOD_DRINK', value: 'Food & Drink' },
  { code: 'SHOPPING', value: 'Shopping' },
  { code: 'HOUSING', value: 'Housing' },
  { code: 'TRANSPORTATION', value: 'Transportation' },
  { code: 'ENTERTAINMENT', value: 'Entertainment' },
  { code: 'HEALTH', value: 'Health' },
  { code: 'INVESTMENT', value: 'Investment' },
  { code: 'INCOME', value: 'Income' },
  { code: 'OTHERS', value: 'Others' },
];

@Injectable()
export class TransactionCategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(TransactionCategoryEntity)
    private readonly transactionCategoryRepository: Repository<TransactionCategoryEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories() {
    for (const category of DEFAULT_TRANSACTION_CATEGORIES) {
      await this.transactionCategoryRepository.upsert(category, ['code']);
    }
  }

  async findAll() {
    return this.transactionCategoryRepository.find({
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: string) {
    const normalizedCode = code.toUpperCase();
    const category = await this.transactionCategoryRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!category) {
      throw new NotFoundException(`Transaction category with code ${normalizedCode} not found`);
    }

    return category;
  }
}
