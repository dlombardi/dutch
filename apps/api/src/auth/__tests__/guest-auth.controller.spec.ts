import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../../app.module';

interface GuestUser {
  id: string;
  name: string;
  type: 'guest';
  authProvider: 'guest';
  deviceId: string;
  createdAt: string;
  updatedAt: string;
}

interface GuestAuthResponse {
  user: GuestUser;
  accessToken: string;
}

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

describe('Guest Auth (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/guest', () => {
    it('should create a guest user with name and device ID', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'John', deviceId: 'device-123-abc' })
        .expect(201);

      const body = response.body as GuestAuthResponse;
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('accessToken');
      expect(body.user).toMatchObject({
        name: 'John',
        type: 'guest',
        authProvider: 'guest',
        deviceId: 'device-123-abc',
      });
      expect(body.user).toHaveProperty('id');
      expect(typeof body.accessToken).toBe('string');
      expect(body.accessToken.length).toBeGreaterThan(0);
    });

    it('should return existing guest user for same device ID', async () => {
      const deviceId = 'device-same-123';

      // Create first guest
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'Alice', deviceId })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      const userId = body1.user.id;

      // Create second guest with same device ID
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'Bob', deviceId })
        .expect(201);

      const body2 = response2.body as GuestAuthResponse;

      // Should return same user (device already registered)
      expect(body2.user.id).toBe(userId);
      // Name should be updated to the new name
      expect(body2.user.name).toBe('Bob');
    });

    it('should reject empty name', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: '', deviceId: 'device-123' })
        .expect(400);

      const body = response.body as ErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages.some((m) => m.includes('name'))).toBe(true);
    });

    it('should reject missing name', async () => {
      await request(httpServer)
        .post('/auth/guest')
        .send({ deviceId: 'device-123' })
        .expect(400);
    });

    it('should reject empty device ID', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'John', deviceId: '' })
        .expect(400);

      const body = response.body as ErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages.some((m) => m.includes('deviceId'))).toBe(true);
    });

    it('should reject missing device ID', async () => {
      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'John' })
        .expect(400);
    });

    it('should trim whitespace from name', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: '  Jane  ', deviceId: 'device-456' })
        .expect(201);

      const body = response.body as GuestAuthResponse;
      expect(body.user.name).toBe('Jane');
    });

    it('should create different users for different device IDs', async () => {
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'User1', deviceId: 'device-a' })
        .expect(201);

      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'User2', deviceId: 'device-b' })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      const body2 = response2.body as GuestAuthResponse;

      expect(body1.user.id).not.toBe(body2.user.id);
    });
  });
});
