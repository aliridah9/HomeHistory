import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GeolocationService } from './services/geolocation.service';
import { Prisma } from '@prisma/client';
import { 
  CreatePropertyDto, 
  UpdatePropertyDto, 
  PropertyResponseDto, 
  PropertiesQueryDto,
  PropertyStatsDto 
} from './dto';
import { Property, PropertyType } from '@homehistory/database';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private geolocationService: GeolocationService,
  ) {}

  async createProperty(userId: string, dto: CreatePropertyDto): Promise<PropertyResponseDto> {
    // Geocode address if coordinates not provided
    let latitude = dto.latitude;
    let longitude = dto.longitude;

    if (!latitude || !longitude) {
      const coordinates = await this.geolocationService.geocodeAddress(
        `${dto.address}, ${dto.city}, ${dto.state} ${dto.zipCode}`
      );
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
    }

    // Create property
    const property = await this.prisma.property.create({
      data: {
        userId,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country || 'US',
        latitude,
        longitude,
        yearBuilt: dto.yearBuilt,
        squareFeet: dto.squareFeet,
        lotSize: dto.lotSize,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        propertyType: dto.propertyType,
      },
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            rawDocuments: true,
            reports: true,
          },
        },
      },
    });

    // Log property creation
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'property_created',
        entityType: 'property',
        entityId: property.id,
        metadata: {
          address: property.address,
          city: property.city,
          state: property.state,
        },
      },
    });

    return this.formatPropertyResponse(property);
  }

  async getProperties(userId: string, query: PropertiesQueryDto) {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      city, 
      state, 
      propertyType, 
      minYear, 
      maxYear,
      minSquareFeet,
      maxSquareFeet,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeArchived = false 
    } = query;

    const skip = (page - 1) * limit;
    const whereClause: any = {
      userId,
    };

    // Add filters
    if (search) {
      whereClause.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      whereClause.state = state;
    }

    if (propertyType) {
      whereClause.propertyType = propertyType;
    }

    if (minYear || maxYear) {
      whereClause.yearBuilt = {
        ...(minYear && { gte: minYear }),
        ...(maxYear && { lte: maxYear }),
      };
    }

    if (minSquareFeet || maxSquareFeet) {
      whereClause.squareFeet = {
        ...(minSquareFeet && { gte: minSquareFeet }),
        ...(maxSquareFeet && { lte: maxSquareFeet }),
      };
    }

    // Execute query
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where: whereClause,
        include: {
          reports: {
            where: { status: 'published' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              rawDocuments: true,
              reports: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where: whereClause }),
    ]);

    return {
      properties: properties.map(p => this.formatPropertyResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        city,
        state,
        propertyType,
        minYear,
        maxYear,
        minSquareFeet,
        maxSquareFeet,
      },
    };
  }

  async getProperty(userId: string, propertyId: string): Promise<PropertyResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        rawDocuments: {
          where: { status: 'verified' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            rawDocuments: true,
            reports: true,
          },
        },
      },
    });

    if (!property || property.userId !== userId) {
      throw new NotFoundException('Property not found');
    }

    return this.formatPropertyResponse(property);
  }

  async updateProperty(userId: string, propertyId: string, dto: UpdatePropertyDto): Promise<PropertyResponseDto> {
    const existingProperty = await this.verifyPropertyOwnership(propertyId, userId);

    // Geocode address if it changed and coordinates not provided
    let latitude = dto.latitude ?? existingProperty.latitude;
    let longitude = dto.longitude ?? existingProperty.longitude;

    const addressChanged = 
      dto.address !== existingProperty.address ||
      dto.city !== existingProperty.city ||
      dto.state !== existingProperty.state ||
      dto.zipCode !== existingProperty.zipCode;

    if (addressChanged && (!dto.latitude || !dto.longitude)) {
      const coordinates = await this.geolocationService.geocodeAddress(
        `${dto.address || existingProperty.address}, ${dto.city || existingProperty.city}, ${dto.state || existingProperty.state} ${dto.zipCode || existingProperty.zipCode}`
      );
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
    }

    // Update property
    const property = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        ...(dto.zipCode && { zipCode: dto.zipCode }),
        ...(dto.country && { country: dto.country }),
        latitude,
        longitude,
        ...(dto.yearBuilt !== undefined && { yearBuilt: dto.yearBuilt }),
        ...(dto.squareFeet !== undefined && { squareFeet: dto.squareFeet }),
        ...(dto.lotSize !== undefined && { lotSize: dto.lotSize }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.propertyType && { propertyType: dto.propertyType }),
      },
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            rawDocuments: true,
            reports: true,
          },
        },
      },
    });

    // Log property update
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'property_updated',
        entityType: 'property',
        entityId: propertyId,
        metadata: {
          changes: dto as any,
          addressChanged,
        } as any,
      },
    });

    return this.formatPropertyResponse(property);
  }

  async deleteProperty(userId: string, propertyId: string): Promise<void> {
    await this.verifyPropertyOwnership(propertyId, userId);

    // Soft delete by archiving (in production, you might want to keep data for audit purposes)
    await this.prisma.property.delete({
      where: { id: propertyId },
    });

    // Log property deletion
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'property_deleted',
        entityType: 'property',
        entityId: propertyId,
        metadata: {
          deletedAt: new Date(),
        },
      },
    });
  }

  async getPropertyStats(userId: string): Promise<PropertyStatsDto> {
    const [
      totalProperties,
      propertiesByType,
      propertiesByState,
      avgSquareFeet,
      totalValue,
      recentActivity,
    ] = await Promise.all([
      // Total properties count
      this.prisma.property.count({ where: { userId } }),

      // Properties by type
      this.prisma.property.groupBy({
        by: ['propertyType'],
        where: { userId },
        _count: { propertyType: true },
      }),

      // Properties by state
      this.prisma.property.groupBy({
        by: ['state'],
        where: { userId },
        _count: { state: true },
      }),

      // Average square feet
      this.prisma.property.aggregate({
        where: { userId },
        _avg: { squareFeet: true },
      }),

      // Estimated total value (from latest reports)
      this.calculateTotalPortfolioValue(userId),

      // Recent activity count (last 30 days)
      this.prisma.auditLog.count({
        where: {
          userId,
          entityType: 'property',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalProperties,
      propertiesByType: propertiesByType.map(item => ({
        type: item.propertyType || 'Unknown',
        count: item._count.propertyType,
      })),
      propertiesByState: propertiesByState.map(item => ({
        state: item.state,
        count: item._count.state,
      })),
      averageSquareFeet: Math.round(avgSquareFeet._avg.squareFeet || 0),
      estimatedTotalValue: totalValue,
      recentActivityCount: recentActivity,
    };
  }

  async toggleFavorite(userId: string, propertyId: string, isFavorite: boolean) {
    await this.verifyPropertyOwnership(propertyId, userId);

    // For now, we'll track favorites in audit logs
    // In production, you might want a separate favorites table
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: isFavorite ? 'property_favorited' : 'property_unfavorited',
        entityType: 'property',
        entityId: propertyId,
        metadata: {
          isFavorite,
          timestamp: new Date(),
        },
      },
    });

    return { success: true, isFavorite };
  }

  async getPropertyTimeline(userId: string, propertyId: string) {
    await this.verifyPropertyOwnership(propertyId, userId);

    // Get all activity for this property
    const [auditLogs, documents, reports] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          entityType: 'property',
          entityId: propertyId,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      this.prisma.rawDocument.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      this.prisma.report.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Combine and sort timeline events
    const timeline = [
      ...auditLogs.map(log => ({
        type: 'audit',
        date: log.createdAt,
        action: log.action,
        details: log.metadata,
      })),
      ...documents.map(doc => ({
        type: 'document',
        date: doc.createdAt,
        action: 'document_added',
        details: {
          documentType: doc.type,
          source: doc.source,
          status: doc.status,
        },
      })),
      ...reports.map(report => ({
        type: 'report',
        date: report.createdAt,
        action: 'report_generated',
        details: {
          status: report.status,
          publishedAt: report.publishedAt,
        },
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return { timeline };
  }

  async generateShareLink(userId: string, propertyId: string, options: any) {
    await this.verifyPropertyOwnership(propertyId, userId);

    // Generate a secure share token
    const shareToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + (options.expiresIn || 7 * 24 * 60 * 60 * 1000)); // 7 days default

    // Store share link in database (you'd create a shares table for this)
    const shareLink = `${process.env.FRONTEND_URL}/shared/property/${shareToken}`;

    // Log share creation
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'property_shared',
        entityType: 'property',
        entityId: propertyId,
        metadata: {
          shareToken,
          expiresAt,
          permissions: options.permissions || ['view'],
        },
      },
    });

    return {
      shareLink,
      shareToken,
      expiresAt,
      permissions: options.permissions || ['view'],
    };
  }

  async importProperties(userId: string, source: string, data: any) {
    // This would handle importing from various sources (CSV, Zillow, etc.)
    // For now, return a placeholder
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'properties_import_initiated',
        entityType: 'property',
        entityId: 'bulk',
        metadata: {
          source,
          recordCount: Array.isArray(data) ? data.length : 1,
        },
      },
    });

    return {
      message: 'Import initiated',
      source,
      estimatedProcessingTime: '5-10 minutes',
    };
  }

  async exportProperties(userId: string, format: string, propertyIds?: string[]) {
    const whereClause: any = { userId };
    if (propertyIds?.length) {
      whereClause.id = { in: propertyIds };
    }

    const properties = await this.prisma.property.findMany({
      where: whereClause,
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Log export
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'properties_exported',
        entityType: 'property',
        entityId: 'bulk',
        metadata: {
          format,
          propertyCount: properties.length,
          exportedAt: new Date(),
        },
      },
    });

    // Generate export file (simplified)
    const exportData = {
      format,
      generatedAt: new Date(),
      properties: properties.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        yearBuilt: p.yearBuilt,
        squareFeet: p.squareFeet,
        propertyType: p.propertyType,
        createdAt: p.createdAt,
      })),
    };

    return {
      downloadUrl: `${process.env.API_URL}/exports/${userId}/${Date.now()}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      fileSize: JSON.stringify(exportData).length,
    };
  }

  private async verifyPropertyOwnership(propertyId: string, userId: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('You do not have access to this property');
    }

    return property;
  }

  private formatPropertyResponse(property: any): PropertyResponseDto {
    return {
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      yearBuilt: property.yearBuilt,
      squareFeet: property.squareFeet,
      lotSize: property.lotSize,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.propertyType,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      latestReport: property.reports?.[0] || null,
      documentCount: property._count?.rawDocuments || 0,
      reportCount: property._count?.reports || 0,
    };
  }

  private async calculateTotalPortfolioValue(userId: string): Promise<number> {
    // Get latest reports with market analysis
    const reports = await this.prisma.report.findMany({
      where: {
        property: { userId },
        status: 'published',
        aiInsights: { not: Prisma.JsonNull },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalValue = 0;
    const processedProperties = new Set();

    for (const report of reports) {
      if (!processedProperties.has(report.propertyId)) {
        const insights = report.aiInsights as any;
        if (insights?.marketAnalysis?.estimatedValue) {
          totalValue += insights.marketAnalysis.estimatedValue;
          processedProperties.add(report.propertyId);
        }
      }
    }

    return totalValue;
  }

  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
