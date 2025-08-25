"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = __importStar(require("supertest"));
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/modules/database/prisma.service");
describe('AuthController (e2e)', () => {
    let app;
    let prisma;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = app.get(prisma_service_1.PrismaService);
        await app.init();
    });
    afterEach(async () => {
        // Clean up test data
        await prisma.user.deleteMany();
        await app.close();
    });
    describe('/auth/register (POST)', () => {
        it('should register a new user', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            };
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerDto)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user).toHaveProperty('email', registerDto.email);
            expect(response.body.data.user).not.toHaveProperty('password');
        });
        it('should return 409 for duplicate email', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            };
            // First registration
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerDto)
                .expect(201);
            // Second registration with same email
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerDto)
                .expect(409);
        });
        it('should validate required fields', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                email: 'invalid-email',
                password: '123', // too short
            })
                .expect(400);
            expect(response.body.message).toContain('Validation failed');
        });
    });
    describe('/auth/login (POST)', () => {
        beforeEach(async () => {
            // Create test user
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            });
        });
        it('should login with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
        });
        it('should return 401 for invalid credentials', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            })
                .expect(401);
        });
        it('should return 404 for non-existent user', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123',
            })
                .expect(404);
        });
    });
    describe('/auth/me (GET)', () => {
        let accessToken;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            });
            accessToken = response.body.data.accessToken;
        });
        it('should return current user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email', 'test@example.com');
            expect(response.body.data).toHaveProperty('firstName', 'Test');
            expect(response.body.data).not.toHaveProperty('password');
        });
        it('should return 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });
        it('should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
    describe('/auth/refresh (POST)', () => {
        let refreshToken;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            });
            refreshToken = response.body.data.refreshToken;
        });
        it('should refresh access token', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });
        it('should return 401 with invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
        });
    });
    describe('/auth/forgot-password (POST)', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            });
        });
        it('should send password reset email', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('Password reset email sent');
        });
        it('should return success even for non-existent email (security)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);
            expect(response.body.success).toBe(true);
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map