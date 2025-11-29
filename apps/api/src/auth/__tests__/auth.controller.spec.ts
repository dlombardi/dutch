import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/magic-link/request', () => {
    it('should accept a valid email and return success message', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Magic link sent to your email',
      });
    });

    it('should reject an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('should reject empty email', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: '' })
        .expect(400);
    });
  });

  describe('POST /auth/magic-link/verify', () => {
    it('should verify a valid magic link token and return user with accessToken', async () => {
      // First, request a magic link
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'verify-test@example.com' })
        .expect(200);

      // Find the token that was created (using service's internal method for testing)
      // In real testing, we'd capture this from logs or use a test email service
      const magicLinks = Array.from(
        (authService as any).magicLinks.entries(),
      );
      const [token] = magicLinks.find(
        ([, data]) => data.email === 'verify-test@example.com',
      )!;

      // Verify the magic link
      const response = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        email: 'verify-test@example.com',
        type: 'full',
        authProvider: 'magic_link',
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should reject an invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: 'invalid-token-that-does-not-exist' })
        .expect(400);

      expect(response.body.message).toBe('Invalid magic link');
    });

    it('should reject an already-used token', async () => {
      // Request a magic link
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'used-test@example.com' })
        .expect(200);

      // Get the token
      const magicLinks = Array.from(
        (authService as any).magicLinks.entries(),
      );
      const [token] = magicLinks.find(
        ([, data]) => data.email === 'used-test@example.com',
      )!;

      // Use the token once
      await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(200);

      // Try to use it again
      const response = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token })
        .expect(400);

      expect(response.body.message).toBe('Magic link has already been used');
    });

    it('should return the same user for the same email', async () => {
      // Request first magic link
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'same-user@example.com' })
        .expect(200);

      const magicLinks1 = Array.from(
        (authService as any).magicLinks.entries(),
      );
      const [token1] = magicLinks1.find(
        ([, data]) => data.email === 'same-user@example.com' && !data.used,
      )!;

      // Verify first token
      const response1 = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: token1 })
        .expect(200);

      const userId = response1.body.user.id;

      // Request second magic link for same email
      await request(app.getHttpServer())
        .post('/auth/magic-link/request')
        .send({ email: 'same-user@example.com' })
        .expect(200);

      const magicLinks2 = Array.from(
        (authService as any).magicLinks.entries(),
      );
      const [token2] = magicLinks2.find(
        ([, data]) => data.email === 'same-user@example.com' && !data.used,
      )!;

      // Verify second token
      const response2 = await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: token2 })
        .expect(200);

      // Should be the same user
      expect(response2.body.user.id).toBe(userId);
    });

    it('should reject empty token', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link/verify')
        .send({ token: '' })
        .expect(400);
    });
  });
});
