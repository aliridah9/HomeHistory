import { PrismaClient } from '@prisma/client';
declare let testPrisma: PrismaClient;
export { testPrisma as prisma };
export declare const createTestUser: (overrides?: any) => Promise<{
    name: string | null;
    email: string;
    id: string;
    avatarUrl: string | null;
    role: import("@prisma/client").$Enums.UserRole;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const createTestProperty: (userId: string, overrides?: any) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    latitude: number | null;
    longitude: number | null;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    yearBuilt: number | null;
    squareFeet: number | null;
    lotSize: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    propertyType: import("@prisma/client").$Enums.PropertyType | null;
}>;
export declare const createTestDocument: (propertyId: string, overrides?: any) => Promise<{
    type: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ReportStatus;
    propertyId: string | null;
    source: string;
    fileUrl: string;
    extractedText: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare const createTestReport: (propertyId: string, overrides?: any) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    summary: string;
    status: import("@prisma/client").$Enums.ReportStatus;
    propertyId: string;
    incidentsJson: import("@prisma/client/runtime/library").JsonValue | null;
    insuranceJson: import("@prisma/client/runtime/library").JsonValue | null;
    aiInsights: import("@prisma/client/runtime/library").JsonValue | null;
    publishedAt: Date | null;
}>;
export declare const generateTestToken: (userId?: string) => any;
//# sourceMappingURL=setup.d.ts.map