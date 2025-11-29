import { Controller, Post, Body } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './create-settlement.dto';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  createSettlement(@Body() createSettlementDto: CreateSettlementDto) {
    return this.settlementsService.createSettlement(
      createSettlementDto.groupId,
      createSettlementDto.fromUserId,
      createSettlementDto.toUserId,
      createSettlementDto.amount,
      createSettlementDto.createdById,
      createSettlementDto.currency,
      createSettlementDto.method,
    );
  }
}
