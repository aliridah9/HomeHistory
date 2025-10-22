import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HealthService } from '../../src/modules/health/health.service';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { of, throwError } from 'rxjs';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database is accessible', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([{ result: 1 }]);

      const result = await service.checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'up',
          message: 'Database connection is healthy',
          responseTime: expect.any(Number),
        },
      });
    });

    it('should throw error when database is not accessible', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockRejectedValue(new Error('Connection failed'));

      await expect(service.checkDatabase()).rejects.toThrow('Database health check failed: Connection failed');
    });
  });

  describe('checkSupabase', () => {
    it('should return healthy status when Supabase is accessible', async () => {
      const mockResponse = {
        headers: { 'x-response-time': '50ms' },
        data: {},
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

      const result = await service.checkSupabase();

      expect(result).toEqual({
        supabase: {
          status: 'up',
          message: 'Supabase API is accessible',
          responseTime: '50ms',
        },
      });
    });

    it('should throw error when Supabase is not accessible', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.checkSupabase()).rejects.toThrow('Supabase health check failed: Network error');
    });
  });

  describe('checkOpenAI', () => {
    beforeEach(() => {
      // Mock getConfig to return OpenAI API key
      jest.doMock('../../src/config', () => ({
        getConfig: () => ({
          openai: { apiKey: 'test-api-key' },
        }),
      }));
    });

    it('should return healthy status when OpenAI is accessible', async () => {
      const mockResponse = {
        data: { data: [{ id: 'model-1' }, { id: 'model-2' }] },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

      const result = await service.checkOpenAI();

      expect(result).toEqual({
        openai: {
          status: 'up',
          message: 'OpenAI API is accessible',
          modelsCount: 2,
        },
      });
    });

    it('should return skip status when OpenAI API key is not configured', async () => {
      // Mock getConfig to return no API key
      jest.doMock('../../src/config', () => ({
        getConfig: () => ({
          openai: { apiKey: '' },
        }),
      }));

      const result = await service.checkOpenAI();

      expect(result).toEqual({
        openai: {
          status: 'skip',
          message: 'OpenAI API key not configured',
        },
      });
    });

    it('should throw error when OpenAI is not accessible', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('API error')));

      await expect(service.checkOpenAI()).rejects.toThrow('OpenAI health check failed: API error');
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', async () => {
      const result = await service.getSystemMetrics();

      expect(result).toEqual({
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

  describe('checkExternalDependencies', () => {
    it('should return status of all external dependencies', async () => {
      // Mock successful health checks
      jest.spyOn(service, 'checkSupabase').mockResolvedValue({
        supabase: { status: 'up', message: 'OK', responseTime: '50ms' },
      });
      jest.spyOn(service, 'checkOpenAI').mockResolvedValue({
        openai: { status: 'up', message: 'OK', modelsCount: 5 },
      });
      jest.spyOn(service, 'checkDatabase').mockResolvedValue({
        database: { status: 'up', message: 'OK', responseTime: 10 },
      });

      const result = await service.checkExternalDependencies();

      expect(result).toEqual({
        timestamp: expect.any(String),
        totalDependencies: 3,
        healthyCount: 3,
        unhealthyCount: 0,
        notConfiguredCount: 0,
        dependencies: [
          {
            name: 'Supabase',
            status: 'healthy',
            url: expect.any(String),
          },
          {
            name: 'OpenAI',
            status: 'healthy',
            url: 'https://api.openai.com',
          },
          {
            name: 'Database',
            status: 'healthy',
            type: 'PostgreSQL',
          },
        ],
      });
    });

    it('should handle unhealthy dependencies', async () => {
      // Mock failed health checks
      jest.spyOn(service, 'checkSupabase').mockRejectedValue(new Error('Connection failed'));
      jest.spyOn(service, 'checkOpenAI').mockResolvedValue({
        openai: { status: 'skip', message: 'Not configured' },
      });
      jest.spyOn(service, 'checkDatabase').mockResolvedValue({
        database: { status: 'up', message: 'OK', responseTime: 10 },
      });

      const result = await service.checkExternalDependencies();

      expect(result.healthyCount).toBe(1);
      expect(result.unhealthyCount).toBe(1);
      expect(result.notConfiguredCount).toBe(1);
    });
  });
});
