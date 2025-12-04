import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../../app.module';

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
  exchangeRate: number;
  amountInGroupCurrency: number;
  description: string;
  category?: string;
  paidById: string;
  splitType: string;
  splitParticipants: string[];
  splitAmounts: Record<string, number>;
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

// Valid UUID format that doesn't exist in the database
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('ExpensesController (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testGroup: Group;
  let testUserId: string;
  let testUser2Id: string;
  let testUser3Id: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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

    // Create test users to get valid UUIDs (unique device IDs per test run)
    const uniquePrefix = `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user1Response = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: `${uniquePrefix}-user-1`, name: 'Test User 1' });
    testUserId = user1Response.body.user.id;

    const user2Response = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: `${uniquePrefix}-user-2`, name: 'Test User 2' });
    testUser2Id = user2Response.body.user.id;

    const user3Response = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: `${uniquePrefix}-user-3`, name: 'Test User 3' });
    testUser3Id = user3Response.body.user.id;

    // Create a test group for expense tests
    const groupResponse = await request(httpServer)
      .post('/groups')
      .send({
        name: 'Test Expense Group',
        emoji: '💰',
        createdById: testUserId,
        defaultCurrency: 'USD',
      })
      .expect(201);

    testGroup = (groupResponse.body as CreateGroupResponse).group;

    // Add other users to the group
    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: testUser2Id });
    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: testUser3Id });
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
          amount: 50.0,
          description: 'Lunch at restaurant',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body).toHaveProperty('expense');
      expect(body.expense).toMatchObject({
        groupId: testGroup.id,
        amount: 50,
        description: 'Lunch at restaurant',
        paidById: testUserId,
        createdById: testUserId,
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
          amount: 100.5,
          currency: 'EUR',
          exchangeRate: 1.1, // Required for foreign currency
          description: 'Coffee',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.currency).toBe('EUR');
      expect(body.expense.amount).toBe(100.5);
      expect(body.expense.exchangeRate).toBe(1.1);
    });

    it('should create expense with custom date', async () => {
      const customDate = '2025-11-25';
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 25.0,
          description: 'Taxi',
          paidById: testUserId,
          createdById: testUserId,
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
          amount: 30.0,
          description: 'Snacks',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.currency).toBe('USD'); // group default
    });

    it('should reject missing groupId', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          amount: 50.0,
          description: 'Test expense',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should reject missing amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          description: 'Test expense',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should reject missing description', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should reject missing paidById', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Test expense',
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should reject invalid groupId', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: NON_EXISTENT_UUID,
          amount: 50.0,
          description: 'Test expense',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(404);
    });

    it('should reject negative amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: -50.0,
          description: 'Test expense',
          paidById: testUserId,
          createdById: testUserId,
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
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should trim whitespace from description', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: '  Dinner  ',
          paidById: testUserId,
          createdById: testUserId,
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
          amount: 75.0,
          description: 'Groceries',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

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
      await request(httpServer).get(`/expenses/${NON_EXISTENT_UUID}`).expect(404);
    });
  });

  describe('GET /groups/:groupId/expenses', () => {
    it('should return list of expenses for a group', async () => {
      // Create multiple expenses
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Expense 1',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.0,
          description: 'Expense 2',
          paidById: testUserId,
          createdById: testUserId,
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
        .get(`/groups/${NON_EXISTENT_UUID}/expenses`)
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
          amount: 50.0,
          description: 'Original expense',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update the amount
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 75.0 })
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
          amount: 50.0,
          description: 'Original',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

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
          amount: 50.0,
          description: 'Test',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ paidById: testUserId })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.paidById).toBe(testUserId);
    });

    it('should update multiple fields at once', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Original',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({
          amount: 100.0,
          description: 'Updated',
          paidById: testUserId,
        })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.amount).toBe(100);
      expect(body.expense.description).toBe('Updated');
      expect(body.expense.paidById).toBe(testUserId);
    });

    it('should update updatedAt timestamp', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Test',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;
      const originalUpdatedAt = createdExpense.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 75.0 })
        .expect(200);

      const body = response.body as { expense: Expense };
      expect(body.expense.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(httpServer)
        .put(`/expenses/${NON_EXISTENT_UUID}`)
        .send({ amount: 75.0 })
        .expect(404);
    });

    it('should reject negative amount', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Test',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: -50.0 })
        .expect(400);
    });

    it('should reject zero amount', async () => {
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Test',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

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
          amount: 50.0,
          description: 'Original',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

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
          amount: 50.0,
          description: 'To be deleted',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

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
          amount: 50.0,
          description: 'To be deleted',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      const response = await request(httpServer)
        .delete(`/expenses/${createdExpense.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Expense deleted successfully');
    });

    it('should return 404 for non-existent expense', async () => {
      await request(httpServer).delete(`/expenses/${NON_EXISTENT_UUID}`).expect(404);
    });

    it('should remove expense from group expenses list', async () => {
      // Create two expenses
      const createResponse1 = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Expense 1',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.0,
          description: 'Expense 2',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const expenseToDelete = (createResponse1.body as CreateExpenseResponse)
        .expense;

      // Verify we have 2 expenses
      let groupExpenses = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);
      expect(
        (groupExpenses.body as { expenses: Expense[] }).expenses,
      ).toHaveLength(2);

      // Delete one expense
      await request(httpServer)
        .delete(`/expenses/${expenseToDelete.id}`)
        .expect(200);

      // Verify we now have 1 expense
      groupExpenses = await request(httpServer)
        .get(`/groups/${testGroup.id}/expenses`)
        .expect(200);
      expect(
        (groupExpenses.body as { expenses: Expense[] }).expenses,
      ).toHaveLength(1);
      expect(
        (groupExpenses.body as { expenses: Expense[] }).expenses[0].description,
      ).toBe('Expense 2');
    });
  });

  describe('Equal Splits', () => {
    it('should create expense with splitParticipants', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Dinner for three',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id, testUser3Id],
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.splitType).toBe('equal');
      expect(body.expense).toHaveProperty('splitParticipants');
      expect(
        (body.expense as Expense & { splitParticipants: string[] })
          .splitParticipants,
      ).toEqual(expect.arrayContaining([testUserId, testUser2Id, testUser3Id]));
    });

    it('should calculate equal split amounts per person', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 90.0,
          description: 'Split three ways',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id, testUser3Id],
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & {
        splitParticipants: string[];
        splitAmounts: Record<string, number>;
      };
      expect(expense.splitAmounts).toBeDefined();
      expect(expense.splitAmounts[testUserId]).toBe(30);
      expect(expense.splitAmounts[testUser2Id]).toBe(30);
      expect(expense.splitAmounts[testUser3Id]).toBe(30);
    });

    it('should handle rounding in split amounts (total preserved)', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Split three ways with rounding',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id, testUser3Id],
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & {
        splitParticipants: string[];
        splitAmounts: Record<string, number>;
      };
      expect(expense.splitAmounts).toBeDefined();
      // Sum should equal total amount
      const sum = Object.values(expense.splitAmounts).reduce(
        (a, b) => a + b,
        0,
      );
      expect(sum).toBeCloseTo(100.0, 2);
    });

    it('should default splitParticipants to payer if not provided', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Solo expense',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & { splitParticipants: string[] };
      expect(expense.splitParticipants).toEqual([testUserId]);
    });

    it('should reject empty splitParticipants array', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'No participants',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [],
        })
        .expect(400);
    });

    it('should update split participants via PUT', async () => {
      // Create expense with 3 participants
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 90.0,
          description: 'Original split',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id, testUser3Id],
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update to only 2 participants
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ splitParticipants: [testUserId, testUser2Id] })
        .expect(200);

      const body = response.body as {
        expense: Expense & {
          splitParticipants: string[];
          splitAmounts: Record<string, number>;
        };
      };
      expect(body.expense.splitParticipants).toEqual(expect.arrayContaining([testUserId, testUser2Id]));
      expect(body.expense.splitAmounts[testUserId]).toBe(45);
      expect(body.expense.splitAmounts[testUser2Id]).toBe(45);
    });

    it('should recalculate splits when amount is updated', async () => {
      // Create expense
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 60.0,
          description: 'Will be updated',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id],
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update amount
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ amount: 100.0 })
        .expect(200);

      const body = response.body as {
        expense: Expense & { splitAmounts: Record<string, number> };
      };
      expect(body.expense.splitAmounts[testUserId]).toBe(50);
      expect(body.expense.splitAmounts[testUser2Id]).toBe(50);
    });
  });

  describe('Exact Amounts Split', () => {
    it('should create expense with exact split amounts', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Dinner with exact split',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 60.0,
            [testUser2Id]: 40.0,
          },
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & {
        splitAmounts: Record<string, number>;
      };
      expect(expense.splitType).toBe('exact');
      expect(expense.splitAmounts[testUserId]).toBe(60);
      expect(expense.splitAmounts[testUser2Id]).toBe(40);
    });

    it('should set splitParticipants from splitAmounts keys', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 90.0,
          description: 'Three-way exact split',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 30.0,
            [testUser2Id]: 35.0,
            [testUser3Id]: 25.0,
          },
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & { splitParticipants: string[] };
      expect(expense.splitParticipants).toEqual(
        expect.arrayContaining([testUserId, testUser2Id, testUser3Id]),
      );
      expect(expense.splitParticipants).toHaveLength(3);
    });

    it('should reject exact split when amounts do not sum to total', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Invalid exact split',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 50.0,
            [testUser2Id]: 30.0, // Sum is 80, not 100
          },
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('must sum to total');
    });

    it('should reject exact split with negative individual amount', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Negative individual',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 120.0,
            [testUser2Id]: -20.0,
          },
        })
        .expect(400);
    });

    it('should reject exact split with empty splitAmounts', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Empty exact split',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {},
        })
        .expect(400);
    });

    it('should allow exact split with small rounding difference (within 0.01)', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Exact split with rounding',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 33.33,
            [testUser2Id]: 33.33,
            [testUser3Id]: 33.34,
          },
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      const expense = body.expense as Expense & {
        splitAmounts: Record<string, number>;
      };
      const sum = Object.values(expense.splitAmounts).reduce(
        (a, b) => a + b,
        0,
      );
      expect(sum).toBeCloseTo(100.0, 2);
    });

    it('should update expense to exact split from equal split', async () => {
      // Create with equal split
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Initially equal',
          paidById: testUserId,
          createdById: testUserId,
          splitParticipants: [testUserId, testUser2Id],
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update to exact split
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 70.0,
            [testUser2Id]: 30.0,
          },
        })
        .expect(200);

      const body = response.body as {
        expense: Expense & { splitAmounts: Record<string, number> };
      };
      expect(body.expense.splitType).toBe('exact');
      expect(body.expense.splitAmounts[testUserId]).toBe(70);
      expect(body.expense.splitAmounts[testUser2Id]).toBe(30);
    });

    it('should update expense from exact split back to equal split', async () => {
      // Create with exact split
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Initially exact',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 70.0,
            [testUser2Id]: 30.0,
          },
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update back to equal split
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({
          splitType: 'equal',
          splitParticipants: [testUserId, testUser2Id],
        })
        .expect(200);

      const body = response.body as {
        expense: Expense & { splitAmounts: Record<string, number> };
      };
      expect(body.expense.splitType).toBe('equal');
      expect(body.expense.splitAmounts[testUserId]).toBe(50);
      expect(body.expense.splitAmounts[testUser2Id]).toBe(50);
    });

    it('should reject updating exact split amounts that do not match expense total', async () => {
      // Create with exact split
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Initially exact',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 60.0,
            [testUser2Id]: 40.0,
          },
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Try to update with wrong total
      await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 50.0,
            [testUser2Id]: 30.0, // Sum is 80, not 100
          },
        })
        .expect(400);
    });

    it('should require splitAmounts when splitType is exact', async () => {
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Missing splitAmounts',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          // Missing splitAmounts
        })
        .expect(400);
    });

    it('should preserve exact split amounts when other fields are updated', async () => {
      // Create with exact split
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Original description',
          paidById: testUserId,
          createdById: testUserId,
          splitType: 'exact',
          splitAmounts: {
            [testUserId]: 70.0,
            [testUser2Id]: 30.0,
          },
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update only description
      const response = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ description: 'Updated description' })
        .expect(200);

      const body = response.body as {
        expense: Expense & { splitAmounts: Record<string, number> };
      };
      expect(body.expense.description).toBe('Updated description');
      expect(body.expense.splitType).toBe('exact');
      expect(body.expense.splitAmounts[testUserId]).toBe(70);
      expect(body.expense.splitAmounts[testUser2Id]).toBe(30);
    });
  });

  describe('POST /expenses - category', () => {
    it('should create an expense with a category', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 75.0,
          description: 'Uber to airport',
          paidById: testUserId,
          createdById: testUserId,
          category: 'transport',
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      expect(body.expense.category).toBe('transport');
    });

    it('should create an expense without a category (optional)', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 25.0,
          description: 'Coffee',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateExpenseResponse;
      // PostgreSQL returns null for missing optional fields
      expect(body.expense.category).toBeNull();
    });

    it('should validate category is a valid option', async () => {
      const response = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 50.0,
          description: 'Dinner',
          paidById: testUserId,
          createdById: testUserId,
          category: 'invalid_category',
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(
        messages.some((m) =>
          m.includes('category must be one of the following values'),
        ),
      ).toBe(true);
    });

    it('should accept all valid category options', async () => {
      // These must match EXPENSE_CATEGORIES in create-expense.dto.ts
      const validCategories = [
        'food',
        'transport',
        'accommodation',
        'activity',
        'shopping',
        'other',
      ];

      for (const category of validCategories) {
        const response = await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 10.0,
            description: `Test ${category}`,
            paidById: testUserId,
            createdById: testUserId,
            category,
          })
          .expect(201);

        const body = response.body as CreateExpenseResponse;
        expect(body.expense.category).toBe(category);
      }
    });
  });

  describe('PUT /expenses/:id - category', () => {
    it('should update expense category', async () => {
      // Create expense without category
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100.0,
          description: 'Groceries',
          paidById: testUserId,
          createdById: testUserId,
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Update with category
      const updateResponse = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ category: 'food' })
        .expect(200);

      const body = updateResponse.body as { expense: Expense };
      expect(body.expense.category).toBe('food');
    });

    it('should change expense category', async () => {
      // Create expense with category
      const createResponse = await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 200.0,
          description: 'Hotel',
          paidById: testUserId,
          createdById: testUserId,
          category: 'accommodation',
        })
        .expect(201);

      const createdExpense = (createResponse.body as CreateExpenseResponse)
        .expense;

      // Change category
      const updateResponse = await request(httpServer)
        .put(`/expenses/${createdExpense.id}`)
        .send({ category: 'activity' })
        .expect(200);

      const body = updateResponse.body as { expense: Expense };
      expect(body.expense.category).toBe('activity');
    });
  });
});
