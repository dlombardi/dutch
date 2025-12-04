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
  sessionCount: number;
  upgradePromptDismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GuestAuthResponse {
  user: GuestUser;
  accessToken: string;
  showUpgradePrompt: boolean;
}

describe('Guest Upgrade Prompt (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let uniquePrefix: string;

  beforeEach(async () => {
    // Generate unique prefix for this test run to avoid conflicts
    uniquePrefix = `upgrade-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  describe('POST /auth/guest - session tracking', () => {
    it('should track session count starting at 1 for new guest', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'NewUser', deviceId: `${uniquePrefix}-new-session-1` })
        .expect(201);

      const body = response.body as GuestAuthResponse;
      expect(body.user.sessionCount).toBe(1);
    });

    it('should increment session count on subsequent logins', async () => {
      const deviceId = `${uniquePrefix}-session-counter`;

      // First session
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SessionUser', deviceId })
        .expect(201);

      expect((response1.body as GuestAuthResponse).user.sessionCount).toBe(1);

      // Second session
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SessionUser', deviceId })
        .expect(201);

      expect((response2.body as GuestAuthResponse).user.sessionCount).toBe(2);

      // Third session
      const response3 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SessionUser', deviceId })
        .expect(201);

      expect((response3.body as GuestAuthResponse).user.sessionCount).toBe(3);
    });
  });

  describe('POST /auth/guest - upgrade prompt logic', () => {
    it('should NOT show upgrade prompt on first session', async () => {
      const response = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'FirstTimer', deviceId: `${uniquePrefix}-first-1` })
        .expect(201);

      const body = response.body as GuestAuthResponse;
      expect(body.showUpgradePrompt).toBe(false);
    });

    it('should show upgrade prompt starting from second session', async () => {
      const deviceId = `${uniquePrefix}-prompt-test`;

      // First session - no prompt
      const response1 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'PromptUser', deviceId })
        .expect(201);

      expect((response1.body as GuestAuthResponse).showUpgradePrompt).toBe(
        false,
      );

      // Second session - show prompt
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'PromptUser', deviceId })
        .expect(201);

      expect((response2.body as GuestAuthResponse).showUpgradePrompt).toBe(
        true,
      );
    });

    it('should continue showing upgrade prompt on subsequent sessions', async () => {
      const deviceId = `${uniquePrefix}-subsequent-prompt`;

      // First session
      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SubsequentUser', deviceId })
        .expect(201);

      // Second session
      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SubsequentUser', deviceId })
        .expect(201);

      // Third session - should still show prompt
      const response3 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'SubsequentUser', deviceId })
        .expect(201);

      expect((response3.body as GuestAuthResponse).showUpgradePrompt).toBe(
        true,
      );
    });
  });

  describe('POST /auth/guest/dismiss-upgrade-prompt', () => {
    it('should allow dismissing the upgrade prompt', async () => {
      const deviceId = `${uniquePrefix}-dismiss-test`;

      // Create a guest with 2 sessions
      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'DismissUser', deviceId })
        .expect(201);

      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'DismissUser', deviceId })
        .expect(201);

      // Dismiss the prompt
      const dismissResponse = await request(httpServer)
        .post('/auth/guest/dismiss-upgrade-prompt')
        .send({ deviceId })
        .expect(200);

      expect(dismissResponse.body).toHaveProperty('success', true);
    });

    it('should NOT show upgrade prompt after it has been dismissed', async () => {
      const deviceId = `${uniquePrefix}-dismissed-no-show`;

      // First session
      await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'DismissedUser', deviceId })
        .expect(201);

      // Second session - prompt would normally show
      const response2 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'DismissedUser', deviceId })
        .expect(201);

      expect((response2.body as GuestAuthResponse).showUpgradePrompt).toBe(
        true,
      );

      // Dismiss the prompt
      await request(httpServer)
        .post('/auth/guest/dismiss-upgrade-prompt')
        .send({ deviceId })
        .expect(200);

      // Third session - prompt should NOT show because dismissed
      const response3 = await request(httpServer)
        .post('/auth/guest')
        .send({ name: 'DismissedUser', deviceId })
        .expect(201);

      expect((response3.body as GuestAuthResponse).showUpgradePrompt).toBe(
        false,
      );
      expect(
        (response3.body as GuestAuthResponse).user.upgradePromptDismissedAt,
      ).toBeDefined();
    });

    it('should return 404 for non-existent device', async () => {
      await request(httpServer)
        .post('/auth/guest/dismiss-upgrade-prompt')
        .send({ deviceId: `${uniquePrefix}-non-existent-device` })
        .expect(404);
    });

    it('should require deviceId parameter', async () => {
      await request(httpServer)
        .post('/auth/guest/dismiss-upgrade-prompt')
        .send({})
        .expect(400);
    });
  });
});
