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
  });
});
