import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { GroupsModule } from '../groups.module';

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

interface CreateGroupResponse {
  group: Group;
}

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

describe('GroupsController (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GroupsModule],
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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /groups', () => {
    it('should create a group with name and emoji', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Trip to Paris',
          emoji: '🗼',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body).toHaveProperty('group');
      expect(body.group).toMatchObject({
        name: 'Trip to Paris',
        emoji: '🗼',
        createdById: 'user-123',
      });
      expect(body.group).toHaveProperty('id');
      expect(body.group).toHaveProperty('inviteCode');
      expect(body.group).toHaveProperty('defaultCurrency');
      expect(body.group.inviteCode.length).toBeGreaterThanOrEqual(6);
    });

    it('should create a group with default emoji if not provided', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Weekend Trip',
          createdById: 'user-456',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.name).toBe('Weekend Trip');
      expect(body.group.emoji).toBe('👥'); // default emoji
    });

    it('should create a group with custom default currency', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Europe Trip',
          emoji: '🇪🇺',
          createdById: 'user-789',
          defaultCurrency: 'EUR',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.defaultCurrency).toBe('EUR');
    });

    it('should default currency to USD if not specified', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Local Group',
          createdById: 'user-101',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.defaultCurrency).toBe('USD');
    });

    it('should reject empty name', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: '',
          createdById: 'user-123',
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages.some((m) => m.includes('name'))).toBe(true);
    });

    it('should reject missing name', async () => {
      await request(httpServer)
        .post('/groups')
        .send({
          emoji: '🏖️',
          createdById: 'user-123',
        })
        .expect(400);
    });

    it('should reject missing createdById', async () => {
      await request(httpServer)
        .post('/groups')
        .send({
          name: 'Test Group',
          emoji: '🏖️',
        })
        .expect(400);
    });

    it('should generate unique invite codes for different groups', async () => {
      const response1 = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Group 1',
          createdById: 'user-123',
        })
        .expect(201);

      const response2 = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Group 2',
          createdById: 'user-123',
        })
        .expect(201);

      const body1 = response1.body as CreateGroupResponse;
      const body2 = response2.body as CreateGroupResponse;

      expect(body1.group.inviteCode).not.toBe(body2.group.inviteCode);
    });

    it('should trim whitespace from group name', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: '  Trimmed Group  ',
          createdById: 'user-123',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.name).toBe('Trimmed Group');
    });
  });

  describe('GET /groups/:id', () => {
    it('should retrieve a group by ID', async () => {
      // First create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Test Group',
          emoji: '🎉',
          createdById: 'user-123',
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Then retrieve it
      const response = await request(httpServer)
        .get(`/groups/${createdGroup.id}`)
        .expect(200);

      const body = response.body as { group: Group };
      expect(body.group.id).toBe(createdGroup.id);
      expect(body.group.name).toBe('Test Group');
      expect(body.group.emoji).toBe('🎉');
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get('/groups/non-existent-id')
        .expect(404);
    });
  });
});
