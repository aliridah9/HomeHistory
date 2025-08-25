"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestToken = exports.createTestReport = exports.createTestDocument = exports.createTestProperty = exports.createTestUser = exports.prisma = void 0;
// Global test setup
const client_1 = require("@prisma/client");
// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
// Global test utilities
let testPrisma;
// Setup before all tests
beforeAll(async () => {
    exports.prisma = testPrisma = new client_1.PrismaClient();
    await testPrisma.$connect();
});
// Cleanup after each test
afterEach(async () => {
    // Clean up test data in correct order (respecting foreign key constraints)
    if (testPrisma) {
        try {
            // Delete child records first
            await testPrisma.$executeRaw `DELETE FROM property_data_sources WHERE 1=1`;
            await testPrisma.$executeRaw `DELETE FROM raw_documents WHERE 1=1`;
            await testPrisma.$executeRaw `DELETE FROM reports WHERE 1=1`;
            await testPrisma.$executeRaw `DELETE FROM audit_logs WHERE 1=1`;
            // Delete parent records
            await testPrisma.$executeRaw `DELETE FROM properties WHERE 1=1`;
            await testPrisma.$executeRaw `DELETE FROM users WHERE 1=1`;
            await testPrisma.$executeRaw `DELETE FROM data_sources WHERE 1=1`;
        }
        catch (error) {
            // Ignore cleanup errors in tests (they're expected for missing tables)
        }
    }
});
// Cleanup after all tests
afterAll(async () => {
    if (testPrisma) {
        await testPrisma.$disconnect();
    }
});
// Mock external services
jest.mock('../src/modules/supabase/supabase.service', () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockReturnValue({
            auth: {
                signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
                signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
                signOut: jest.fn().mockResolvedValue({ error: null }),
                resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
            },
            storage: {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
                    download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
                    remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
                }),
            },
        }),
        getAdminClient: jest.fn().mockReturnValue({
            auth: {
                admin: {
                    createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
                    deleteUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
                    updateUserById: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
                },
            },
        }),
    })),
}));
// Mock external APIs (only if packages are available)
try {
    jest.mock('openai', () => ({
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [{ message: { content: JSON.stringify({ summary: 'Test summary' }) } }],
                    }),
                },
            },
        })),
    }));
}
catch (e) {
    // OpenAI not available, skip mock
}
try {
    jest.mock('axios', () => ({
        default: {
            get: jest.fn().mockResolvedValue({ data: {} }),
            post: jest.fn().mockResolvedValue({ data: {} }),
            put: jest.fn().mockResolvedValue({ data: {} }),
            delete: jest.fn().mockResolvedValue({ data: {} }),
        },
    }));
}
catch (e) {
    // Axios not available, skip mock
}
// Utility functions for tests
const createTestUser = async (overrides = {}) => {
    return testPrisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            role: 'USER',
            ...overrides,
        },
    });
};
exports.createTestUser = createTestUser;
const createTestProperty = async (userId, overrides = {}) => {
    return testPrisma.property.create({
        data: {
            userId,
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            propertyType: 'SINGLE_FAMILY',
            yearBuilt: 2000,
            squareFeet: 1800,
            ...overrides,
        },
    });
};
exports.createTestProperty = createTestProperty;
const createTestDocument = async (propertyId, overrides = {}) => {
    return testPrisma.rawDocument.create({
        data: {
            type: 'inspection_report',
            source: 'manual_upload',
            fileUrl: 'https://example.com/test.pdf',
            propertyId,
            status: 'pending',
            ...overrides,
        },
    });
};
exports.createTestDocument = createTestDocument;
const createTestReport = async (propertyId, overrides = {}) => {
    return testPrisma.report.create({
        data: {
            propertyId,
            summary: 'Test report summary',
            status: 'pending',
            ...overrides,
        },
    });
};
exports.createTestReport = createTestReport;
// JWT token helper for authenticated requests
const generateTestToken = (userId = 'test-user-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ sub: userId, email: 'test@example.com' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};
exports.generateTestToken = generateTestToken;
//# sourceMappingURL=setup.js.map