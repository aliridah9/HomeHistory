import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestController } from './ingest.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [IngestController],
  providers: [IngestService, PrismaService],
  exports: [IngestService],
})
export class IngestModule {}
