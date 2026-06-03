import { Controller, Get } from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service';

@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(
    private readonly transactionCategoriesService: TransactionCategoriesService,
  ) {}

  @Get()
  findAll() {
    return this.transactionCategoriesService.findAll();
  }
}
