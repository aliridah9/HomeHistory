import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get residential property listings with filters' })
  @ApiQuery({ name: 'source', required: false, description: 'Portal source (zillow, redfin, trulia, century21)' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price in USD' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price in USD' })
  @ApiQuery({ name: 'beds', required: false, type: Number, description: 'Number of bedrooms' })
  @ApiQuery({ name: 'baths', required: false, type: Number, description: 'Number of bathrooms' })
  @ApiQuery({ name: 'homeType', required: false, description: 'Property type filter' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query for address or description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  async getListings(
    @Query('source') source?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('beds') beds?: string,
    @Query('baths') baths?: string,
    @Query('homeType') homeType?: string,
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      source,
      city,
      state,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      beds: beds ? parseFloat(beds) : undefined,
      baths: baths ? parseFloat(baths) : undefined,
      homeType,
      query,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 20,
    };

    return this.listingsService.getListings(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information for a specific listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingById(@Param('id') id: string) {
    const listing = await this.listingsService.getListingById(id);
    
    if (!listing) {
      throw new HttpException('Listing not found', HttpStatus.NOT_FOUND);
    }

    return listing;
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get listing statistics overview' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getListingStats() {
    return this.listingsService.getListingStats();
  }
}
