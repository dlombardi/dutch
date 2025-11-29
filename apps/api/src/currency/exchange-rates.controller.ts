import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get()
  async getRates(
    @Query('base') base?: string,
    @Query('target') target?: string,
  ) {
    const baseCurrency = base || 'USD';

    if (target) {
      return this.exchangeRatesService.getRate(baseCurrency, target);
    }

    return this.exchangeRatesService.getRates(baseCurrency);
  }
}
