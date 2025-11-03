/**
 * Scraped Data Service - Loads and analyzes scraped property data
 * Uses actual market data from Redfin, Zillow, Trulia for scoring and analysis
 */

import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ScrapedProperty {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  beds: number;
  baths: number;
  squareFeet: number;
  yearBuilt?: number;
  lotSize?: string;
  description?: string;
  daysOnMarket?: number;
  lastSoldPrice?: number;
  source: 'redfin' | 'zillow' | 'trulia' | 'century21';
}

interface MarketStats {
  avgPrice: number;
  medianPrice: number;
  avgPricePerSqFt: number;
  avgDaysOnMarket: number;
  totalListings: number;
  priceRange: { min: number; max: number };
  appreciationTrend: number; // Percentage
}

interface ComparableProperty {
  address: string;
  price: number;
  similarity: number;
  pricePerSqFt: number;
  distance?: number;
}

@Injectable()
export class ScrapedDataService {
  private readonly logger = new Logger(ScrapedDataService.name);
  private scrapedData: Map<string, ScrapedProperty[]> = new Map();
  private dataLoaded = false;

  constructor() {
    this.loadScrapedData();
  }

  /**
   * Load all scraped data files
   */
  private loadScrapedData(): void {
    try {
      const dataPath = join(process.cwd(), 'homehistory', 'scraped-data');
      
      // Load Redfin data
      this.loadRedfin(join(dataPath, 'redfin-la.json'), 'Los Angeles', 'CA');
      
      // Load Zillow data
      this.loadZillow(join(dataPath, 'zillow-la-lv-1.json'));
      this.loadZillow(join(dataPath, 'zillow-la-lv-2.json'));
      this.loadZillow(join(dataPath, 'zillow-tx-houston.json'));
      
      // Load Trulia data
      this.loadTrulia(join(dataPath, 'trulia-la.json'));
      this.loadTrulia(join(dataPath, 'trulia-houston.json'));
      
      this.dataLoaded = true;
      this.logger.log(`Loaded ${this.getTotalPropertyCount()} properties from scraped data`);
    } catch (error) {
      this.logger.error('Failed to load scraped data:', error);
    }
  }

  /**
   * Load Redfin data
   */
  private loadRedfin(filePath: string, defaultCity: string, defaultState: string): void {
    try {
      const rawData = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      
      const properties: ScrapedProperty[] = data.map((item: any) => {
        const addressParts = this.parseAddress(item['Property Address']);
        return {
          address: item['Property Address'],
          city: addressParts.city || defaultCity,
          state: addressParts.state || defaultState,
          zipcode: addressParts.zipcode || '',
          price: parseInt(item['Price (USD)']) || 0,
          beds: parseInt(item['Number of Beds']) || 0,
          baths: parseFloat(item['Number of Baths']) || 0,
          squareFeet: parseInt(item['Square Footage']) || 0,
          source: 'redfin' as const,
        };
      });
      
      this.addPropertiesByLocation(properties);
      this.logger.log(`Loaded ${properties.length} properties from Redfin`);
    } catch (error) {
      this.logger.warn(`Failed to load ${filePath}:`, error.message);
    }
  }

  /**
   * Load Zillow data
   */
  private loadZillow(filePath: string): void {
    try {
      const rawData = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      
      const properties: ScrapedProperty[] = data.map((item: any) => {
        const squareFeet = item['Living Area'] ? 
          parseInt(item['Living Area'].replace(/[^\d]/g, '')) : 0;
        
        return {
          address: item['Street Address'] || item['Address'],
          city: item['City'] || '',
          state: item['State'] || '',
          zipcode: item['Zipcode'] || '',
          price: parseInt(item['Pricing']) || 0,
          beds: parseInt(item['Number of Bedrooms']) || 0,
          baths: parseFloat(item['Number of Bathrooms']) || 0,
          squareFeet,
          yearBuilt: parseInt(item['Built Year']) || undefined,
          lotSize: item['Lot Size'],
          description: item['Description'],
          daysOnMarket: parseInt(item['Days on Zillow']) || undefined,
          lastSoldPrice: parseInt(item['Last Sold Price']) || undefined,
          source: 'zillow' as const,
        };
      });
      
      this.addPropertiesByLocation(properties);
      this.logger.log(`Loaded ${properties.length} properties from Zillow`);
    } catch (error) {
      this.logger.warn(`Failed to load ${filePath}:`, error.message);
    }
  }

