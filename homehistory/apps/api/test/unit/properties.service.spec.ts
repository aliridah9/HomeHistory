import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesService } from '../../src/modules/properties/properties.service';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { GeolocationService } from '../../src/modules/properties/services/geolocation.service';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prismaService: PrismaService;
  let geolocationService: GeolocationService;

  const mockProperty = {
    id: 'test-property-id',
    userId: 'test-user-id',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    propertyType: 'SINGLE_FAMILY',
    purchasePrice: 300000,
    purchaseDate: new Date(),
    latitude: 40.7128,
    longitude: -74.0060,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockGeolocationService = {
    geocodeAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GeolocationService,
          useValue: mockGeolocationService,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prismaService = module.get<PrismaService>(PrismaService);
    geolocationService = module.get<GeolocationService>(GeolocationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    const createPropertyDto = {
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      propertyType: 'SINGLE_FAMILY' as const,
      purchasePrice: 300000,
      purchaseDate: new Date(),
    };

    it('should create a property successfully', async () => {
      const coordinates = { latitude: 40.7128, longitude: -74.0060 };
      
      mockGeolocationService.geocodeAddress.mockResolvedValue(coordinates);
      mockPrismaService.property.create.mockResolvedValue(mockProperty);

      const result = await service.createProperty('test-user-id', createPropertyDto);

      expect(mockGeolocationService.geocodeAddress).toHaveBeenCalledWith(
        `${createPropertyDto.address}, ${createPropertyDto.city}, ${createPropertyDto.state} ${createPropertyDto.zipCode}`
      );
      expect(mockPrismaService.property.create).toHaveBeenCalledWith({
        data: {
          ...createPropertyDto,
          userId: 'test-user-id',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockProperty);
    });

    it('should create property without coordinates if geocoding fails', async () => {
      mockGeolocationService.geocodeAddress.mockRejectedValue(new Error('Geocoding failed'));
      mockPrismaService.property.create.mockResolvedValue({ ...mockProperty, latitude: null, longitude: null });

      const result = await service.createProperty('test-user-id', createPropertyDto);

      expect(mockPrismaService.property.create).toHaveBeenCalledWith({
        data: {
          ...createPropertyDto,
          userId: 'test-user-id',
          latitude: null,
          longitude: null,
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('getProperties', () => {
    const queryDto = {
      page: 1,
      limit: 10,
      city: 'Test City',
      propertyType: 'SINGLE_FAMILY' as const,
    };

    it('should get properties with pagination', async () => {
      const properties = [mockProperty];
      const total = 1;

      mockPrismaService.property.findMany.mockResolvedValue(properties);
      mockPrismaService.property.count.mockResolvedValue(total);

      const result = await service.getProperties('test-user-id', queryDto);

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          city: queryDto.city,
          propertyType: queryDto.propertyType,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        properties,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should handle empty results', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      const result = await service.getProperties('test-user-id', { page: 1, limit: 10 });

      expect(result.properties).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getPropertyById', () => {
    it('should return property if user owns it', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.getPropertyById('test-user-id', 'test-property-id');

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
      });
      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.getPropertyById('test-user-id', 'non-existent-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own property', async () => {
      const otherUserProperty = { ...mockProperty, userId: 'other-user-id' };
      mockPrismaService.property.findUnique.mockResolvedValue(otherUserProperty);

      await expect(
        service.getPropertyById('test-user-id', 'test-property-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProperty', () => {
    const updateDto = {
      address: '456 Updated St',
      purchasePrice: 350000,
    };

    it('should update property successfully', async () => {
      const updatedProperty = { ...mockProperty, ...updateDto };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockGeolocationService.geocodeAddress.mockResolvedValue({
        latitude: 40.7589,
        longitude: -73.9851,
      });
      mockPrismaService.property.update.mockResolvedValue(updatedProperty);

      const result = await service.updateProperty('test-user-id', 'test-property-id', updateDto);

      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
        data: {
          ...updateDto,
          latitude: 40.7589,
          longitude: -73.9851,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(updatedProperty);
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProperty('test-user-id', 'non-existent-id', updateDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own property', async () => {
      const otherUserProperty = { ...mockProperty, userId: 'other-user-id' };
      mockPrismaService.property.findUnique.mockResolvedValue(otherUserProperty);

      await expect(
        service.updateProperty('test-user-id', 'test-property-id', updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteProperty', () => {
    it('should delete property successfully', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.delete.mockResolvedValue(mockProperty);

      await service.deleteProperty('test-user-id', 'test-property-id');

      expect(mockPrismaService.property.delete).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteProperty('test-user-id', 'non-existent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPropertyStats', () => {
    it('should return portfolio statistics', async () => {
      const statsResult = [
        {
          total_properties: 5,
          total_value: 1500000,
          avg_value: 300000,
          property_types: JSON.stringify([
            { type: 'SINGLE_FAMILY', count: 3 },
            { type: 'CONDO', count: 2 },
          ]),
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(statsResult);

      const result = await service.getPropertyStats('test-user-id');

      expect(result).toEqual({
        totalProperties: 5,
        totalValue: 1500000,
        averageValue: 300000,
        propertyTypes: [
          { type: 'SINGLE_FAMILY', count: 3 },
          { type: 'CONDO', count: 2 },
        ],
      });
    });

    it('should handle empty portfolio', async () => {
      const statsResult = [
        {
          total_properties: 0,
          total_value: null,
          avg_value: null,
          property_types: '[]',
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(statsResult);

      const result = await service.getPropertyStats('test-user-id');

      expect(result).toEqual({
        totalProperties: 0,
        totalValue: 0,
        averageValue: 0,
        propertyTypes: [],
      });
    });
  });

  describe('addToFavorites', () => {
    it('should add property to favorites', async () => {
      const updatedProperty = { ...mockProperty, isFavorite: true };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue(updatedProperty);

      const result = await service.addToFavorites('test-user-id', 'test-property-id');

      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
        data: { isFavorite: true },
      });
      expect(result).toEqual({ success: true, message: 'Property added to favorites' });
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove property from favorites', async () => {
      const favoriteProperty = { ...mockProperty, isFavorite: true };
      const updatedProperty = { ...mockProperty, isFavorite: false };

      mockPrismaService.property.findUnique.mockResolvedValue(favoriteProperty);
      mockPrismaService.property.update.mockResolvedValue(updatedProperty);

      const result = await service.removeFromFavorites('test-user-id', 'test-property-id');

      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
        data: { isFavorite: false },
      });
      expect(result).toEqual({ success: true, message: 'Property removed from favorites' });
    });
  });
});