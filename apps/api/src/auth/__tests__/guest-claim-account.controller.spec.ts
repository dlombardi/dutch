import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { AuthService } from '../auth.service';

describe('Guest Claim Account (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let uniquePrefix: string;

  beforeEach(async () => {
    // Generate unique prefix for this test run to avoid conflicts
    uniquePrefix = `claim-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/guest/claim - Request claim', () => {
    it('should initiate claim process for guest user', async () => {
      const deviceId = `${uniquePrefix}-device-1`;
      // First create a guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId })
        .expect(201);

      expect(guestResponse.body.user.type).toBe('guest');

      // Now request to claim account with email
      const claimResponse = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email: `${uniquePrefix}@example.com`,
        })
        .expect(200);

      expect(claimResponse.body.message).toBe(
        'Verification email sent. Please check your inbox.',
      );
    });

    it('should reject claim for non-existent device', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: `${uniquePrefix}-non-existent`,
          email: `${uniquePrefix}-claim2@example.com`,
        })
        .expect(404);

      expect(response.body.message).toBe(
        'Guest user not found for this device',
      );
    });

    it('should reject claim with invalid email', async () => {
      const deviceId = `${uniquePrefix}-device-2`;
      // First create a guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email: 'not-an-email',
        })
        .expect(400);

      // Validation returns array of messages
      const messages = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(messages).toContain('email');
    });

    it('should reject claim with missing email', async () => {
      const deviceId = `${uniquePrefix}-device-3`;
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(messages).toContain('email');
    });

    it('should reject claim with missing deviceId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          email: `${uniquePrefix}-claim3@example.com`,
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(messages).toContain('deviceId');
    });

    it('should reject claim if email is already in use', async () => {
      const email = `${uniquePrefix}-existing@example.com`;
      const deviceId = `${uniquePrefix}-device-4`;

      // First create a full user with the email
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email })
        .expect(200);

      const token = await authService.findTokenByEmail(email);
      await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // Now create a guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId })
        .expect(201);

      // Try to claim with the same email
      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email,
        })
        .expect(409);

      expect(response.body.message).toBe(
        'This email is already associated with an account',
      );
    });
  });

  describe('POST /auth/magic-link/verify - Claim verification', () => {
    it('should upgrade guest to claimed user after verification', async () => {
      const deviceId = `${uniquePrefix}-device-5`;
      const email = `${uniquePrefix}-claimed@example.com`;

      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Claim Me', deviceId })
        .expect(201);

      const guestUserId = guestResponse.body.user.id;

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email,
        })
        .expect(200);

      // Verify magic link
      const token = await authService.findTokenByEmail(email);
      expect(token).toBeDefined();

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // Check user is upgraded
      expect(verifyResponse.body.user.id).toBe(guestUserId);
      expect(verifyResponse.body.user.type).toBe('claimed');
      expect(verifyResponse.body.user.email).toBe(email);
      expect(verifyResponse.body.user.name).toBe('Claim Me');
    });

    it('should preserve user data after claiming', async () => {
      const deviceId = `${uniquePrefix}-device-6`;
      const email = `${uniquePrefix}-preserved@example.com`;

      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Original Name', deviceId })
        .expect(201);

      const originalCreatedAt = new Date(
        guestResponse.body.user.createdAt,
      ).getTime();
      const guestUserId = guestResponse.body.user.id;

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email,
        })
        .expect(200);

      // Verify magic link
      const token = await authService.findTokenByEmail(email);
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // User ID should be the same (same user, upgraded)
      expect(verifyResponse.body.user.id).toBe(guestUserId);
      // Name should be preserved
      expect(verifyResponse.body.user.name).toBe('Original Name');
      // Creation date should be preserved
      const claimedCreatedAt = new Date(
        verifyResponse.body.user.createdAt,
      ).getTime();
      expect(claimedCreatedAt).toBe(originalCreatedAt);
    });

    it('should return new access token after claiming', async () => {
      const deviceId = `${uniquePrefix}-device-7`;
      const email = `${uniquePrefix}-token@example.com`;

      // Create guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Token Test', deviceId })
        .expect(201);

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email,
        })
        .expect(200);

      // Verify magic link
      const token = await authService.findTokenByEmail(email);
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      expect(verifyResponse.body.accessToken).toBeDefined();
      expect(typeof verifyResponse.body.accessToken).toBe('string');
      expect(verifyResponse.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should allow claimed user to login again with email', async () => {
      const deviceId = `${uniquePrefix}-device-8`;
      const email = `${uniquePrefix}-loginagain@example.com`;

      // Create guest user and claim it
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Login Again', deviceId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId,
          email,
        })
        .expect(200);

      const claimToken = await authService.findTokenByEmail(email);
      const claimResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: claimToken })
        .expect(200);

      const claimedUserId = claimResponse.body.user.id;

      // Now login again with the same email
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email })
        .expect(200);

      const loginToken = await authService.findTokenByEmail(email);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: loginToken })
        .expect(200);

      // Should be the same user
      expect(loginResponse.body.user.id).toBe(claimedUserId);
      expect(loginResponse.body.user.type).toBe('claimed');
      expect(loginResponse.body.user.name).toBe('Login Again');
    });
  });
});
