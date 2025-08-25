export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';
export { Prisma } from '@prisma/client';
import { PrismaClient as PrismaClientType } from '@prisma/client';
declare global {
    var prisma: PrismaClientType | undefined;
}
export declare const prisma: PrismaClientType<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export type { User, Property, Report, RawDocument, DataSource, PropertyDataSource, AuditLog, UserRole, PropertyType, ReportStatus, SyncStatus } from '@prisma/client';
//# sourceMappingURL=index.d.ts.map