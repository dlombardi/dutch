import { Module, forwardRef } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [forwardRef(() => GroupsModule)],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
