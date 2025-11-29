import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto';

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.expensesService.createExpense(
      dto.groupId,
      dto.amount,
      dto.description,
      dto.paidById,
      dto.createdById,
      dto.currency,
      dto.date,
    );
  }

  @Get('expenses/:id')
  getExpense(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Get('groups/:groupId/expenses')
  getGroupExpenses(@Param('groupId') groupId: string) {
    return this.expensesService.getExpensesByGroupId(groupId);
  }
}