  /**
   * Load Trulia data
   */
  private loadTrulia(filePath: string): void {
    try {
      const rawData = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      
      const properties: ScrapedProperty[] = data.map((item: any) => {
        const addressParts = this.parseAddress(item['Property Address']);
        return {
          address: item['Property Address'],
          city: addressParts.city || '',
          state: addressParts.state || '',
          zipcode: addressParts.zipcode || '',
          price: parseInt(item['Price (USD)']) || 0,
          beds: parseInt(item['Number of Beds']) || 0,
          baths: parseFloat(item['Number of Baths']) || 0,
          squareFeet: parseInt(item['Square Footage']) || 0,
          source: 'trulia' as const,
        };
      });
      
      this.addPropertiesByLocation(properties);
      this.logger.log(`Loaded ${properties.length} properties from Trulia`);
    } catch (error) {
      this.logger.warn(`Failed to load ${filePath}:`, error.message);
    }
  }

  /**
   * Parse address string into components
   */
  private parseAddress(address: string): { city: string; state: string; zipcode: string } {
    const parts = address.split(',').map(p => p.trim());
    
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      const stateZip = lastPart.split(' ');
      
      return {
        city: parts[parts.length - 2],
        state: stateZip[0] || '',
        zipcode: stateZip[1] || '',
      };
    }
    
