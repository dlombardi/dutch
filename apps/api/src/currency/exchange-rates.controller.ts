import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { Public } from '../auth/public.decorator';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Public()
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
