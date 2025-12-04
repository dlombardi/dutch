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

interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: string;
  createdById: string;
  createdAt: string;
}

// Valid UUID format that doesn't exist in the database
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('Settlements API (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testGroup: Group;
  let userA: string;
  let userB: string;

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

    // Create a test group
    const groupResponse = await request(httpServer)
      .post('/groups')
      .send({
        name: 'Test Settlement Group',
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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /settlements', () => {
    it('should record a settlement payment', async () => {
      const response = await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(201);

      expect(response.body).toHaveProperty('settlement');
      const settlement = response.body.settlement as Settlement;
      expect(settlement.groupId).toBe(testGroup.id);
      expect(settlement.fromUserId).toBe(userA);
      expect(settlement.toUserId).toBe(userB);
      expect(settlement.amount).toBe(50);
      expect(settlement.currency).toBe('USD'); // Defaults to group currency
      expect(settlement).toHaveProperty('id');
      expect(settlement).toHaveProperty('createdAt');
    });

    it('should accept custom currency', async () => {
      const response = await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          currency: 'EUR',
          createdById: userA,
        })
        .expect(201);

      const settlement = response.body.settlement as Settlement;
      expect(settlement.currency).toBe('EUR');
    });

    it('should accept payment method', async () => {
      const response = await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          method: 'venmo',
          createdById: userA,
        })
        .expect(201);

      const settlement = response.body.settlement as Settlement;
      expect(settlement.method).toBe('venmo');
    });

    it('should default method to cash', async () => {
      const response = await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(201);

      const settlement = response.body.settlement as Settlement;
      expect(settlement.method).toBe('cash');
    });

    it('should reject negative amount', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: -50,
          createdById: userA,
        })
        .expect(400);
    });

    it('should reject zero amount', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 0,
          createdById: userA,
        })
        .expect(400);
    });

    it('should reject missing groupId', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(400);
    });

    it('should reject missing fromUserId', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(400);
    });

    it('should reject missing toUserId', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          amount: 50,
          createdById: userA,
        })
        .expect(400);
    });

    it('should reject same fromUserId and toUserId', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userA,
          amount: 50,
          createdById: userA,
        })
        .expect(400);
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: NON_EXISTENT_UUID,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(404);
    });
  });

  describe('GET /groups/:id/settlements', () => {
    it('should return empty settlements for group with none', async () => {
      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/settlements`)
        .expect(200);

      expect(response.body).toHaveProperty('settlements');
      expect(response.body.settlements).toHaveLength(0);
    });

    it('should return settlements for a group', async () => {
      // Create a settlement
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userA,
          toUserId: userB,
          amount: 50,
          createdById: userA,
        })
        .expect(201);

      const response = await request(httpServer)
        .get(`/groups/${testGroup.id}/settlements`)
        .expect(200);

      expect(response.body.settlements).toHaveLength(1);
      expect(response.body.settlements[0].amount).toBe(50);
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get(`/groups/${NON_EXISTENT_UUID}/settlements`)
        .expect(404);
    });
  });

  describe('Settlement affects balances', () => {
    it('should reduce debt when settlement is recorded', async () => {
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

      // Check initial balance (B owes A $50)
      let balanceResponse = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      expect(balanceResponse.body.memberBalances[userA]).toBe(50);
      expect(balanceResponse.body.memberBalances[userB]).toBe(-50);

      // Record settlement: B pays A $50
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userB,
          toUserId: userA,
          amount: 50,
          createdById: userB,
        })
        .expect(201);

      // Check balance after settlement (should be settled)
      balanceResponse = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      // Balances should be zero or empty
      expect(balanceResponse.body.memberBalances[userA] || 0).toBe(0);
      expect(balanceResponse.body.memberBalances[userB] || 0).toBe(0);
    });

    it('should handle partial settlements', async () => {
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

      // Record partial settlement: B pays A $30
      await request(httpServer)
        .post('/settlements')
        .send({
          groupId: testGroup.id,
          fromUserId: userB,
          toUserId: userA,
          amount: 30,
          createdById: userB,
        })
        .expect(201);

      // Check balance after partial settlement (B still owes A $20)
      const balanceResponse = await request(httpServer)
        .get(`/groups/${testGroup.id}/balances`)
        .expect(200);

      expect(balanceResponse.body.memberBalances[userA]).toBe(20);
      expect(balanceResponse.body.memberBalances[userB]).toBe(-20);
    });
  });
});
