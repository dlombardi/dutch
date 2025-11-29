import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CurrencyModule } from './currency/currency.module';

@Module({
  imports: [AuthModule, GroupsModule, ExpensesModule, CurrencyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
