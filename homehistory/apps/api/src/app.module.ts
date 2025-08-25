import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { FaqModule } from './modules/faq/faq.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ParsingModule } from './modules/parsing/parsing.module';
import { ValidationModule } from './modules/validation/validation.module';
import { ReportBuilderModule } from './modules/report-builder/report-builder.module';
import { SearchModule } from './modules/search/search.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { DatabaseModule } from './modules/database/database.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AIModule } from './ai/ai.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { ListingsModule } from './modules/listings/listings.module';
import { BusinessesModule } from './modules/businesses/businesses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    SupabaseModule,
    AIModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    DirectoryModule,
    FaqModule,
    MaintenanceModule,
    DocumentsModule,
    NotificationsModule,
    IngestionModule,
    ParsingModule,
    ValidationModule,
    ReportBuilderModule,
    SearchModule,
    ScoringModule,
    IngestModule,
    ListingsModule,
    BusinessesModule,
  ],
})
export class AppModule {}
