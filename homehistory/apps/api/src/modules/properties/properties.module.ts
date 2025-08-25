import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { GeolocationService } from './services/geolocation.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, GeolocationService],
  exports: [PropertiesService],
})
export class PropertiesModule {}