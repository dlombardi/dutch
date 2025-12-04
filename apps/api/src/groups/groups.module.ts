import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { SettlementsModule } from '../settlements/settlements.module';

@Module({
  imports: [ExpensesModule, SettlementsModule],
  controllers: [GroupsController],
  providers: [GroupsService, BalancesService],
  exports: [GroupsService],
})
export class GroupsModule {}
