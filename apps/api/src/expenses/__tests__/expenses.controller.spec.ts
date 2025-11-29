import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { ExpensesModule } from '../expenses.module';
import { GroupsModule } from '../../groups/groups.module';

interface Group {
  id: string;
  name: string;
  emoji: string;
  createdById: string;
  inviteCode: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  paidById: string;
  splitType: string;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateExpenseResponse {
  expense: Expense;
}

interface CreateGroupResponse {
  group: Group;
}

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

describe('ExpensesController (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testGroup: Group;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ExpensesModule, GroupsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    httpServer = app.getHttpServer() as Server;

    // Create a test group for expense tests
    const groupResponse = await request(httpServer)
      .post('/groups')
      .send({
        name: 'Test Expense Group',
        emoji: '💰',
        createdById: 'user-123',
        defaultCurrency: 'USD',
      })
      .expect(201);

    testGroup = (groupResponse.body as CreateGroupResponse).group;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /expenses', () => {
    it('should create a basic expense with amount and description', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Lunch at restaurant',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body).toHaveProperty('expense');
      expect(body.expense).toMatchObject({
        groupId: testGroup.id,
        amount: 50,
        description: 'Lunch at restaurant',
        paidById: 'user-123',
        createdById: 'user-123',
      });
      expect(body.expense).toHaveProperty('id');
      expect(body.expense).toHaveProperty('currency');
      expect(body.expense).toHaveProperty('date');
      expect(body.expense.splitType).toBe('equal'); // default
    });

    it('should create expense with custom currency', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.50,
          currency: 'EUR',
          description: 'Coffee',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.currency).toBe('EUR');
      expect(body.expense.amount).toBe(100.5);
    });

    it('should create expense with custom date', async () => {
      const customDate = '2025-11-25';
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 25.00,
          description: 'Taxi',
          paidById: 'user-123',
          createdById: 'user-123',
          date: customDate,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.date).toBe(customDate);
    });

    it('should default currency to group default currency', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 30.00,
          description: 'Snacks',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.currency).toBe('USD'); // group default
    });

    it('should reject missing groupId', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          amount: 50.00,
          description: 'Test expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject missing amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          description: 'Test expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject missing description', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject missing paidById', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Test expense',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject invalid groupId', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: 'non-existent-group',
          amount: 50.00,
          description: 'Test expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(404);
    });

    it('should reject negative amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: -50.00,
          description: 'Test expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject zero amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 0,
          description: 'Test expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should trim whitespace from description', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: '  Dinner  ',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.description).toBe('Dinner');
    });
  });

  describe('GET /expenses/:id', () => {
    it('should retrieve an expense by ID', async () => {
      // Create an expense first
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.00,
          description: 'Groceries',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      // Retrieve it
      const response = await request(httpServer)
        .get(`/expenses/${createdExpense.id}`)
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.id).toBe(createdExpense.id);
      expect(body.expense.description).toBe('Groceries');
      expect(body.expense.amount).toBe(75);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(httpServer)
        .get('/expenses/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /groups/:groupId/expenses', () => {
    it('should return list of expenses for a group', async () => {
      // Create multiple expenses
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Expense 1',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.00,
          description: 'Expense 2',
          paidById: 'user-456',
          createdById: 'user-456',
        })
        .expect(201);

      // Get expenses for the group
      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);

      const body = response.body as { expenses: Expense[] };
      expect(body.expenses).toHaveLength(2);
    });

    it('should return empty array for group with no expenses', async () => {
      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);

      const body = response.body as { expenses: Expense[] };
      expect(body.expenses).toHaveLength(0);
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get('/groups/non-existent-group/expenses')
        .expect(404);
    });
  });

  describe('PUT /expenses/:id', () => {
    it('should update expense amount', async () => {
      // Create an expense first
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Original expense',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      // Update the amount
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 75.00 })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.amount).toBe(75);
      expect(body.expense.description).toBe('Original expense');
    });

    it('should update expense description', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Original',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ description: 'Updated description' })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.description).toBe('Updated description');
      expect(body.expense.amount).toBe(50);
    });

    it('should update expense paidById', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Test',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ paidById: 'user-456' })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.paidById).toBe('user-456');
    });

    it('should update multiple fields at once', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Original',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({
          amount: 100.00,
          description: 'Updated',
          paidById: 'user-456',
        })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.amount).toBe(100);
      expect(body.expense.description).toBe('Updated');
      expect(body.expense.paidById).toBe('user-456');
    });

    it('should update updatedAt timestamp', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Test',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;
      const originalUpdatedAt = createdExpense.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 75.00 })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(httpServer)
        .put('/expenses/non-existent-id')
        .send({ amount: 75.00 })
        .expect(404);
    });

    it('should reject negative amount', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Test',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: -50.00 })
        .expect(400);
    });

    it('should reject zero amount', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Test',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 0 })
        .expect(400);
    });

    it('should trim whitespace from description', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Original',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ description: '  Updated  ' })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.description).toBe('Updated');
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should delete an expense', async () => {
      // Create an expense first
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'To be deleted',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      // Delete the expense
      await request(httpServer)
        .delete(`/expenses/${createdExpense.id}`)
        .expect(200);

      // Verify it's gone
      await request(httpServer)
        .get(`/expenses/${createdExpense.id}`)
        .expect(404);
    });

    it('should return success message on delete', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'To be deleted',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse).expense;

      const response = await request(httpServer)
        .delete(`/expenses/${createdExpense.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Expense deleted successfully');
    });

    it('should return 404 for non-existent expense', async () => {
      await request(httpServer)
        .delete('/expenses/non-existent-id')
        .expect(404);
    });

    it('should remove expense from group expenses list', async () => {
      // Create two expenses
      const createResponse1 = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.00,
          description: 'Expense 1',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.00,
          description: 'Expense 2',
          paidById: 'user-123',
          createdById: 'user-123',
        })
        .expect(201);

      const expenseToDelete = (createResponse1.body as CreateExpenseResponse).expense;

      // Verify we have 2 expenses
      let groupExpenses = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);
      expect((groupExpenses.body as { expenses: Expense[] }).expenses).toHaveLength(2);

      // Delete one expense
      await request(httpServer)
        .delete(`/expenses/${expenseToDelete.id}`)
        .expect(200);

      // Verify we now have 1 expense
      groupExpenses = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);
      expect((groupExpenses.body as { expenses: Expense[] }).expenses).toHaveLength(1);
      expect((groupExpenses.body as { expenses: Expense[] }).expenses[0].description).toBe('Expense 2');
    });
  });
});
