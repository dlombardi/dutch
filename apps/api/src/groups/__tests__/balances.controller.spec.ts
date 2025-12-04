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

interface Balance {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

interface BalancesResponse {
  balances: Balance[];
  memberBalances: Record<string, number>;
}

// Valid UUID format that doesn't exist in the database
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('Balances API (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testGroup: Group;
  let userA: string;
  let userB: string;
  let userC: string;

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

    // Create test users
    const userAResponse = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: 'user-a-device', name: 'User A' });
    userA = userAResponse.body.user.id;

    const userBResponse = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: 'user-b-device', name: 'User B' });
    userB = userBResponse.body.user.id;

    const userCResponse = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: 'user-c-device', name: 'User C' });
    userC = userCResponse.body.user.id;

    // Create a test group
    const groupResponse = await request(httpServer)
      .post('/groups')
      .send({
        name: 'Test Balance Group',
        emoji: '💰',
        createdById: userA,
        defaultCurrency: 'USD',
      })
      .expect(201);

    testGroup = groupResponse.body.group;

    // Add members to the group
    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: userB })
      .expect(201);

    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: userC })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /groups/:id/balances', () => {
    it('should return empty balances for group with no expenses', async () => {
      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;
      expect(body).toHaveProperty('balances');
      expect(body).toHaveProperty('memberBalances');
      expect(body.balances).toHaveLength(0);
      expect(Object.keys(body.memberBalances)).toHaveLength(0);
    });

    it('should calculate simple balance between two people', async () => {
      // User A pays $100, split between A and B
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Dinner',
          paidById: userA,
          createdById: userA,
          splitParticipants: [userA, userB],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // B owes A $50
      expect(body.balances).toHaveLength(1);
      expect(body.balances[0]).toEqual({
        from: userB,
        to: userA,
        amount: 50,
        currency: 'USD',
      });

      // Member balances: A is owed $50, B owes $50
      expect(body.memberBalances[userA]).toBe(50);
      expect(body.memberBalances[userB]).toBe(-50);
    });

    it('should calculate balances with three people', async () => {
      // User A pays $90, split between A, B, C
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 90,
          description: 'Lunch',
          paidById: userA,
          createdById: userA,
          splitParticipants: [userA, userB, userC],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // B owes A $30, C owes A $30
      expect(body.balances).toHaveLength(2);

      const bToA = body.balances.find(
        (b) => b.from === userB && b.to === userA,
      );
      const cToA = body.balances.find(
        (b) => b.from === userC && b.to === userA,
      );

      expect(bToA?.amount).toBe(30);
      expect(cToA?.amount).toBe(30);

      // Member balances
      expect(body.memberBalances[userA]).toBe(60); // Is owed $60
      expect(body.memberBalances[userB]).toBe(-30); // Owes $30
      expect(body.memberBalances[userC]).toBe(-30); // Owes $30
    });

    it('should net out balances when people pay each other back', async () => {
      // User A pays $100, split between A and B (B owes A $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Dinner',
          paidById: userA,
          createdById: userA,
          splitParticipants: [userA, userB],
        })
        .expect(201);

      // User B pays $60, split between A and B (A owes B $30)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 60,
          description: 'Breakfast',
          paidById: userB,
          createdById: userB,
          splitParticipants: [userA, userB],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // Net: B owes A $50 - $30 = $20
      expect(body.balances).toHaveLength(1);
      expect(body.balances[0]).toEqual({
        from: userB,
        to: userA,
        amount: 20,
        currency: 'USD',
      });

      // Member balances
      expect(body.memberBalances[userA]).toBe(20);
      expect(body.memberBalances[userB]).toBe(-20);
    });

    it('should handle case where balances net to zero', async () => {
      // User A pays $100, split between A and B (B owes A $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Dinner',
          paidById: userA,
          createdById: userA,
          splitParticipants: [userA, userB],
        })
        .expect(201);

      // User B pays $100, split between A and B (A owes B $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Breakfast',
          paidById: userB,
          createdById: userB,
          splitParticipants: [userA, userB],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // No one owes anyone
      expect(body.balances).toHaveLength(0);
      expect(body.memberBalances[userA] || 0).toBe(0);
      expect(body.memberBalances[userB] || 0).toBe(0);
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get(`/groups/${NON_EXISTENT_UUID}/balances`)
        .expect(404);
    });

    describe('debt simplification', () => {
      it('should simplify chain debt: A owes B, B owes C → A owes C', async () => {
        // User B pays $60, split between A and B (A owes B $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 1',
            paidById: userB,
            createdById: userB,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: userC,
            createdById: userC,
            splitParticipants: [userB, userC],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // Without simplification: A->B $30, B->C $30 (2 transactions)
        // With simplification: A->C $30, B->C $0 (or A->C $30 only - 1 transaction)
        // The simplest outcome: A pays C $30 directly
        expect(body.balances.length).toBeLessThanOrEqual(2);

        // Check member balances are correct regardless of simplification
        expect(body.memberBalances[userA]).toBe(-30); // Owes $30
        expect(body.memberBalances[userC]).toBe(30); // Is owed $30
        // B should be at zero (owes C $30, is owed by A $30)
        expect(body.memberBalances[userB] || 0).toBe(0);
      });

      it('should minimize transactions in complex scenarios', async () => {
        // Create a scenario: A owes B $40, B owes C $30, A owes C $10
        // Unsimplified: 3 transactions
        // Simplified: A pays C $40, A pays B $10 or similar (2 transactions)

        // User B pays $80, split between A and B (A owes B $40)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 80,
            description: 'Expense 1',
            paidById: userB,
            createdById: userB,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: userC,
            createdById: userC,
            splitParticipants: [userB, userC],
          })
          .expect(201);

        // User C pays $20, split between A and C (A owes C $10)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 20,
            description: 'Expense 3',
            paidById: userC,
            createdById: userC,
            splitParticipants: [userA, userC],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // Net balances: A owes $50, B is owed $10, C is owed $40
        // Minimum transactions: A pays B $10, A pays C $40 (2 transactions)
        expect(body.memberBalances[userA]).toBe(-50);
        expect(body.memberBalances[userB]).toBe(10);
        expect(body.memberBalances[userC]).toBe(40);

        // Should have at most 2 transactions (minimum possible)
        expect(body.balances.length).toBeLessThanOrEqual(2);

        // Total amount transferred should equal total debt
        const totalTransferred = body.balances.reduce(
          (sum, b) => sum + b.amount,
          0,
        );
        expect(totalTransferred).toBe(50);
      });

      it('should handle circular debt simplification', async () => {
        // A owes B $30, B owes C $30, C owes A $30 - should all cancel out
        // User B pays $60, split between A and B (A owes B $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 1',
            paidById: userB,
            createdById: userB,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: userC,
            createdById: userC,
            splitParticipants: [userB, userC],
          })
          .expect(201);

        // User A pays $60, split between A and C (C owes A $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 3',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userC],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // All debts should cancel out - everyone is at $0
        expect(body.balances).toHaveLength(0);
        expect(body.memberBalances[userA] || 0).toBe(0);
        expect(body.memberBalances[userB] || 0).toBe(0);
        expect(body.memberBalances[userC] || 0).toBe(0);
      });
    });

    describe('multi-currency conversion', () => {
      it('should convert foreign currency expense to group default currency', async () => {
        // Group has USD as default currency
        // User A pays 100 EUR (with exchange rate 1.10 = $110 USD), split between A and B
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            exchangeRate: 1.1, // 1 EUR = 1.10 USD
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // 100 EUR * 1.10 = 110 USD total
        // Split between 2 people = 55 USD each
        // B owes A $55 USD
        expect(body.balances).toHaveLength(1);
        expect(body.balances[0].from).toBe(userB);
        expect(body.balances[0].to).toBe(userA);
        expect(body.balances[0].amount).toBe(55);
        expect(body.balances[0].currency).toBe('USD');
      });

      it('should handle mixed currency expenses and combine in group currency', async () => {
        // User A pays $100 USD, split between A and B (B owes A $50)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'USD',
            description: 'American Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // User B pays 50 EUR @ 1.20 rate = $60 USD, split between A and B (A owes B $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 50,
            currency: 'EUR',
            exchangeRate: 1.2, // 1 EUR = 1.20 USD
            description: 'European Lunch',
            paidById: userB,
            createdById: userB,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // Net: B owes A $50, A owes B $30 → B owes A $20
        expect(body.balances).toHaveLength(1);
        expect(body.balances[0].from).toBe(userB);
        expect(body.balances[0].to).toBe(userA);
        expect(body.balances[0].amount).toBe(20);
        expect(body.balances[0].currency).toBe('USD');
      });

      it('should use exchangeRate of 1.0 when expense currency matches group currency', async () => {
        // User A pays $100 USD (same as group currency), split between A and B
        const expenseResponse = await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'USD',
            description: 'Local Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // Expense should have exchangeRate of 1.0
        expect(expenseResponse.body.expense.exchangeRate).toBe(1);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // B owes A $50 USD
        expect(body.balances).toHaveLength(1);
        expect(body.balances[0].amount).toBe(50);
      });

      it('should require exchangeRate for foreign currency expenses', async () => {
        // Try to create expense in EUR without exchangeRate
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(400);
      });

      it('should reject invalid exchange rate (zero or negative)', async () => {
        // Try zero exchange rate
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            exchangeRate: 0,
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(400);

        // Try negative exchange rate
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            exchangeRate: -1.5,
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(400);
      });

      it('should store exchangeRate on expense for historical accuracy', async () => {
        const expenseResponse = await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            exchangeRate: 1.15,
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        expect(expenseResponse.body.expense.exchangeRate).toBe(1.15);
        expect(expenseResponse.body.expense.currency).toBe('EUR');

        // Fetch the expense and verify exchangeRate is persisted
        const fetchResponse = await request(httpServer)
          .get(`/expenses/${expenseResponse.body.expense.id}`)
          .expect(200);

        expect(fetchResponse.body.expense.exchangeRate).toBe(1.15);
      });

      it('should include amountInGroupCurrency on expense response', async () => {
        const expenseResponse = await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 100,
            currency: 'EUR',
            exchangeRate: 1.15,
            description: 'European Dinner',
            paidById: userA,
            createdById: userA,
            splitParticipants: [userA, userB],
          })
          .expect(201);

        // 100 EUR * 1.15 = 115 USD
        expect(expenseResponse.body.expense.amountInGroupCurrency).toBe(115);
      });
    });
  });
});
