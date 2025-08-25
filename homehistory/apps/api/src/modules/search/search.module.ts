import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { VectorService } from './vector.service';
import { AIModule } from '../../ai/ai.module';
import { AISearchService } from '../../ai/services/ai-search.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    AIModule,
    DatabaseModule,
  ],
  controllers: [SearchController],
  providers: [
    SearchService, 
    VectorService,
    AISearchService,
  ],
  exports: [
    SearchService,
    AISearchService,
  ],
})
export class SearchModule {}
