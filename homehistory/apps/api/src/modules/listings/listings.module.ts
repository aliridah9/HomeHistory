import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, PrismaService],
  exports: [ListingsService],
})
export class ListingsModule {}
