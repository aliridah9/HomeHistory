import { Module } from '@nestjs/common';
import { ReportBuilderController } from './report-builder.controller';
import { ReportBuilderService } from './report-builder.service';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [ReportBuilderController],
  providers: [ReportBuilderService, OpenAIService],
  exports: [ReportBuilderService],
})
export class ReportBuilderModule {}
