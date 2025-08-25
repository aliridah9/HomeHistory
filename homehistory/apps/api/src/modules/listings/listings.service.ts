import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@prisma/client';

interface ListingFilters {
  source?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  homeType?: string;
  query?: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get listings with filters and pagination
   */
  async getListings(filters: ListingFilters) {
    const where: Prisma.ListingWhereInput = {};

    // Apply filters
    if (filters.source) {
      where.portal = {
        name: filters.source.toLowerCase(),
      };
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters.state) {
      where.state = {
        equals: filters.state.toUpperCase(),
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

    if (filters.beds) {
      where.beds = {
        gte: filters.beds,
      };
    }

    if (filters.baths) {
      where.baths = {
        gte: filters.baths,
      };
    }

    if (filters.homeType) {
      where.propertyType = {
        contains: filters.homeType,
        mode: 'insensitive',
      };
    }

    // Text search on address and description
    if (filters.query) {
      where.OR = [
        {
          fullAddressRaw: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          addressLine1: {
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
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          priceUsd: true,
          addressLine1: true,
          city: true,
          state: true,
          zipcode: true,
          fullAddressRaw: true,
          beds: true,
          baths: true,
          livingAreaSqft: true,
          thumbnailUrl: true,
          brokerageName: true,
          propertyType: true,
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
      this.prisma.listing.count({ where }),
    ]);

    // Transform listings for response
    const transformedListings = listings.map(listing => ({
      id: listing.id,
      price: listing.priceUsd,
      address: listing.addressLine1 || listing.fullAddressRaw,
      city: listing.city,
      state: listing.state,
      zipcode: listing.zipcode,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.livingAreaSqft,
      thumbnail: listing.thumbnailUrl,
      brokerage: listing.brokerageName,
      propertyType: listing.propertyType,
      source: listing.portal.name,
    }));

    return {
      data: transformedListings,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  /**
   * Get detailed listing by ID
   */
  async getListingById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        portal: true,
        images: true,
      },
    });

    if (!listing) {
      return null;
    }

    // Transform for response
    return {
      id: listing.id,
      source: listing.portal.name,
      sourceUrl: listing.sourceUrl,
      propertyType: listing.propertyType,
      status: listing.status,
      
      // Address
      address: {
        line1: listing.addressLine1,
        city: listing.city,
        state: listing.state,
        zipcode: listing.zipcode,
        full: listing.fullAddressRaw,
      },
      
      // Pricing
      price: listing.priceUsd,
      lastSoldPrice: listing.lastSoldPrice,
      propertyTaxRate: listing.propertyTaxRate,
      
      // Property details
      beds: listing.beds,
      baths: listing.baths,
      livingAreaSqft: listing.livingAreaSqft,
      lotSizeSqft: listing.lotSizeSqft,
      lotSizeAcres: listing.lotSizeAcres,
      yearBuilt: listing.yearBuilt,
      
      // Listing details
      daysOnMarket: listing.daysOnMarket,
      listingAgent: listing.listingAgent,
      brokerageName: listing.brokerageName,
      
      // Media
      thumbnailUrl: listing.thumbnailUrl,
      images: listing.images.map(img => img.url),
      virtualTourUrl: listing.virtualTourUrl,
      
      // Additional info
      isZillowOwned: listing.isZillowOwned,
      description: listing.description,
      
      // Raw data for debugging
      raw: listing.raw,
      
      // Timestamps
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  /**
   * Get listing statistics
   */
  async getListingStats() {
    const [
      totalListings,
      byPortal,
      byState,
      priceStats,
      propertyTypes,
    ] = await Promise.all([
      // Total count
      this.prisma.listing.count(),
      
      // Count by portal
      this.prisma.portal.findMany({
        select: {
          name: true,
          _count: {
            select: {
              listings: true,
            },
          },
        },
      }),
      
      // Count by state
      this.prisma.listing.groupBy({
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
      this.prisma.listing.aggregate({
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
      
      // Property type distribution
      this.prisma.listing.groupBy({
        by: ['propertyType'],
        _count: true,
        where: {
          propertyType: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            propertyType: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total: totalListings,
      byPortal: byPortal.map(p => ({
        portal: p.name,
        count: p._count.listings,
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
      propertyTypes: propertyTypes.map(pt => ({
        type: pt.propertyType,
        count: pt._count,
      })),
    };
  }
}
