import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceSchedulerService } from './services/maintenance-scheduler.service';

@Module({
  imports: [NotificationsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceSchedulerService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
