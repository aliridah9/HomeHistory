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
import { BusinessesService } from './businesses.service';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ApiOperation({ summary: 'Get business listings with filters' })
  @ApiQuery({ name: 'source', required: false, description: 'Portal source (loopnet, bizbuysell)' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price in USD' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price in USD' })
  @ApiQuery({ name: 'minRevenue', required: false, type: Number, description: 'Minimum annual revenue in USD' })
  @ApiQuery({ name: 'minCashflow', required: false, type: Number, description: 'Minimum annual cashflow in USD' })
  @ApiQuery({ name: 'employees', required: false, type: Number, description: 'Maximum number of employees' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query for title, location, or description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Business listings retrieved successfully' })
  async getBusinesses(
    @Query('source') source?: string,
    @Query('state') state?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRevenue') minRevenue?: string,
    @Query('minCashflow') minCashflow?: string,
    @Query('employees') employees?: string,
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      source,
      state,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      minRevenue: minRevenue ? parseInt(minRevenue) : undefined,
      minCashflow: minCashflow ? parseInt(minCashflow) : undefined,
      employees: employees ? parseInt(employees) : undefined,
      query,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 20,
    };

    return this.businessesService.getBusinesses(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information for a specific business listing' })
  @ApiParam({ name: 'id', description: 'Business listing ID' })
  @ApiResponse({ status: 200, description: 'Business details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Business listing not found' })
  async getBusinessById(@Param('id') id: string) {
    const business = await this.businessesService.getBusinessById(id);
    
    if (!business) {
      throw new HttpException('Business listing not found', HttpStatus.NOT_FOUND);
    }

    return business;
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get business listing statistics overview' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getBusinessStats() {
    return this.businessesService.getBusinessStats();
  }
}
