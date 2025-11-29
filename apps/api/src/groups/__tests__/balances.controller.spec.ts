import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { GroupsModule } from '../groups.module';
import { ExpensesModule } from '../../expenses/expenses.module';

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

describe('Balances API (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testGroup: Group;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GroupsModule, ExpensesModule],
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

    // Create a test group
    const groupResponse = await request(httpServer)
      .post('/groups')
      .send({
        name: 'Test Balance Group',
        emoji: '💰',
        createdById: 'user-a',
        defaultCurrency: 'USD',
      })
      .expect(201);

    testGroup = groupResponse.body.group;

    // Add members to the group
    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: 'user-b' })
      .expect(201);

    await request(httpServer)
      .post('/groups/join')
      .send({ inviteCode: testGroup.inviteCode, userId: 'user-c' })
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
          paidById: 'user-a',
          createdById: 'user-a',
          splitParticipants: ['user-a', 'user-b'],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // B owes A $50
      expect(body.balances).toHaveLength(1);
      expect(body.balances[0]).toEqual({
        from: 'user-b',
        to: 'user-a',
        amount: 50,
        currency: 'USD',
      });

      // Member balances: A is owed $50, B owes $50
      expect(body.memberBalances['user-a']).toBe(50);
      expect(body.memberBalances['user-b']).toBe(-50);
    });

    it('should calculate balances with three people', async () => {
      // User A pays $90, split between A, B, C
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 90,
          description: 'Lunch',
          paidById: 'user-a',
          createdById: 'user-a',
          splitParticipants: ['user-a', 'user-b', 'user-c'],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // B owes A $30, C owes A $30
      expect(body.balances).toHaveLength(2);

      const bToA = body.balances.find(b => b.from === 'user-b' && b.to === 'user-a');
      const cToA = body.balances.find(b => b.from === 'user-c' && b.to === 'user-a');

      expect(bToA?.amount).toBe(30);
      expect(cToA?.amount).toBe(30);

      // Member balances
      expect(body.memberBalances['user-a']).toBe(60); // Is owed $60
      expect(body.memberBalances['user-b']).toBe(-30); // Owes $30
      expect(body.memberBalances['user-c']).toBe(-30); // Owes $30
    });

    it('should net out balances when people pay each other back', async () => {
      // User A pays $100, split between A and B (B owes A $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Dinner',
          paidById: 'user-a',
          createdById: 'user-a',
          splitParticipants: ['user-a', 'user-b'],
        })
        .expect(201);

      // User B pays $60, split between A and B (A owes B $30)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 60,
          description: 'Breakfast',
          paidById: 'user-b',
          createdById: 'user-b',
          splitParticipants: ['user-a', 'user-b'],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // Net: B owes A $50 - $30 = $20
      expect(body.balances).toHaveLength(1);
      expect(body.balances[0]).toEqual({
        from: 'user-b',
        to: 'user-a',
        amount: 20,
        currency: 'USD',
      });

      // Member balances
      expect(body.memberBalances['user-a']).toBe(20);
      expect(body.memberBalances['user-b']).toBe(-20);
    });

    it('should handle case where balances net to zero', async () => {
      // User A pays $100, split between A and B (B owes A $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Dinner',
          paidById: 'user-a',
          createdById: 'user-a',
          splitParticipants: ['user-a', 'user-b'],
        })
        .expect(201);

      // User B pays $100, split between A and B (A owes B $50)
      await request(httpServer)
        .post('/expenses')
        .send({
          groupId: testGroup.id,
          amount: 100,
          description: 'Breakfast',
          paidById: 'user-b',
          createdById: 'user-b',
          splitParticipants: ['user-a', 'user-b'],
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      const body = response.body as BalancesResponse;

      // No one owes anyone
      expect(body.balances).toHaveLength(0);
      expect(body.memberBalances['user-a'] || 0).toBe(0);
      expect(body.memberBalances['user-b'] || 0).toBe(0);
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get('/groups/non-existent-group/balances')
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
            paidById: 'user-b',
            createdById: 'user-b',
            splitParticipants: ['user-a', 'user-b'],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: 'user-c',
            createdById: 'user-c',
            splitParticipants: ['user-b', 'user-c'],
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
        expect(body.memberBalances['user-a']).toBe(-30); // Owes $30
        expect(body.memberBalances['user-c']).toBe(30); // Is owed $30
        // B should be at zero (owes C $30, is owed by A $30)
        expect(body.memberBalances['user-b'] || 0).toBe(0);
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
            paidById: 'user-b',
            createdById: 'user-b',
            splitParticipants: ['user-a', 'user-b'],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: 'user-c',
            createdById: 'user-c',
            splitParticipants: ['user-b', 'user-c'],
          })
          .expect(201);

        // User C pays $20, split between A and C (A owes C $10)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 20,
            description: 'Expense 3',
            paidById: 'user-c',
            createdById: 'user-c',
            splitParticipants: ['user-a', 'user-c'],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // Net balances: A owes $50, B is owed $10, C is owed $40
        // Minimum transactions: A pays B $10, A pays C $40 (2 transactions)
        expect(body.memberBalances['user-a']).toBe(-50);
        expect(body.memberBalances['user-b']).toBe(10);
        expect(body.memberBalances['user-c']).toBe(40);

        // Should have at most 2 transactions (minimum possible)
        expect(body.balances.length).toBeLessThanOrEqual(2);

        // Total amount transferred should equal total debt
        const totalTransferred = body.balances.reduce((sum, b) => sum + b.amount, 0);
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
            paidById: 'user-b',
            createdById: 'user-b',
            splitParticipants: ['user-a', 'user-b'],
          })
          .expect(201);

        // User C pays $60, split between B and C (B owes C $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 2',
            paidById: 'user-c',
            createdById: 'user-c',
            splitParticipants: ['user-b', 'user-c'],
          })
          .expect(201);

        // User A pays $60, split between A and C (C owes A $30)
        await request(httpServer)
          .post('/expenses')
          .send({
            groupId: testGroup.id,
            amount: 60,
            description: 'Expense 3',
            paidById: 'user-a',
            createdById: 'user-a',
            splitParticipants: ['user-a', 'user-c'],
          })
          .expect(201);

        const response = await request(httpServer)
          .get(`/groups/${testGroup.id}/balances`)
          .expect(200);

        const body = response.body as BalancesResponse;

        // All debts should cancel out - everyone is at $0
        expect(body.balances).toHaveLength(0);
        expect(body.memberBalances['user-a'] || 0).toBe(0);
        expect(body.memberBalances['user-b'] || 0).toBe(0);
        expect(body.memberBalances['user-c'] || 0).toBe(0);
      });
    });
  });
});
