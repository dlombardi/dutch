import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('expenses')
  async createExpense(@Body() dto: CreateExpenseDto) {
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
  async getExpense(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Put('expenses/:id')
  async updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }

  @Get('groups/:groupId/expenses')
  async getGroupExpenses(@Param('groupId') groupId: string) {
    return this.expensesService.getExpensesByGroupId(groupId);
  }
}
