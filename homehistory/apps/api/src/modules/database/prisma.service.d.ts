import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@homehistory/database';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    withRLS<T>(userId: string, operation: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=prisma.service.d.ts.map
