import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AuthModule } from '../auth.module';

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

describe('Guest Device Persistence (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
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

  describe('Session persistence across requests', () => {
    it('should return the same user when re-authenticating with same device ID', async () => {
      const deviceId = 'persistent-device-001';

      // First authentication (simulating initial app launch)
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'TestUser', deviceId })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      const originalUserId = body1.user.id;

      // Second authentication (simulating app restart/relaunch)
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'TestUser', deviceId })
        .expect(201);

      const body2 = response2.body as GuestAuthResponse;

      // Should be recognized as the same user
      expect(body2.user.id).toBe(originalUserId);
      expect(body2.user.type).toBe('guest');
      expect(body2.user.deviceId).toBe(deviceId);
    });

    it('should preserve user data across multiple sessions', async () => {
      const deviceId = 'persistent-device-002';

      // Initial registration
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'OriginalName', deviceId })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      const userId = body1.user.id;

      // Simulating app close and reopen - user name unchanged
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'OriginalName', deviceId })
        .expect(201);

      const body2 = response2.body as GuestAuthResponse;

      expect(body2.user.id).toBe(userId);
      expect(body2.user.name).toBe('OriginalName');
    });

    it('should issue new access token on each session while preserving user identity', async () => {
      const deviceId = 'persistent-device-003';

      // First session
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'TokenTestUser', deviceId })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      const firstToken = body1.accessToken;
      const userId = body1.user.id;

      // Second session (new token should be issued)
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'TokenTestUser', deviceId })
        .expect(201);

      const body2 = response2.body as GuestAuthResponse;

      // Same user
      expect(body2.user.id).toBe(userId);
      // New token (tokens are randomly generated)
      expect(body2.accessToken).not.toBe(firstToken);
      expect(body2.accessToken.length).toBeGreaterThan(0);
    });

    it('should maintain user type as guest across sessions', async () => {
      const deviceId = 'persistent-device-004';

      // Create guest
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'GuestTypeTest', deviceId })
        .expect(201);

      const body1 = response1.body as GuestAuthResponse;
      expect(body1.user.type).toBe('guest');

      // Re-authenticate
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'GuestTypeTest', deviceId })
        .expect(201);

      const body2 = response2.body as GuestAuthResponse;
      expect(body2.user.type).toBe('guest');
      expect(body2.user.id).toBe(body1.user.id);
    });
  });
});
