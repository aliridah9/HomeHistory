import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../database/database.module';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionScheduler } from './ingestion.scheduler';
import { ZillowService } from './services/zillow.service';
import { CountyRecordsService } from './services/county-records.service';
import { TaxAssessorService } from './services/tax-assessor.service';
import { PermitDataService } from './services/permit-data.service';


@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionScheduler,
    ZillowService,
    CountyRecordsService,
    TaxAssessorService,
    PermitDataService,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
