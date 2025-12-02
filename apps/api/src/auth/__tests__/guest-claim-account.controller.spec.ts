import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';

describe('Guest Claim Account (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
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

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/guest/claim - Request claim', () => {
    it('should initiate claim process for guest user', async () => {
      // First create a guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId: 'claim-test-device-1' })
        .expect(201);

      expect(guestResponse.body.user.type).toBe('guest');

      // Now request to claim account with email
      const claimResponse = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-1',
          email: 'claim@example.com',
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
          deviceId: 'non-existent-device',
          email: 'claim2@example.com',
        })
        .expect(404);

      expect(response.body.message).toBe('Guest user not found for this device');
    });

    it('should reject claim with invalid email', async () => {
      // First create a guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId: 'claim-test-device-2' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-2',
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
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId: 'claim-test-device-3' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-3',
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
          email: 'claim3@example.com',
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(messages).toContain('deviceId');
    });

    it('should reject claim if email is already in use', async () => {
      // First create a full user with the email
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'existing@example.com' })
        .expect(200);

      const token = authService.findTokenByEmail('existing@example.com');
      await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // Now create a guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Test Guest', deviceId: 'claim-test-device-4' })
        .expect(201);

      // Try to claim with the same email
      const response = await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-4',
          email: 'existing@example.com',
        })
        .expect(409);

      expect(response.body.message).toBe(
        'This email is already associated with an account',
      );
    });
  });

  describe('POST /auth/magic-link/verify - Claim verification', () => {
    it('should upgrade guest to claimed user after verification', async () => {
      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Claim Me', deviceId: 'claim-test-device-5' })
        .expect(201);

      const guestUserId = guestResponse.body.user.id;

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-5',
          email: 'claimed@example.com',
        })
        .expect(200);

      // Verify magic link
      const token = authService.findTokenByEmail('claimed@example.com');
      expect(token).toBeDefined();

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // Check user is upgraded
      expect(verifyResponse.body.user.id).toBe(guestUserId);
      expect(verifyResponse.body.user.type).toBe('claimed');
      expect(verifyResponse.body.user.email).toBe('claimed@example.com');
      expect(verifyResponse.body.user.name).toBe('Claim Me');
    });

    it('should preserve user data after claiming', async () => {
      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Original Name', deviceId: 'claim-test-device-6' })
        .expect(201);

      const originalCreatedAt = new Date(
        guestResponse.body.user.createdAt,
      ).getTime();
      const guestUserId = guestResponse.body.user.id;

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-6',
          email: 'preserved@example.com',
        })
        .expect(200);

      // Verify magic link
      const token = authService.findTokenByEmail('preserved@example.com');
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
      // Create guest user
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Token Test', deviceId: 'claim-test-device-7' })
        .expect(201);

      // Request claim
      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-7',
          email: 'token@example.com',
        })
        .expect(200);

      // Verify magic link
      const token = authService.findTokenByEmail('token@example.com');
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      expect(verifyResponse.body.accessToken).toBeDefined();
      expect(typeof verifyResponse.body.accessToken).toBe('string');
      expect(verifyResponse.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should allow claimed user to login again with email', async () => {
      // Create guest user and claim it
      await request(app.getHttpServer())
        .post('/auth/guest')
        .send({ name: 'Login Again', deviceId: 'claim-test-device-8' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/guest/claim')
        .send({
          deviceId: 'claim-test-device-8',
          email: 'loginagain@example.com',
        })
        .expect(200);

      const claimToken = authService.findTokenByEmail('loginagain@example.com');
      const claimResponse = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: claimToken })
        .expect(200);

      const claimedUserId = claimResponse.body.user.id;

      // Now login again with the same email
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'loginagain@example.com' })
        .expect(200);

      const loginToken = authService.findTokenByEmail('loginagain@example.com');
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
