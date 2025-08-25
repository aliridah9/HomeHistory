import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly scrapedDataDir: string;

  constructor(private readonly prisma: PrismaService) {
    // The scraped-data directory is at the homehistory level
    this.scrapedDataDir = process.env.HH_SCRAPED_DATA_DIR || path.resolve(__dirname, '../../../scraped-data');
  }

  /**
   * Main ingestion method - processes all JSON files in the scraped data directory
   */
  async ingestAllData() {
    this.logger.log('Starting data ingestion from scraped files...');
    
    const results = {
      totalFiles: 0,
      processedFiles: 0,
      errors: [] as Array<{ file: string; error: string }>,
      stats: {
        listings: { created: 0, updated: 0, errors: 0 },
        businesses: { created: 0, updated: 0, errors: 0 },
        portals: new Set<string>() as Set<string> | string[],
      },
    };

    try {
      // Ensure portals exist
      await this.ensurePortalsExist();

      // Get all JSON files
      const files = await this.getJsonFiles();
      results.totalFiles = files.length;

      // Process each file
      for (const file of files) {
        try {
          this.logger.log(`Processing file: ${file}`);
          const stats = await this.processFile(file);
          
          // Aggregate stats
          if (stats.type === 'listing') {
            results.stats.listings.created += stats.created;
            results.stats.listings.updated += stats.updated;
            results.stats.listings.errors += stats.errors;
          } else if (stats.type === 'business') {
            results.stats.businesses.created += stats.created;
            results.stats.businesses.updated += stats.updated;
            results.stats.businesses.errors += stats.errors;
          }
          
          (results.stats.portals as Set<string>).add(stats.portal);
          results.processedFiles++;
        } catch (error) {
          this.logger.error(`Error processing file ${file}:`, error);
          results.errors.push({ file, error: error.message });
        }
      }

      // Convert Set to Array for response
      results.stats.portals = Array.from(results.stats.portals as Set<string>);

      this.logger.log('Data ingestion completed', results);
      return results;
    } catch (error) {
      this.logger.error('Fatal error during ingestion:', error);
      throw error;
    }
  }

  /**
   * Get ingestion statistics from the database
   */
  async getIngestionStats() {
    const [listingCount, businessCount, portalStats] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.businessListing.count(),
      this.prisma.portal.findMany({
        select: {
          name: true,
          _count: {
            select: {
              listings: true,
              businesses: true,
            },
          },
        },
      }),
    ]);

    return {
      totalListings: listingCount,
      totalBusinesses: businessCount,
      byPortal: portalStats.map(p => ({
        portal: p.name,
        listings: p._count.listings,
        businesses: p._count.businesses,
      })),
    };
  }

  /**
   * Ensure all portal entries exist in the database
   */
  private async ensurePortalsExist() {
    const portals = ['zillow', 'redfin', 'trulia', 'century21', 'loopnet', 'bizbuysell'];
    
    for (const name of portals) {
      await this.prisma.portal.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  }

  /**
   * Get all JSON files from the scraped data directory
   */
  private async getJsonFiles(): Promise<string[]> {
    const dirPath = path.resolve(this.scrapedDataDir);
    
    try {
      const files = await fs.readdir(dirPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dirPath, file));
    } catch (error) {
      this.logger.error(`Error reading directory ${dirPath}:`, error);
      throw new Error(`Cannot read scraped data directory: ${dirPath}`);
    }
  }

  /**
   * Process a single JSON file
   */
  private async processFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const filename = path.basename(filePath).toLowerCase();
    
    // Detect portal from filename
    const portal = this.detectPortal(filename);
    
    // Detect data type and process accordingly
    if (filename.includes('loopnet') || filename.includes('bizbuysell')) {
      return this.processBusinessData(data, portal, filename);
    } else {
      return this.processListingData(data, portal, filename);
    }
  }

  /**
   * Detect portal name from filename
   */
  private detectPortal(filename: string): string {
    if (filename.includes('zillow')) return 'zillow';
    if (filename.includes('redfin')) return 'redfin';
    if (filename.includes('trulia')) return 'trulia';
    if (filename.includes('century-21')) return 'century21';
    if (filename.includes('loopnet')) return 'loopnet';
    if (filename.includes('bizbuysell')) return 'bizbuysell';
    
    throw new Error(`Cannot detect portal from filename: ${filename}`);
  }

  /**
   * Process residential listing data
   */
  private async processListingData(data: any, portalName: string, filename: string) {
    const portal = await this.prisma.portal.findUnique({ where: { name: portalName } });
    if (!portal) {
      throw new Error(`Portal ${portalName} not found in database`);
    }
    const stats = { type: 'listing', portal: portalName, created: 0, updated: 0, errors: 0 };
    
    // Handle different data structures
    let records = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data.value && Array.isArray(data.value)) {
      records = data.value; // Zillow format
    } else {
      this.logger.warn(`Unexpected data structure in ${filename}`);
      return stats;
    }

    for (const record of records) {
      try {
        const mapped = this.mapListingData(record, portalName);
        
        if (!mapped.sourceUrl) {
          this.logger.warn(`Skipping record without sourceUrl in ${filename}`);
          stats.errors++;
          continue;
        }

        // Upsert listing
        const listing = await this.prisma.listing.upsert({
          where: { sourceUrl: mapped.sourceUrl },
          update: {
            ...mapped,
            portalId: portal.id,
            updatedAt: new Date(),
          },
          create: {
            ...mapped,
            portalId: portal.id,
          },
        });

        // Handle images
        if (mapped.images && mapped.images.length > 0) {
          await this.updateListingImages(listing.id, mapped.images);
        }

        stats.created++;
      } catch (error) {
        this.logger.error(`Error processing listing record:`, error);
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Process business listing data
   */
  private async processBusinessData(data: any, portalName: string, filename: string) {
    const portal = await this.prisma.portal.findUnique({ where: { name: portalName } });
    if (!portal) {
      throw new Error(`Portal ${portalName} not found in database`);
    }
    const stats = { type: 'business', portal: portalName, created: 0, updated: 0, errors: 0 };
    
    const records = Array.isArray(data) ? data : [data];

    for (const record of records) {
      try {
        const mapped = this.mapBusinessData(record, portalName);
        
        if (!mapped.sourceUrl) {
          this.logger.warn(`Skipping business record without sourceUrl in ${filename}`);
          stats.errors++;
          continue;
        }

        // Upsert business listing
        const business = await this.prisma.businessListing.upsert({
          where: { sourceUrl: mapped.sourceUrl },
          update: {
            ...mapped,
            portalId: portal.id,
            updatedAt: new Date(),
          },
          create: {
            ...mapped,
            portalId: portal.id,
          },
        });

        // Handle images
        if (mapped.images && mapped.images.length > 0) {
          await this.updateBusinessImages(business.id, mapped.images);
        }

        stats.created++;
      } catch (error) {
        this.logger.error(`Error processing business record:`, error);
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Map listing data based on portal
   */
  private mapListingData(record: any, portal: string): any {
    const mapped: any = {
      raw: record,
      images: [],
    };

    switch (portal) {
      case 'zillow':
        return this.mapZillowListing(record, mapped);
      case 'redfin':
        return this.mapRedfinListing(record, mapped);
      case 'trulia':
        return this.mapTruliaListing(record, mapped);
      case 'century21':
        return this.mapCentury21Listing(record, mapped);
      default:
        throw new Error(`Unknown portal: ${portal}`);
    }
  }

  /**
   * Map Zillow listing data (Las Vegas format with detailed fields)
   */
  private mapZillowListing(record: any, mapped: any): any {
    // Handle both formats (Las Vegas detailed format and Houston simple format)
    if (record['Property Address']) {
      // Houston format
      mapped.fullAddressRaw = record['Property Address'];
      mapped.sourceUrl = record['Property URL'];
      mapped.priceUsd = this.parseUsd(record['Price (USD)']);
      mapped.beds = this.parseFloat(record['Number of Beds']);
      mapped.baths = this.parseFloat(record['Number of Baths']);
      mapped.livingAreaSqft = this.parseInt(record['Square Footage']);
      mapped.propertyType = record['Home Type'];
      mapped.brokerageName = record['Listing Agent/Company'];
      mapped.thumbnailUrl = record['Property Image'];
      mapped.images = this.splitImages(record['Property Image']);
    } else {
      // Las Vegas detailed format
      mapped.addressLine1 = record['Street Address'];
      mapped.city = record['City'];
      mapped.state = record['State'];
      mapped.zipcode = record['Zipcode'];
      mapped.fullAddressRaw = record['Address'];
      mapped.sourceUrl = record['Listing URL'];
      mapped.priceUsd = this.parseUsd(record['Pricing']);
      mapped.yearBuilt = this.parseInt(record['Built Year']);
      
      // Parse living area
      const livingArea = record['Living Area'];
      if (livingArea && livingArea.includes('Square Feet')) {
        mapped.livingAreaSqft = this.parseInt(livingArea.replace('Square Feet', ''));
      }
      
      // Parse lot size
      const lotSize = record['Lot Size'];
      if (lotSize) {
        if (lotSize.includes('Acres')) {
          mapped.lotSizeAcres = this.parseFloat(lotSize.replace('Acres', ''));
          mapped.lotSizeSqft = mapped.lotSizeAcres * 43560;
        } else if (lotSize.includes('Square Feet')) {
          mapped.lotSizeSqft = this.parseFloat(lotSize.replace('Square Feet', ''));
        }
      }
      
      mapped.propertyTaxRate = this.parseFloat(record['Property Tax Rate']);
      mapped.isZillowOwned = record['Is Zillow Owned'] === 'true';
      mapped.lastSoldPrice = this.parseInt(record['Last Sold Price']);
      mapped.description = record['Description'];
      mapped.daysOnMarket = this.parseInt(record['Days on Zillow']);
      mapped.brokerageName = record['Brokerage Name'];
      mapped.virtualTourUrl = record['Virtual Tour'];
      mapped.beds = this.parseFloat(record['Number of Bedrooms']);
      mapped.baths = this.parseFloat(record['Number of Bathrooms']);
      mapped.listingAgent = record['Listing Provided By'];
      mapped.status = record['Status'];
      mapped.thumbnailUrl = record['Image'];
      mapped.images = this.splitImages(record['Image']);
    }
    
    return mapped;
  }

  /**
   * Map Redfin listing data
   */
  private mapRedfinListing(record: any, mapped: any): any {
    mapped.fullAddressRaw = record['Property Address'];
    mapped.sourceUrl = record['Property URL'];
    mapped.priceUsd = this.parseUsd(record['Price (USD)']);
    mapped.beds = this.parseFloat(record['Number of Beds']);
    mapped.baths = this.parseFloat(record['Number of Baths']);
    mapped.livingAreaSqft = this.parseInt(record['Square Footage']);
    mapped.propertyType = record['Home Type'];
    
    // Handle agent/company field
    const agentCompany = record['Listing Agent/Company'];
    if (agentCompany) {
      mapped.listingAgent = agentCompany;
      mapped.brokerageName = agentCompany;
    }
    
    mapped.thumbnailUrl = record['Property Image'];
    mapped.images = this.splitImages(record['Property Image']);
    
    return mapped;
  }

  /**
   * Map Trulia listing data
   */
  private mapTruliaListing(record: any, mapped: any): any {
    mapped.fullAddressRaw = record['Property Address'];
    mapped.sourceUrl = record['Property URL'];
    mapped.priceUsd = this.parseUsd(record['Price (USD)']);
    mapped.beds = this.parseFloat(record['Number of Beds']);
    mapped.baths = this.parseFloat(record['Number of Baths']);
    mapped.livingAreaSqft = this.parseInt(record['Square Footage']);
    mapped.listingAgent = record['Listing Agent/Company'];
    mapped.thumbnailUrl = record['Property Image'];
    mapped.images = this.splitImages(record['Property Image']);
    
    return mapped;
  }

  /**
   * Map Century 21 listing data
   */
  private mapCentury21Listing(record: any, mapped: any): any {
    mapped.fullAddressRaw = record['Property Address'];
    mapped.sourceUrl = record['Property URL'];
    mapped.priceUsd = this.parseUsd(record['Price (USD)']);
    mapped.thumbnailUrl = record['Property Image'];
    mapped.propertyType = record['Property Type'];
    mapped.brokerageName = record['Listed By'];
    
    // Parse lot size
    const lotSize = record['Lot Size (Acres)'];
    if (lotSize) {
      mapped.lotSizeAcres = this.parseFloat(lotSize);
      mapped.lotSizeSqft = mapped.lotSizeAcres * 43560;
    }
    
    mapped.images = [record['Property Image']].filter(Boolean);
    
    return mapped;
  }

  /**
   * Map business data based on portal
   */
  private mapBusinessData(record: any, portal: string): any {
    const mapped: any = {
      raw: record,
      images: [],
    };

    switch (portal) {
      case 'loopnet':
        return this.mapLoopnetBusiness(record, mapped);
      case 'bizbuysell':
        return this.mapBizBuySellBusiness(record, mapped);
      default:
        throw new Error(`Unknown business portal: ${portal}`);
    }
  }

  /**
   * Map LoopNet business data
   */
  private mapLoopnetBusiness(record: any, mapped: any): any {
    mapped.businessName = record['Business Name'] || record.title;
    mapped.sourceUrl = record['Business URL'];
    mapped.location = record['Location'];
    mapped.priceUsd = this.parseUsd(record['Price (USD)']);
    mapped.cashflowUsd = this.parseUsd(record['Cash Flow (USD)']);
    mapped.description = record['Description'];
    
    const image = record['Business Image'];
    if (image) {
      mapped.images = [image];
    }
    
    return mapped;
  }

  /**
   * Map BizBuySell business data
   */
  private mapBizBuySellBusiness(record: any, mapped: any): any {
    mapped.title = record['TITLE'];
    mapped.location = record['LOCATION'];
    mapped.state = record['STATE'];
    mapped.priceUsd = this.parseUsd(record['PRICE']);
    mapped.revenueUsd = this.parseUsd(record['REVENUE']);
    mapped.ebitdaUsd = this.parseUsd(record['EBITDA']);
    mapped.cashflowUsd = this.parseUsd(record['CASH FLOW']);
    mapped.sourceUrl = record['LINK TO DEAL'];
    mapped.employees = this.parseInt(record['NUMBER OF EMPLOYEES']);
    mapped.yearEstablished = this.parseInt(record['YEAR ESTABLISHED']);
    mapped.intermediaryFirm = record['INTERMEDIARY FIRM'];
    mapped.intermediaryPhone = record['INTERMEDIARY PHONE'];
    mapped.intermediaryName = record['INTERMEDIARY NAME'];
    mapped.inventoryRaw = record['INVENTORY'];
    mapped.reasonForSelling = record['REASON FOR SELLING'];
    mapped.sellerType = record['SELLER TYPE'];
    mapped.description = record['INDUSTRY DETAILS'];
    mapped.dateAdded = record['DATE ADDED'];
    
    return mapped;
  }

  /**
   * Update listing images
   */
  private async updateListingImages(listingId: string, imageUrls: string[]) {
    // Delete existing images
    await this.prisma.listingImage.deleteMany({
      where: { listingId },
    });

    // Create new images
    if (imageUrls.length > 0) {
      await this.prisma.listingImage.createMany({
        data: imageUrls.map(url => ({
          listingId,
          url,
        })),
      });
    }
  }

  /**
   * Update business images
   */
  private async updateBusinessImages(businessId: string, imageUrls: string[]) {
    // Delete existing images
    await this.prisma.businessImage.deleteMany({
      where: { businessId },
    });

    // Create new images
    if (imageUrls.length > 0) {
      await this.prisma.businessImage.createMany({
        data: imageUrls.map(url => ({
          businessId,
          url,
        })),
      });
    }
  }

  /**
   * Helper: Parse USD string to integer
   */
  private parseUsd(value: any): number | null {
    if (!value || value === 'Not Disclosed') return null;
    
    const str = String(value);
    const cleaned = str.replace(/[$,\s]/g, '');
    const num = parseInt(cleaned);
    
    return isNaN(num) ? null : num;
  }

  /**
   * Helper: Parse number
   */
  private parseInt(value: any): number | null {
    if (!value) return null;
    
    const str = String(value);
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseInt(cleaned);
    
    return isNaN(num) ? null : num;
  }

  /**
   * Helper: Parse float
   */
  private parseFloat(value: any): number | null {
    if (!value) return null;
    
    const str = String(value);
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  }

  /**
   * Helper: Split comma-separated image URLs
   */
  private splitImages(value: any): string[] {
    if (!value) return [];
    
    const str = String(value);
    return str
      .split(',')
      .map(s => s.trim())
      .filter(s => s && (s.startsWith('http://') || s.startsWith('https://')));
  }
}
