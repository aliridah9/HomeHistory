import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../database/database.module';
import { BullModule } from '@nestjs/bull';
import { ParsingController } from './parsing.controller';
import { ParsingService } from './parsing.service';
import { ParsingProcessor } from './parsing.processor';

@Module({
  imports: [
    NotificationsModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'parsing',
    }),
  ],
  controllers: [ParsingController],
  providers: [ParsingService, ParsingProcessor],
  exports: [ParsingService],
})
export class ParsingModule {}
