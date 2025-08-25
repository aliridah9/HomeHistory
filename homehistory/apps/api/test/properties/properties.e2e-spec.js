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
const setup_1 = require("../setup");
describe('PropertiesController (e2e)', () => {
    let app;
    let prisma;
    let accessToken;
    let userId;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = app.get(prisma_service_1.PrismaService);
        await app.init();
        // Create test user and get token
        const user = await (0, setup_1.createTestUser)();
        userId = user.id;
        accessToken = (0, setup_1.generateTestToken)(userId);
    });
    afterEach(async () => {
        await prisma.property.deleteMany();
        await prisma.user.deleteMany();
        await app.close();
    });
    describe('/properties (POST)', () => {
        it('should create a new property', async () => {
            const createPropertyDto = {
                address: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                propertyType: 'SINGLE_FAMILY',
                purchasePrice: 300000,
                purchaseDate: '2023-01-01T00:00:00.000Z',
            };
            const response = await request(app.getHttpServer())
                .post('/api/properties')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createPropertyDto)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.address).toBe(createPropertyDto.address);
            expect(response.body.data.userId).toBe(userId);
        });
        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/properties')
                .send({
                address: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
            })
                .expect(401);
        });
        it('should validate required fields', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/properties')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                address: '123 Test Street',
                // Missing required fields
            })
                .expect(400);
            expect(response.body.message).toContain('Validation failed');
        });
    });
    describe('/properties (GET)', () => {
        beforeEach(async () => {
            // Create test properties
            await (0, setup_1.createTestProperty)(userId);
            await prisma.property.create({
                data: {
                    id: 'test-property-2',
                    userId,
                    address: '456 Another St',
                    city: 'Another City',
                    state: 'AC',
                    zipCode: '54321',
                    propertyType: 'CONDO',
                    purchasePrice: 250000,
                    purchaseDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        });
        it('should get user properties with pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/properties?page=1&limit=10')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.properties).toHaveLength(2);
            expect(response.body.data.pagination).toHaveProperty('total', 2);
            expect(response.body.data.pagination).toHaveProperty('page', 1);
        });
        it('should filter properties by city', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/properties?city=Test City')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.properties).toHaveLength(1);
            expect(response.body.data.properties[0].city).toBe('Test City');
        });
        it('should filter properties by property type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/properties?propertyType=CONDO')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.properties).toHaveLength(1);
            expect(response.body.data.properties[0].propertyType).toBe('CONDO');
        });
    });
    describe('/properties/:id (GET)', () => {
        let propertyId;
        beforeEach(async () => {
            const property = await (0, setup_1.createTestProperty)(userId);
            propertyId = property.id;
        });
        it('should get property by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/properties/${propertyId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(propertyId);
            expect(response.body.data.address).toBe('123 Test St');
        });
        it('should return 404 for non-existent property', async () => {
            await request(app.getHttpServer())
                .get('/api/properties/non-existent-id')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
        it('should return 403 for property owned by another user', async () => {
            // Create another user's property
            const anotherUser = await prisma.user.create({
                data: {
                    id: 'another-user-id',
                    email: 'another@example.com',
                    firstName: 'Another',
                    lastName: 'User',
                    role: 'USER',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            const anotherProperty = await prisma.property.create({
                data: {
                    id: 'another-property-id',
                    userId: anotherUser.id,
                    address: '789 Another St',
                    city: 'Another City',
                    state: 'AC',
                    zipCode: '99999',
                    propertyType: 'SINGLE_FAMILY',
                    purchasePrice: 400000,
                    purchaseDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            await request(app.getHttpServer())
                .get(`/api/properties/${anotherProperty.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(403);
        });
    });
    describe('/properties/:id (PUT)', () => {
        let propertyId;
        beforeEach(async () => {
            const property = await (0, setup_1.createTestProperty)(userId);
            propertyId = property.id;
        });
        it('should update property', async () => {
            const updateDto = {
                address: '456 Updated Street',
                purchasePrice: 350000,
            };
            const response = await request(app.getHttpServer())
                .put(`/api/properties/${propertyId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateDto)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.address).toBe(updateDto.address);
            expect(response.body.data.purchasePrice).toBe(updateDto.purchasePrice);
        });
        it('should return 404 for non-existent property', async () => {
            await request(app.getHttpServer())
                .put('/api/properties/non-existent-id')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ address: 'Updated Address' })
                .expect(404);
        });
    });
    describe('/properties/:id (DELETE)', () => {
        let propertyId;
        beforeEach(async () => {
            const property = await (0, setup_1.createTestProperty)(userId);
            propertyId = property.id;
        });
        it('should delete property', async () => {
            await request(app.getHttpServer())
                .delete(`/api/properties/${propertyId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
            // Verify property is deleted
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
            });
            expect(property).toBeNull();
        });
        it('should return 404 for non-existent property', async () => {
            await request(app.getHttpServer())
                .delete('/api/properties/non-existent-id')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
    describe('/properties/stats (GET)', () => {
        beforeEach(async () => {
            // Create multiple properties for stats
            await (0, setup_1.createTestProperty)(userId);
            await prisma.property.create({
                data: {
                    id: 'test-property-2',
                    userId,
                    address: '456 Another St',
                    city: 'Another City',
                    state: 'AC',
                    zipCode: '54321',
                    propertyType: 'CONDO',
                    purchasePrice: 250000,
                    purchaseDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        });
        it('should get portfolio statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/properties/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalProperties', 2);
            expect(response.body.data).toHaveProperty('totalValue', 550000);
            expect(response.body.data).toHaveProperty('averageValue', 275000);
            expect(response.body.data).toHaveProperty('propertyTypes');
        });
    });
});
//# sourceMappingURL=properties.e2e-spec.js.map