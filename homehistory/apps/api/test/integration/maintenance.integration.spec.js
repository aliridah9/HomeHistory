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
describe('Maintenance Integration Tests', () => {
    let app;
    let prisma;
    let accessToken;
    let userId;
    let propertyId;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = app.get(prisma_service_1.PrismaService);
        await app.init();
        // Create test user and property
        const user = await (0, setup_1.createTestUser)();
        userId = user.id;
        const property = await (0, setup_1.createTestProperty)(userId);
        propertyId = property.id;
        accessToken = (0, setup_1.generateTestToken)(userId);
    });
    afterEach(async () => {
        // Clean up in reverse dependency order
        await prisma.$queryRaw `DELETE FROM maintenance_records WHERE property_id = ${propertyId}`;
        await prisma.property.deleteMany();
        await prisma.user.deleteMany();
        await app.close();
    });
    describe('Maintenance CRUD Operations', () => {
        it('should create, read, update, and delete maintenance record', async () => {
            // CREATE
            const createDto = {
                propertyId,
                title: 'HVAC Maintenance',
                description: 'Annual HVAC system maintenance',
                maintenanceType: 'hvac',
                priority: 'MEDIUM',
                scheduledDate: new Date('2024-06-01'),
                estimatedCost: 200,
            };
            const createResponse = await request(app.getHttpServer())
                .post('/api/maintenance')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createDto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.title).toBe(createDto.title);
            expect(createResponse.body.data.propertyId).toBe(propertyId);
            const maintenanceId = createResponse.body.data.id;
            // READ
            const readResponse = await request(app.getHttpServer())
                .get(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(readResponse.body.data.id).toBe(maintenanceId);
            expect(readResponse.body.data.title).toBe(createDto.title);
            // UPDATE
            const updateDto = {
                title: 'Updated HVAC Maintenance',
                actualCost: 250,
                status: 'COMPLETED',
            };
            const updateResponse = await request(app.getHttpServer())
                .put(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateDto)
                .expect(200);
            expect(updateResponse.body.data.title).toBe(updateDto.title);
            expect(updateResponse.body.data.actualCost).toBe(updateDto.actualCost);
            expect(updateResponse.body.data.status).toBe(updateDto.status);
            // DELETE
            await request(app.getHttpServer())
                .delete(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
            // Verify deletion
            await request(app.getHttpServer())
                .get(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
    describe('Maintenance Filtering and Pagination', () => {
        beforeEach(async () => {
            // Create multiple maintenance records for testing
            const maintenanceRecords = [
                {
                    propertyId,
                    title: 'Plumbing Repair',
                    maintenanceType: 'plumbing',
                    priority: 'HIGH',
                    status: 'COMPLETED',
                    scheduledDate: new Date('2024-01-15'),
                    actualCost: 150,
                },
                {
                    propertyId,
                    title: 'Electrical Inspection',
                    maintenanceType: 'electrical',
                    priority: 'MEDIUM',
                    status: 'SCHEDULED',
                    scheduledDate: new Date('2024-03-20'),
                    estimatedCost: 100,
                },
                {
                    propertyId,
                    title: 'Garden Maintenance',
                    maintenanceType: 'landscaping',
                    priority: 'LOW',
                    status: 'IN_PROGRESS',
                    scheduledDate: new Date('2024-02-10'),
                    estimatedCost: 75,
                },
            ];
            for (const record of maintenanceRecords) {
                await request(app.getHttpServer())
                    .post('/api/maintenance')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(record);
            }
        });
        it('should filter maintenance by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance?status=COMPLETED')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.maintenance).toHaveLength(1);
            expect(response.body.data.maintenance[0].status).toBe('COMPLETED');
            expect(response.body.data.maintenance[0].title).toBe('Plumbing Repair');
        });
        it('should filter maintenance by type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance?maintenanceType=electrical')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.maintenance).toHaveLength(1);
            expect(response.body.data.maintenance[0].maintenanceType).toBe('electrical');
        });
        it('should filter maintenance by priority', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance?priority=HIGH')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.maintenance).toHaveLength(1);
            expect(response.body.data.maintenance[0].priority).toBe('HIGH');
        });
        it('should paginate maintenance results', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance?page=1&limit=2')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.maintenance).toHaveLength(2);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
            expect(response.body.data.pagination.total).toBe(3);
            expect(response.body.data.pagination.totalPages).toBe(2);
        });
        it('should sort maintenance by scheduled date', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance?sortBy=scheduledDate&sortOrder=asc')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            const maintenance = response.body.data.maintenance;
            expect(maintenance).toHaveLength(3);
            // Should be sorted by scheduledDate ascending
            expect(new Date(maintenance[0].scheduledDate)).toEqual(new Date('2024-01-15'));
            expect(new Date(maintenance[1].scheduledDate)).toEqual(new Date('2024-02-10'));
            expect(new Date(maintenance[2].scheduledDate)).toEqual(new Date('2024-03-20'));
        });
    });
    describe('Maintenance Statistics', () => {
        beforeEach(async () => {
            // Create maintenance records with different statuses and costs
            const records = [
                { status: 'COMPLETED', actualCost: 200 },
                { status: 'COMPLETED', actualCost: 150 },
                { status: 'SCHEDULED', estimatedCost: 100 },
                { status: 'IN_PROGRESS', estimatedCost: 75 },
                { status: 'OVERDUE', estimatedCost: 300 },
            ];
            for (const record of records) {
                await request(app.getHttpServer())
                    .post('/api/maintenance')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                    propertyId,
                    title: `Test Maintenance - ${record.status}`,
                    maintenanceType: 'general',
                    priority: 'MEDIUM',
                    scheduledDate: new Date(),
                    ...record,
                });
            }
        });
        it('should return comprehensive maintenance statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            const stats = response.body.data;
            expect(stats.totalRecords).toBe(5);
            expect(stats.completed).toBe(2);
            expect(stats.scheduled).toBe(1);
            expect(stats.inProgress).toBe(1);
            expect(stats.overdue).toBe(1);
            expect(stats.totalSpent).toBe(350); // 200 + 150
            expect(stats.averageCost).toBe(175); // (200 + 150) / 2
        });
    });
    describe('Upcoming and Overdue Maintenance', () => {
        beforeEach(async () => {
            const now = new Date();
            const upcoming = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            const overdue = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            // Create upcoming maintenance
            await request(app.getHttpServer())
                .post('/api/maintenance')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                propertyId,
                title: 'Upcoming Maintenance',
                maintenanceType: 'general',
                status: 'SCHEDULED',
                scheduledDate: upcoming,
            });
            // Create overdue maintenance
            await request(app.getHttpServer())
                .post('/api/maintenance')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                propertyId,
                title: 'Overdue Maintenance',
                maintenanceType: 'urgent',
                status: 'SCHEDULED',
                scheduledDate: overdue,
            });
        });
        it('should return upcoming maintenance', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance/upcoming')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.upcoming).toHaveLength(1);
            expect(response.body.data.upcoming[0].title).toBe('Upcoming Maintenance');
        });
        it('should return overdue maintenance', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/maintenance/overdue')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(response.body.data.overdue).toHaveLength(1);
            expect(response.body.data.overdue[0].title).toBe('Overdue Maintenance');
        });
    });
    describe('Maintenance Actions', () => {
        let maintenanceId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/api/maintenance')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                propertyId,
                title: 'Test Maintenance Action',
                maintenanceType: 'general',
                status: 'SCHEDULED',
                scheduledDate: new Date(),
            });
            maintenanceId = response.body.data.id;
        });
        it('should complete maintenance task', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/maintenance/${maintenanceId}/complete`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                cost: 175,
                notes: 'Task completed successfully',
                completedBy: 'John Doe',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('completed');
            // Verify the maintenance was updated
            const getResponse = await request(app.getHttpServer())
                .get(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(getResponse.body.data.status).toBe('COMPLETED');
            expect(getResponse.body.data.actualCost).toBe(175);
        });
        it('should schedule maintenance task', async () => {
            const newScheduledDate = new Date('2024-12-15');
            const response = await request(app.getHttpServer())
                .post(`/api/maintenance/${maintenanceId}/schedule`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                scheduledDate: newScheduledDate,
                notes: 'Rescheduled due to weather',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            // Verify the maintenance was updated
            const getResponse = await request(app.getHttpServer())
                .get(`/api/maintenance/${maintenanceId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            expect(new Date(getResponse.body.data.scheduledDate)).toEqual(newScheduledDate);
            expect(getResponse.body.data.status).toBe('SCHEDULED');
        });
    });
    describe('Bulk Operations', () => {
        it('should bulk schedule maintenance for multiple properties', async () => {
            // Create additional property
            const property2 = await (0, setup_1.createTestProperty)(userId);
            const response = await request(app.getHttpServer())
                .post('/api/maintenance/bulk-schedule')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                propertyIds: [propertyId, property2.id],
                maintenanceType: 'inspection',
                frequency: 'annually',
                startDate: new Date('2024-07-01'),
            })
                .expect(200);
            expect(response.body.data.scheduled).toBe(2);
            expect(response.body.data.maintenanceRecords).toHaveLength(2);
            // Verify both properties have maintenance scheduled
            for (const record of response.body.data.maintenanceRecords) {
                expect([propertyId, property2.id]).toContain(record.propertyId);
                expect(record.maintenanceType).toBe('inspection');
                expect(record.recurringFrequency).toBe('annually');
            }
        });
    });
});
//# sourceMappingURL=maintenance.integration.spec.js.map