    return { city: '', state: '', zipcode: '' };
  }

  /**
   * Add properties grouped by location
   */
  private addPropertiesByLocation(properties: ScrapedProperty[]): void {
    properties.forEach(property => {
      const key = `${property.city},${property.state}`.toLowerCase();
      if (!this.scrapedData.has(key)) {
        this.scrapedData.set(key, []);
      }
      this.scrapedData.get(key)!.push(property);
    });
  }

  /**
   * Get market statistics for a location
   */
  getMarketStats(city: string, state: string, propertyType?: string): MarketStats {
    const key = `${city},${state}`.toLowerCase();
    const properties = this.scrapedData.get(key) || [];
    
    if (properties.length === 0) {
      // Return default stats if no data
      return {
        avgPrice: 500000,
        medianPrice: 450000,
        avgPricePerSqFt: 300,
        avgDaysOnMarket: 30,
        totalListings: 0,
        priceRange: { min: 200000, max: 2000000 },
        appreciationTrend: 5.0,
      };
    }
    
    const prices = properties.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
    const pricePerSqFt = properties
      .filter(p => p.price > 0 && p.squareFeet > 0)
      .map(p => p.price / p.squareFeet);
    
    const daysOnMarket = properties
      .filter(p => p.daysOnMarket !== undefined)
      .map(p => p.daysOnMarket!);
    
    // Calculate appreciation trend from last sold prices
    const withLastSold = properties.filter(p => p.lastSoldPrice && p.lastSoldPrice > 0);
    let appreciationTrend = 5.0; // Default 5%
    
    if (withLastSold.length > 0) {
      const appreciations = withLastSold.map(p => 
        ((p.price - p.lastSoldPrice!) / p.lastSoldPrice!) * 100
      );
      appreciationTrend = appreciations.reduce((a, b) => a + b, 0) / appreciations.length;
    }
    
    return {
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      medianPrice: prices[Math.floor(prices.length / 2)],
      avgPricePerSqFt: pricePerSqFt.reduce((a, b) => a + b, 0) / pricePerSqFt.length || 300,
      avgDaysOnMarket: daysOnMarket.length > 0 
        ? daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length 
        : 30,
      totalListings: properties.length,
      priceRange: {
        min: prices[0],
        max: prices[prices.length - 1],
      },
      appreciationTrend,
    };
  }

  /**
   * Find comparable properties
   */
  findComparables(
    city: string,
    state: string,
    price: number,
    beds: number,
    baths: number,
    squareFeet: number,
    limit: number = 5,
  ): ComparableProperty[] {
    const key = `${city},${state}`.toLowerCase();
    const properties = this.scrapedData.get(key) || [];
    
    if (properties.length === 0) {
      return [];
    }
    
    // Calculate similarity scores
    const comparables = properties
      .filter(p => p.price > 0 && p.squareFeet > 0)
      .map(p => {
        const priceDiff = Math.abs(p.price - price) / price;
        const bedDiff = Math.abs(p.beds - beds) / Math.max(beds, 1);
        const bathDiff = Math.abs(p.baths - baths) / Math.max(baths, 1);
        const sqFtDiff = Math.abs(p.squareFeet - squareFeet) / Math.max(squareFeet, 1);
        
        // Weighted similarity score (lower is better)
        const similarity = (
          priceDiff * 0.3 +
          bedDiff * 0.25 +
          bathDiff * 0.15 +
          sqFtDiff * 0.3
        );
        
        return {
          address: p.address,
          price: p.price,
          similarity: 1 - similarity, // Invert so higher is better
          pricePerSqFt: p.price / p.squareFeet,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return comparables;
  }

  /**
   * Analyze property value relative to market
   */
  analyzePropertyValue(
    city: string,
    state: string,
    price: number,
    squareFeet: number,
  ): {
    valueScore: number; // 0-100
    priceDifferenceFromAvg: number;
    priceDifferencePercentage: number;
    isOverpriced: boolean;
    isUnderpriced: boolean;
  } {
    const marketStats = this.getMarketStats(city, state);
    
    if (squareFeet === 0) {
      return {
        valueScore: 75,
        priceDifferenceFromAvg: 0,
        priceDifferencePercentage: 0,
        isOverpriced: false,
        isUnderpriced: false,
      };
    }
    
    const pricePerSqFt = price / squareFeet;
    const avgPricePerSqFt = marketStats.avgPricePerSqFt;
    
    const difference = pricePerSqFt - avgPricePerSqFt;
    const differencePercentage = (difference / avgPricePerSqFt) * 100;
    
    // Calculate value score (100 = perfectly priced, decreases as difference increases)
    let valueScore = 100;
    if (Math.abs(differencePercentage) > 10) {
      valueScore -= Math.min(Math.abs(differencePercentage) - 10, 50);
    }
    
    return {
      valueScore: Math.max(0, Math.min(100, valueScore)),
      priceDifferenceFromAvg: difference,
      priceDifferencePercentage: differencePercentage,
      isOverpriced: differencePercentage > 15,
      isUnderpriced: differencePercentage < -15,
    };
  }

  /**
   * Get inventory health for a location
   */
  getInventoryHealth(city: string, state: string): {
    inventoryLevel: 'low' | 'moderate' | 'high';
    demandScore: number; // 0-100
    daysOnMarketTrend: 'fast' | 'moderate' | 'slow';
  } {
    const marketStats = this.getMarketStats(city, state);
    
    const daysOnMarketTrend = 
      marketStats.avgDaysOnMarket < 20 ? 'fast' :
      marketStats.avgDaysOnMarket < 45 ? 'moderate' : 'slow';
    
    const inventoryLevel = 
      marketStats.totalListings < 50 ? 'low' :
      marketStats.totalListings < 200 ? 'moderate' : 'high';
    
    // Calculate demand score
    let demandScore = 70;
    if (daysOnMarketTrend === 'fast') demandScore += 20;
    if (daysOnMarketTrend === 'slow') demandScore -= 20;
    if (inventoryLevel === 'low') demandScore += 10;
    if (inventoryLevel === 'high') demandScore -= 10;
    
    return {
      inventoryLevel,
      demandScore: Math.max(0, Math.min(100, demandScore)),
      daysOnMarketTrend,
    };
  }

  /**
   * Get total property count
   */
  private getTotalPropertyCount(): number {
    let total = 0;
    this.scrapedData.forEach(properties => {
      total += properties.length;
    });
    return total;
  }

  /**
   * Get all locations with data
   */
  getAvailableLocations(): Array<{ city: string; state: string; count: number }> {
    const locations: Array<{ city: string; state: string; count: number }> = [];
    
    this.scrapedData.forEach((properties, key) => {
      const [city, state] = key.split(',');
      locations.push({
        city: city.charAt(0).toUpperCase() + city.slice(1),
        state: state.toUpperCase(),
        count: properties.length,
      });
    });
    
    return locations.sort((a, b) => b.count - a.count);
  }
}

