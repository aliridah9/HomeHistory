import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { generateTestToken, createTestUser, createTestProperty } from '../setup';

describe('PropertiesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test user and get token
    const user = await createTestUser();
    userId = user.id;
    accessToken = generateTestToken(userId);
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
      await createTestProperty(userId);
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
    let propertyId: string;

    beforeEach(async () => {
      const property = await createTestProperty(userId);
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
    let propertyId: string;

    beforeEach(async () => {
      const property = await createTestProperty(userId);
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
    let propertyId: string;

    beforeEach(async () => {
      const property = await createTestProperty(userId);
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
      await createTestProperty(userId);
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