import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health Controller (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return basic health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            status: 'ok',
            timestamp: expect.any(String),
            uptime: expect.any(Number),
            version: '1.0.0',
            environment: expect.any(String),
          });
        });
    });
  });

  describe('/health/detailed (GET)', () => {
    it('should return detailed health check', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('details');
        });
    });

    it('should include database health check', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body.details).toHaveProperty('database');
        });
    });

    it('should include memory health check', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body.details).toHaveProperty('memory_heap');
          expect(res.body.details).toHaveProperty('memory_rss');
        });
    });

    it('should include storage health check', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body.details).toHaveProperty('storage');
        });
    });
  });

  describe('/health/metrics (GET)', () => {
    it('should return system metrics', () => {
      return request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            timestamp: expect.any(String),
            uptime: expect.any(Number),
            memory: {
              rss: expect.any(Number),
              heapTotal: expect.any(Number),
              heapUsed: expect.any(Number),
              external: expect.any(Number),
            },
            cpu: {
              user: expect.any(Number),
              system: expect.any(Number),
            },
            process: {
              pid: expect.any(Number),
              version: expect.any(String),
              platform: expect.any(String),
              arch: expect.any(String),
            },
            environment: expect.any(String),
          });
        });
    });

    it('should return valid memory metrics', () => {
      return request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body.memory.rss).toBeGreaterThan(0);
          expect(res.body.memory.heapTotal).toBeGreaterThan(0);
          expect(res.body.memory.heapUsed).toBeGreaterThan(0);
        });
    });

    it('should return valid process information', () => {
      return request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body.process.pid).toBeGreaterThan(0);
          expect(res.body.process.version).toMatch(/^v\d+\.\d+\.\d+/);
          expect(['linux', 'darwin', 'win32']).toContain(res.body.process.platform);
        });
    });
  });

  describe('/health/dependencies (GET)', () => {
    it('should return dependencies status', () => {
      return request(app.getHttpServer())
        .get('/health/dependencies')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            timestamp: expect.any(String),
            totalDependencies: expect.any(Number),
            healthyCount: expect.any(Number),
            unhealthyCount: expect.any(Number),
            notConfiguredCount: expect.any(Number),
            dependencies: expect.any(Array),
          });
        });
    });

    it('should include database dependency', () => {
      return request(app.getHttpServer())
        .get('/health/dependencies')
        .expect(200)
        .expect((res) => {
          const dbDependency = res.body.dependencies.find(
            (dep: any) => dep.name === 'Database'
          );
          expect(dbDependency).toBeDefined();
          expect(dbDependency.type).toBe('PostgreSQL');
        });
    });

    it('should include Supabase dependency', () => {
      return request(app.getHttpServer())
        .get('/health/dependencies')
        .expect(200)
        .expect((res) => {
          const supabaseDependency = res.body.dependencies.find(
            (dep: any) => dep.name === 'Supabase'
          );
          expect(supabaseDependency).toBeDefined();
          expect(supabaseDependency.url).toMatch(/^https?:\/\//);
        });
    });

    it('should have valid dependency counts', () => {
      return request(app.getHttpServer())
        .get('/health/dependencies')
        .expect(200)
        .expect((res) => {
          const { totalDependencies, healthyCount, unhealthyCount, notConfiguredCount } = res.body;
          expect(totalDependencies).toBe(healthyCount + unhealthyCount + notConfiguredCount);
          expect(totalDependencies).toBeGreaterThan(0);
        });
    });
  });

  describe('Health check error handling', () => {
    it('should handle invalid endpoints gracefully', () => {
      return request(app.getHttpServer())
        .get('/health/invalid')
        .expect(404);
    });
  });

  describe('Health check performance', () => {
    it('should respond to basic health check quickly', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      const duration = Date.now() - start;
      
      // Should respond within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should respond to metrics endpoint within reasonable time', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200);
      const duration = Date.now() - start;
      
      // Should respond within 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
