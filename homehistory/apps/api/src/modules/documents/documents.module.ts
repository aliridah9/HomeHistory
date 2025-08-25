import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileProcessingService } from './services/file-processing.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, FileProcessingService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
