import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto';

export interface PropertyIngestionResult {
  success: boolean;
  propertyId: string;
  message: string;
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  price?: number;
  description?: string;
  features?: string[];
  images?: string[];
  documents?: string[];
}

export interface PropertyProcessingOptions {
  validateAddress?: boolean;
  geocodeLocation?: boolean;
  enrichData?: boolean;
  generateReport?: boolean;
  notifyUser?: boolean;
}

@Injectable()
export class PropertyIngestionService {
  private readonly logger = new Logger(PropertyIngestionService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async ingestProperty(
    propertyData: PropertyData,
    userId: string,
    options: PropertyProcessingOptions = {},
  ): Promise<PropertyIngestionResult> {
    try {
      this.logger.log(`Starting property ingestion for address: ${propertyData.address}`);

      // Validate required fields
      if (!this.validatePropertyData(propertyData)) {
        throw new BadRequestException('Invalid property data provided');
      }

      // Check if property already exists
      const existingProperty = await this.findExistingProperty(propertyData);
      if (existingProperty) {
        return {
          success: true,
          propertyId: existingProperty.id,
          message: 'Property already exists',
          metadata: { existing: true },
        };
      }

      // Process property data
      const processedData = await this.processPropertyData(propertyData, options);

      // Create property record
      const property = await this.prisma.property.create({
        data: {
          address: processedData.address,
          city: processedData.city,
          state: processedData.state,
          zipCode: processedData.zipCode,
          propertyType: (processedData.propertyType || 'SINGLE_FAMILY') as any,
          bedrooms: processedData.bedrooms || 0,
          bathrooms: processedData.bathrooms || 0,
          squareFeet: processedData.squareFeet || 0,
          yearBuilt: processedData.yearBuilt || 0,
          // description: processedData.description, // Property model doesn't have description field
          // features: processedData.features as any, // Property model doesn't have features field
          // images field not in Property model
          // images: processedData.images as any,
          metadata: processedData.metadata as any,
          user: { connect: { id: userId } },
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'property_created',
          entityType: 'property',
          entityId: property.id,
          metadata: {
            source: 'ingestion',
            processingOptions: options,
          } as any,
        },
      });

      // Send notification if requested
      if (options.notifyUser) {
        await this.notificationsService.createNotification({
          userId,
          type: NotificationType.PROPERTY_UPDATE,
          title: 'Property Added',
          message: `Property at ${property.address} has been successfully added to your portfolio`,
          entityId: property.id,
          entityType: 'property',
          metadata: {
            address: property.address,
            city: property.city,
            state: property.state,
          },
        });
      }

      return {
        success: true,
        propertyId: property.id,
        message: 'Property ingested successfully',
        metadata: {
          address: property.address,
          city: property.city,
          state: property.state,
          processingResults: processedData.metadata,
        },
      };

    } catch (error) {
      this.logger.error(`Property ingestion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async bulkIngestProperties(
    properties: PropertyData[],
    userId: string,
    options: PropertyProcessingOptions = {},
  ): Promise<PropertyIngestionResult[]> {
    this.logger.log(`Starting bulk property ingestion for ${properties.length} properties`);

    const results: PropertyIngestionResult[] = [];

    for (const propertyData of properties) {
      try {
        const result = await this.ingestProperty(propertyData, userId, options);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to ingest property ${propertyData.address}: ${error.message}`);
        results.push({
          success: false,
          propertyId: '',
          message: `Failed to ingest property: ${error.message}`,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  async updateProperty(
    propertyId: string,
    propertyData: Partial<PropertyData>,
    userId: string,
    options: PropertyProcessingOptions = {},
  ): Promise<PropertyIngestionResult> {
    try {
      this.logger.log(`Updating property: ${propertyId}`);

      // Check if property exists
      const existingProperty = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!existingProperty) {
        throw new BadRequestException('Property not found');
      }

      // Process updated data
      const processedData = await this.processPropertyData(propertyData, options);

      // Update property
      const updatedProperty = await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          ...(processedData.address && { address: processedData.address }),
          ...(processedData.city && { city: processedData.city }),
          ...(processedData.state && { state: processedData.state }),
          ...(processedData.zipCode && { zipCode: processedData.zipCode }),
          ...(processedData.propertyType && { propertyType: processedData.propertyType as any }),
          ...(processedData.bedrooms !== undefined && { bedrooms: processedData.bedrooms }),
          ...(processedData.bathrooms !== undefined && { bathrooms: processedData.bathrooms }),
          ...(processedData.squareFeet !== undefined && { squareFeet: processedData.squareFeet }),
          ...(processedData.yearBuilt !== undefined && { yearBuilt: processedData.yearBuilt }),
          // ...(processedData.description && { description: processedData.description }),
          // ...(processedData.features && { features: processedData.features as any }),
          // ...(processedData.images && { images: processedData.images as any }),
          ...(processedData.metadata && { metadata: processedData.metadata as any }),
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'property_updated',
          entityType: 'property',
          entityId: propertyId,
          metadata: {
            changes: propertyData,
            processingOptions: options,
          } as any,
        },
      });

      return {
        success: true,
        propertyId: updatedProperty.id,
        message: 'Property updated successfully',
        metadata: {
          address: updatedProperty.address,
          changes: Object.keys(propertyData),
        },
      };

    } catch (error) {
      this.logger.error(`Property update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validatePropertyData(data: PropertyData): boolean {
    return !!(data.address && data.city && data.state && data.zipCode);
  }

  private async findExistingProperty(data: PropertyData) {
    return this.prisma.property.findFirst({
      where: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      },
    });
  }

  private async processPropertyData(
    data: Partial<PropertyData>,
    options: PropertyProcessingOptions,
  ): Promise<PropertyData & { metadata?: Record<string, any> }> {
    const processedData = { ...data } as PropertyData;
    const metadata: Record<string, any> = {};

    // Validate address if requested
    if (options.validateAddress) {
      try {
        const validation = await this.validateAddress(data.address ?? '', data.city ?? '', data.state ?? '', data.zipCode ?? '');
        metadata.addressValidation = validation;
        if (!validation.isValid) {
          throw new Error(`Address validation failed: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        metadata.addressValidationError = error.message;
      }
    }

    // Geocode location if requested
    if (options.geocodeLocation) {
      try {
        const geocoding = await this.geocodeAddress(data.address ?? '', data.city ?? '', data.state ?? '', data.zipCode ?? '');
        metadata.geocoding = geocoding;
        if (geocoding.coordinates) {
          // processedData.metadata = {
          //   ...processedData.metadata,
          //   latitude: geocoding.coordinates.lat,
          //   longitude: geocoding.coordinates.lng,
          // };
        }
      } catch (error) {
        metadata.geocodingError = error.message;
      }
    }

    // Enrich data if requested
    if (options.enrichData) {
      try {
        const enrichment = await this.enrichPropertyData(data as PropertyData);
        metadata.enrichment = enrichment;
        Object.assign(processedData, enrichment);
      } catch (error) {
        metadata.enrichmentError = error.message;
      }
    }

    // Generate report if requested
    if (options.generateReport) {
      try {
        const report = await this.generatePropertyReport(data as PropertyData);
        metadata.report = report;
      } catch (error) {
        metadata.reportError = error.message;
      }
    }

    return {
      ...processedData,
      metadata: {
        processing: metadata,
      },
    };
  }

  private async validateAddress(
    address: string,
    city: string,
    state: string,
    zipCode: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    // Mock implementation - in production, this would use a real address validation service
    this.logger.log(`Validating address: ${address}, ${city}, ${state} ${zipCode}`);
    
    const errors: string[] = [];
    
    if (!address || address.length < 5) {
      errors.push('Address is too short');
    }
    
    if (!city || city.length < 2) {
      errors.push('City is too short');
    }
    
    if (!state || state.length !== 2) {
      errors.push('State must be 2 characters');
    }
    
    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      errors.push('Invalid ZIP code format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zipCode: string,
  ): Promise<{ coordinates?: { lat: number; lng: number }; accuracy?: string }> {
    // Mock implementation - in production, this would use Google Maps or similar
    this.logger.log(`Geocoding address: ${address}, ${city}, ${state} ${zipCode}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      coordinates: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Mock coordinates around NYC
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      },
      accuracy: 'high',
    };
  }

  private async enrichPropertyData(data: PropertyData): Promise<Partial<PropertyData>> {
    // Mock implementation - in production, this would fetch additional data from APIs
    this.logger.log('Enriching property data');
    
    return {
      description: data.description || `Beautiful ${data.propertyType || 'home'} in ${data.city}, ${data.state}`,
      features: data.features || ['Central Air', 'Garage', 'Updated Kitchen'],
      yearBuilt: data.yearBuilt || 2000 + Math.floor(Math.random() * 20),
    };
  }

  private async generatePropertyReport(data: PropertyData): Promise<Record<string, any>> {
    // Mock implementation - in production, this would generate a comprehensive property report
    this.logger.log('Generating property report');
    
    return {
      marketValue: data.price ? data.price * (0.9 + Math.random() * 0.2) : 0,
      propertyTax: data.price ? data.price * 0.015 : 0,
      insuranceEstimate: data.price ? data.price * 0.005 : 0,
      rentalPotential: data.price ? data.price * 0.008 : 0,
      marketTrend: 'stable',
      neighborhoodScore: 7 + Math.random() * 3,
    };
  }
}
