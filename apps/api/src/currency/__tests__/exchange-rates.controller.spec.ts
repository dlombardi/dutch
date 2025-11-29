import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('ExchangeRatesController', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /exchange-rates', () => {
    it('should return exchange rates with base currency', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD' })
        .expect(200);

      expect(response.body).toHaveProperty('base', 'USD');
      expect(response.body).toHaveProperty('rates');
      expect(response.body.rates).toBeInstanceOf(Object);
      expect(Object.keys(response.body.rates).length).toBeGreaterThan(0);
    });

    it('should return rate for specific currency', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD', target: 'EUR' })
        .expect(200);

      expect(response.body).toHaveProperty('base', 'USD');
      expect(response.body).toHaveProperty('target', 'EUR');
      expect(response.body).toHaveProperty('rate');
      expect(typeof response.body.rate).toBe('number');
      expect(response.body.rate).toBeGreaterThan(0);
    });

    it('should default to USD as base currency', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .expect(200);

      expect(response.body).toHaveProperty('base', 'USD');
    });

    it('should return rate between two non-USD currencies', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'EUR', target: 'GBP' })
        .expect(200);

      expect(response.body).toHaveProperty('base', 'EUR');
      expect(response.body).toHaveProperty('target', 'GBP');
      expect(response.body).toHaveProperty('rate');
      expect(typeof response.body.rate).toBe('number');
    });

    it('should return 400 for invalid currency code', async () => {
      await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'INVALID' })
        .expect(400);
    });

    it('should return 400 for invalid target currency', async () => {
      await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD', target: 'INVALID' })
        .expect(400);
    });

    it('should return 1.0 rate when base equals target', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD', target: 'USD' })
        .expect(200);

      expect(response.body.rate).toBe(1);
    });

    it('should include timestamp showing when rates were fetched', async () => {
      const response = await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD' })
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('rate caching', () => {
    it('should return cached rates quickly', async () => {
      // First request to warm the cache
      await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD' })
        .expect(200);

      // Second request should be fast (cached)
      const start = Date.now();
      await request(httpServer)
        .get('/exchange-rates')
        .query({ base: 'USD' })
        .expect(200);
      const duration = Date.now() - start;

      // Cached request should be very fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
