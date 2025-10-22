import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  basicHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with all services' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  @HealthCheck()
  async detailedHealthCheck() {
    return this.health.check([
      // Database health
      () => this.healthService.checkDatabase(),
      
      // Memory usage (should not exceed 1GB)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
      
      // Disk usage (should not exceed 80%)
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.8 
      }),
      
      // External services
      () => this.healthService.checkSupabase(),
      () => this.healthService.checkOpenAI(),
    ]);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'System metrics and performance data' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getMetrics() {
    return this.healthService.getSystemMetrics();
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Check external dependencies status' })
  @ApiResponse({ status: 200, description: 'Dependencies status' })
  async checkDependencies() {
    return this.healthService.checkExternalDependencies();
  }
}
