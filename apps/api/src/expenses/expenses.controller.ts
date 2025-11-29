import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

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
      dto.splitParticipants,
      dto.splitType,
      dto.splitAmounts,
      dto.exchangeRate,
      dto.category,
    );
  }

  @Get('expenses/:id')
  getExpense(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Put('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }

  @Get('groups/:groupId/expenses')
  getGroupExpenses(@Param('groupId') groupId: string) {
    return this.expensesService.getExpensesByGroupId(groupId);
  }
}
