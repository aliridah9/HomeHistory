export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';

// Re-export useful Prisma utilities
export { Prisma } from '@prisma/client';

// Create a singleton instance for the PrismaClient
import { PrismaClient as PrismaClientType } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined;
}

export const prisma = global.prisma || new PrismaClientType();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper types for better TypeScript support
export type { 
  User,
  Property,
  Report,
  RawDocument,
  DataSource,
  PropertyDataSource,
  AuditLog,
  UserRole,
  PropertyType,
  ReportStatus,
  SyncStatus
} from '@prisma/client';