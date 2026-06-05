import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { UpdateRateDto } from './dto/update-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll() {
    return this.currenciesService.findAll();
  }

  @Get('rates')
  findAllRates() {
    return this.currenciesService.findAllRates();
  }

  @Get(':code/rates')
  findRatesByCode(@Param('code') code: string) {
    return this.currenciesService.findRatesByCurrencyCode(code);
  }

  @Get('rates/:pair')
  findRateByPair(@Param('pair') pair: string) {
    return this.currenciesService.findRateByPair(pair);
  }

  @Patch('rates/:pair')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRateByPair(
    @Param('pair') pair: string,
    @Body() updateRateDto: UpdateRateDto,
  ) {
    return this.currenciesService.upsertRateByPair(pair, updateRateDto);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.currenciesService.findByCode(code);
  }

  @Patch(':code/rate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRate(
    @Param('code') code: string,
    @Body() updateRateDto: UpdateRateDto,
  ) {
    return this.currenciesService.updateRate(code, updateRateDto);
  }
}
