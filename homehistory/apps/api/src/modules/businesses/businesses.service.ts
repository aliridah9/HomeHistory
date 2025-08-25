import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@prisma/client';

interface BusinessFilters {
  source?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minRevenue?: number;
  minCashflow?: number;
  employees?: number;
  query?: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get business listings with filters and pagination
   */
  async getBusinesses(filters: BusinessFilters) {
    const where: Prisma.BusinessListingWhereInput = {};

    // Apply filters
    if (filters.source) {
      where.portal = {
        name: filters.source.toLowerCase(),
      };
    }

    if (filters.state) {
      where.state = {
        equals: filters.state.toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.priceUsd = {};
      if (filters.minPrice) {
        where.priceUsd.gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        where.priceUsd.lte = filters.maxPrice;
      }
    }

    if (filters.minRevenue) {
      where.revenueUsd = {
        gte: filters.minRevenue,
      };
    }

    if (filters.minCashflow) {
      where.cashflowUsd = {
        gte: filters.minCashflow,
      };
    }

    if (filters.employees) {
      where.employees = {
        lte: filters.employees,
      };
    }

    // Text search on title, location, and description
    if (filters.query) {
      where.OR = [
        {
          title: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          businessName: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Execute queries
    const [businesses, total] = await Promise.all([
      this.prisma.businessListing.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          title: true,
          businessName: true,
          location: true,
          state: true,
          priceUsd: true,
          revenueUsd: true,
          cashflowUsd: true,
          ebitdaUsd: true,
          employees: true,
          yearEstablished: true,
          portal: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.businessListing.count({ where }),
    ]);

    // Transform businesses for response
    const transformedBusinesses = businesses.map(business => ({
      id: business.id,
      title: business.title || business.businessName,
      location: business.location,
      state: business.state,
      price: business.priceUsd,
      revenue: business.revenueUsd,
      cashflow: business.cashflowUsd,
      ebitda: business.ebitdaUsd,
      employees: business.employees,
      yearEstablished: business.yearEstablished,
      source: business.portal.name,
    }));

    return {
      data: transformedBusinesses,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  /**
   * Get detailed business listing by ID
   */
  async getBusinessById(id: string) {
    const business = await this.prisma.businessListing.findUnique({
      where: { id },
      include: {
        portal: true,
        images: true,
      },
    });

    if (!business) {
      return null;
    }

    // Transform for response
    return {
      id: business.id,
      source: business.portal.name,
      sourceUrl: business.sourceUrl,
      
      // Business identity
      title: business.title,
      businessName: business.businessName,
      location: business.location,
      state: business.state,
      
      // Financials
      financials: {
        price: business.priceUsd,
        revenue: business.revenueUsd,
        ebitda: business.ebitdaUsd,
        cashflow: business.cashflowUsd,
      },
      
      // Business details
      employees: business.employees,
      yearEstablished: business.yearEstablished,
      sellerType: business.sellerType,
      
      // Intermediary information
      intermediary: {
        firm: business.intermediaryFirm,
        phone: business.intermediaryPhone,
        name: business.intermediaryName,
      },
      
      // Additional information
      inventory: business.inventoryRaw,
      reasonForSelling: business.reasonForSelling,
      description: business.description,
      dateAdded: business.dateAdded,
      
      // Media
      images: business.images.map(img => img.url),
      
      // Raw data for debugging
      raw: business.raw,
      
      // Timestamps
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };
  }

  /**
   * Get business listing statistics
   */
  async getBusinessStats() {
    const [
      totalBusinesses,
      byPortal,
      byState,
      priceStats,
      revenueStats,
      cashflowStats,
    ] = await Promise.all([
      // Total count
      this.prisma.businessListing.count(),
      
      // Count by portal
      this.prisma.portal.findMany({
        where: {
          businesses: {
            some: {},
          },
        },
        select: {
          name: true,
          _count: {
            select: {
              businesses: true,
            },
          },
        },
      }),
      
      // Count by state
      this.prisma.businessListing.groupBy({
        by: ['state'],
        _count: true,
        where: {
          state: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            state: 'desc',
          },
        },
        take: 10,
      }),
      
      // Price statistics
      this.prisma.businessListing.aggregate({
        _avg: {
          priceUsd: true,
        },
        _min: {
          priceUsd: true,
        },
        _max: {
          priceUsd: true,
        },
        where: {
          priceUsd: {
            not: null,
          },
        },
      }),
      
      // Revenue statistics
      this.prisma.businessListing.aggregate({
        _avg: {
          revenueUsd: true,
        },
        _min: {
          revenueUsd: true,
        },
        _max: {
          revenueUsd: true,
        },
        where: {
          revenueUsd: {
            not: null,
          },
        },
      }),
      
      // Cashflow statistics
      this.prisma.businessListing.aggregate({
        _avg: {
          cashflowUsd: true,
        },
        _min: {
          cashflowUsd: true,
        },
        _max: {
          cashflowUsd: true,
        },
        where: {
          cashflowUsd: {
            not: null,
          },
        },
      }),
    ]);

    return {
      total: totalBusinesses,
      byPortal: byPortal.map(p => ({
        portal: p.name,
        count: p._count.businesses,
      })),
      byState: byState.map(s => ({
        state: s.state,
        count: s._count,
      })),
      priceStats: {
        average: Math.round(priceStats._avg.priceUsd || 0),
        min: priceStats._min.priceUsd,
        max: priceStats._max.priceUsd,
      },
      revenueStats: {
        average: Math.round(revenueStats._avg.revenueUsd || 0),
        min: revenueStats._min.revenueUsd,
        max: revenueStats._max.revenueUsd,
      },
      cashflowStats: {
        average: Math.round(cashflowStats._avg.cashflowUsd || 0),
        min: cashflowStats._min.cashflowUsd,
        max: cashflowStats._max.cashflowUsd,
      },
    };
  }
}
