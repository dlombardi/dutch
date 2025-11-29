import { Module, forwardRef } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [forwardRef(() => ExpensesModule)],
  controllers: [GroupsController],
  providers: [GroupsService, BalancesService],
  exports: [GroupsService],
})
export class GroupsModule {}
