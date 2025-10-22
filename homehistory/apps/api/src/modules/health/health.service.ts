import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../database/prisma.service';
import { getConfig } from '../../config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: {
          status: 'up',
          message: 'Database connection is healthy',
          responseTime: Date.now(),
        },
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error.message}`);
    }
  }

  async checkSupabase() {
    const config = getConfig();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.supabase.url}/rest/v1/`, {
          headers: {
            'apikey': config.supabase.anonKey,
          },
          timeout: 5000,
        })
      );
      
      return {
        supabase: {
          status: 'up',
          message: 'Supabase API is accessible',
          responseTime: response.headers['x-response-time'] || 'N/A',
        },
      };
    } catch (error) {
      throw new Error(`Supabase health check failed: ${error.message}`);
    }
  }

  async checkOpenAI() {
    const config = getConfig();
    if (!config.openai.apiKey) {
      return {
        openai: {
          status: 'skip',
          message: 'OpenAI API key not configured',
        },
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.openai.apiKey}`,
          },
          timeout: 5000,
        })
      );
      
      return {
        openai: {
          status: 'up',
          message: 'OpenAI API is accessible',
          modelsCount: response.data?.data?.length || 0,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI health check failed: ${error.message}`);
    }
  }

  async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async checkExternalDependencies() {
    const config = getConfig();
    const dependencies = [];

    // Check Supabase
    try {
      await this.checkSupabase();
      dependencies.push({
        name: 'Supabase',
        status: 'healthy',
        url: config.supabase.url,
      });
    } catch (error) {
      dependencies.push({
        name: 'Supabase',
        status: 'unhealthy',
        error: error.message,
        url: config.supabase.url,
      });
    }

    // Check OpenAI
    if (config.openai.apiKey) {
      try {
        await this.checkOpenAI();
        dependencies.push({
          name: 'OpenAI',
          status: 'healthy',
          url: 'https://api.openai.com',
        });
      } catch (error) {
        dependencies.push({
          name: 'OpenAI',
          status: 'unhealthy',
          error: error.message,
          url: 'https://api.openai.com',
        });
      }
    } else {
      dependencies.push({
        name: 'OpenAI',
        status: 'not_configured',
        message: 'API key not provided',
      });
    }

    // Check Database
    try {
      await this.checkDatabase();
      dependencies.push({
        name: 'Database',
        status: 'healthy',
        type: 'PostgreSQL',
      });
    } catch (error) {
      dependencies.push({
        name: 'Database',
        status: 'unhealthy',
        error: error.message,
        type: 'PostgreSQL',
      });
    }

    return {
      timestamp: new Date().toISOString(),
      totalDependencies: dependencies.length,
      healthyCount: dependencies.filter(d => d.status === 'healthy').length,
      unhealthyCount: dependencies.filter(d => d.status === 'unhealthy').length,
      notConfiguredCount: dependencies.filter(d => d.status === 'not_configured').length,
      dependencies,
    };
  }
}
