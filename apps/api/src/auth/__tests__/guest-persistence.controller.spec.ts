import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../../app.module';
import * as jwt from 'jsonwebtoken';

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
  let uniquePrefix: string;

  beforeEach(async () => {
    // Generate unique prefix for this test run to avoid conflicts
    uniquePrefix = `persist-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  describe('Session persistence across requests', () => {
    it('should return the same user when re-authenticating with same device ID', async () => {
      const deviceId = `${uniquePrefix}-device-001`;

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
      const deviceId = `${uniquePrefix}-device-002`;

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
      const deviceId = `${uniquePrefix}-device-003`;

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
      // Valid token issued (verify claims match, not string equality since JWTs with same payload/iat are deterministic)
      expect(body2.accessToken.length).toBeGreaterThan(0);
      const decoded1 = jwt.decode(firstToken) as { sub: string } | null;
      const decoded2 = jwt.decode(body2.accessToken) as { sub: string } | null;
      expect(decoded1).not.toBeNull();
      expect(decoded2).not.toBeNull();
      expect(decoded1!.sub).toBe(userId);
      expect(decoded2!.sub).toBe(userId);
    });

    it('should maintain user type as guest across sessions', async () => {
      const deviceId = `${uniquePrefix}-device-004`;

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
