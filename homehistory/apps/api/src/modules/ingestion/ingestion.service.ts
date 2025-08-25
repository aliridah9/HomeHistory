import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ZillowService } from './services/zillow.service';
import { CountyRecordsService } from './services/county-records.service';
import { TaxAssessorService } from './services/tax-assessor.service';
import { PermitDataService } from './services/permit-data.service';
import { TriggerIngestionDto, IngestionStatusDto } from './dto';
import { DataSource, Property, RawDocument, SyncStatus } from '@homehistory/database';

@Injectable()
export class IngestionService {
  private dataSourceServices: Map<string, any>;

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    @InjectQueue('ingestion') private ingestionQueue: Queue,
    private zillowService: ZillowService,
    private countyRecordsService: CountyRecordsService,
    private taxAssessorService: TaxAssessorService,
    private permitDataService: PermitDataService,
  ) {
    // Map data source names to their services
    this.dataSourceServices = new Map<string, any>([
      ['zillow', this.zillowService],
      ['county_records', this.countyRecordsService],
      ['tax_assessor', this.taxAssessorService],
      ['permit_data', this.permitDataService],
    ]);
  }

  async triggerIngestion(userId: string, dto: TriggerIngestionDto): Promise<IngestionStatusDto> {
    // Verify property ownership
    const property = await this.verifyPropertyOwnership(dto.propertyId, userId);

    // Get data source
    const dataSource = await this.prisma.dataSource.findUnique({
      where: { name: dto.dataSourceName },
    });

    if (!dataSource || !dataSource.isActive) {
      throw new NotFoundException('Data source not found or inactive');
    }

    // Update sync status
    const propertyDataSource = await this.prisma.propertyDataSource.upsert({
      where: {
        propertyId_dataSourceId: {
          propertyId: property.id,
          dataSourceId: dataSource.id,
        },
      },
      update: {
        syncStatus: SyncStatus.SYNCING,
      },
      create: {
        propertyId: property.id,
        dataSourceId: dataSource.id,
        syncStatus: SyncStatus.SYNCING,
      },
    });

    // Queue the ingestion job
    await this.ingestionQueue.add('ingest', {
      propertyId: property.id,
      dataSourceId: dataSource.id,
      dataSourceName: dataSource.name,
      userId,
    });

    return {
      propertyId: property.id,
      dataSourceName: dataSource.name,
      status: SyncStatus.SYNCING,
      lastSynced: propertyDataSource.lastSynced,
      message: 'Ingestion job queued',
    };
  }

  async triggerAllSourcesForProperty(userId: string, propertyId: string): Promise<IngestionStatusDto[]> {
    const property = await this.verifyPropertyOwnership(propertyId, userId);

    const dataSources = await this.prisma.dataSource.findMany({
      where: { isActive: true },
    });

    const results: IngestionStatusDto[] = [];

    for (const dataSource of dataSources) {
      try {
        const result = await this.triggerIngestion(userId, {
          propertyId: property.id,
          dataSourceName: dataSource.name,
        });
        results.push(result);
      } catch (error) {
        results.push({
          propertyId: property.id,
          dataSourceName: dataSource.name,
          status: SyncStatus.FAILED,
          lastSynced: null,
          message: `Failed to trigger: ${error.message}`,
        });
      }
    }

    return results;
  }

  async processIngestion(jobData: any) {
    const { propertyId, dataSourceId, dataSourceName, userId } = jobData;

    try {
      // Get the appropriate service
      const service = this.dataSourceServices.get(dataSourceName);
      if (!service) {
        throw new Error(`No service found for data source: ${dataSourceName}`);
      }

      // Get property details
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Fetch data from the external source
      const rawData = await service.fetchData(property);

      // Store raw documents
      const documents: RawDocument[] = [];
      for (const item of rawData) {
        const fileUrl = await this.storeRawData(propertyId, dataSourceName, item);
        
        const document = await this.prisma.rawDocument.create({
          data: {
            type: item.type || dataSourceName,
            source: dataSourceName,
            fileUrl,
            extractedText: item.data,
            propertyId,
            status: 'pending',
          },
        });

        documents.push(document);
      }

      // Update sync status
      await this.prisma.propertyDataSource.update({
        where: {
          propertyId_dataSourceId: {
            propertyId,
            dataSourceId,
          },
        },
        data: {
          syncStatus: SyncStatus.SUCCESS,
          lastSynced: new Date(),
          syncData: {
            documentCount: documents.length,
            lastDocumentIds: documents.map(d => d.id),
          },
        },
      });

      // Log audit
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ingestion_completed',
          entityType: 'property',
          entityId: propertyId,
          metadata: {
            dataSource: dataSourceName,
            documentCount: documents.length,
          },
        },
      });

      return documents;
    } catch (error) {
      // Update sync status to failed
      await this.prisma.propertyDataSource.update({
        where: {
          propertyId_dataSourceId: {
            propertyId,
            dataSourceId,
          },
        },
        data: {
          syncStatus: SyncStatus.FAILED,
          syncData: {
            error: error.message,
            failedAt: new Date(),
          },
        },
      });

      throw error;
    }
  }

  async getIngestionStatus(userId: string, propertyId: string): Promise<IngestionStatusDto[]> {
    await this.verifyPropertyOwnership(propertyId, userId);

    const propertyDataSources = await this.prisma.propertyDataSource.findMany({
      where: { propertyId },
      include: { dataSource: true },
    });

    return propertyDataSources.map(pds => ({
      propertyId,
      dataSourceName: pds.dataSource.name,
      status: pds.syncStatus,
      lastSynced: pds.lastSynced,
      message: this.getSyncStatusMessage(pds.syncStatus, pds.syncData),
    }));
  }

  async getIngestionHistory(userId: string, propertyId: string) {
    await this.verifyPropertyOwnership(propertyId, userId);

    const documents = await this.prisma.rawDocument.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'property',
        entityId: propertyId,
        action: { startsWith: 'ingestion_' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      documents,
      auditLogs,
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

  private async storeRawData(propertyId: string, source: string, data: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${propertyId}/${source}/${timestamp}.json`;
    
    await this.supabase.uploadFile(
      'raw-documents',
      filename,
      Buffer.from(JSON.stringify(data, null, 2)),
      'application/json',
    );

    return this.supabase.getFileUrl('raw-documents', filename);
  }

  private getSyncStatusMessage(status: SyncStatus, syncData: any): string {
    switch (status) {
      case SyncStatus.PENDING:
        return 'Sync not started';
      case SyncStatus.SYNCING:
        return 'Sync in progress';
      case SyncStatus.SUCCESS:
        return `Successfully synced ${syncData?.documentCount || 0} documents`;
      case SyncStatus.FAILED:
        return `Sync failed: ${syncData?.error || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  }
}
