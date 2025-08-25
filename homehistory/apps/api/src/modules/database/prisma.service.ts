import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@homehistory/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to execute queries with Supabase RLS context
  async withRLS<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    // Set the Supabase auth context for RLS
    await this.$executeRaw`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', TRUE)`;
    
    try {
      return await operation();
    } finally {
      // Reset the context
      await this.$executeRaw`SELECT set_config('request.jwt.claims', NULL, TRUE)`;
    }
  }
}
