#!/usr/bin/env node
/**
 * Seed script to ingest scraped data into the database
 * Run with: pnpm --filter api run seed:scraped
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestService } from '../modules/ingest/ingest.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedScraped');
  
  try {
    logger.log('Creating NestJS application context...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const ingestService = app.get(IngestService);
    
    logger.log('Starting scraped data ingestion...');
    const result = await ingestService.ingestAllData();
    
    logger.log('Ingestion completed successfully!');
    logger.log(`Total files processed: ${result.processedFiles}/${result.totalFiles}`);
    logger.log(`Listings created/updated: ${result.stats.listings.created + result.stats.listings.updated}`);
    logger.log(`Businesses created/updated: ${result.stats.businesses.created + result.stats.businesses.updated}`);
    logger.log(`Portals processed: ${(result.stats.portals as any).join(', ')}`);
    
    if (result.errors.length > 0) {
      logger.warn('Errors encountered during ingestion:');
      result.errors.forEach((error: any) => {
        logger.error(`  - ${error.file}: ${error.error}`);
      });
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

bootstrap();
