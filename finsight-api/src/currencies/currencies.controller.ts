import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { UpdateRateDto } from './dto/update-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.currenciesService.findByCode(code);
  }

  @Patch(':code/rate')
  @UseGuards(JwtAuthGuard)
  updateRate(
    @Param('code') code: string,
    @Body() updateRateDto: UpdateRateDto,
  ) {
    return this.currenciesService.updateRate(code, updateRateDto);
  }
}
