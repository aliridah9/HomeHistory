import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../../../config';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    const config = getConfig();
    
    try {
      // Use Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.externalApis.googleMaps.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      } else {
        this.logger.warn(`Geocoding failed for address: ${address}. Status: ${data.status}`);
        // Return default coordinates (could be city center or country center)
        return this.getDefaultCoordinates();
      }
    } catch (error) {
      this.logger.error(`Geocoding error for address: ${address}`, error);
      return this.getDefaultCoordinates();
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<{
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }> {
    const config = getConfig();
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.externalApis.googleMaps.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;

        const addressInfo: any = {};

        components.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number') || types.includes('route')) {
            addressInfo.address = (addressInfo.address || '') + ' ' + component.long_name;
          }
          if (types.includes('locality')) {
            addressInfo.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressInfo.state = component.short_name;
          }
          if (types.includes('postal_code')) {
            addressInfo.zipCode = component.long_name;
          }
          if (types.includes('country')) {
            addressInfo.country = component.short_name;
          }
        });

        return {
          address: result.formatted_address,
          ...addressInfo,
        };
      }

      return {};
    } catch (error) {
      this.logger.error(`Reverse geocoding error for coordinates: ${latitude}, ${longitude}`, error);
      return {};
    }
  }

  async calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): Promise<number> {
    // Haversine formula to calculate distance between two points
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  async getNearbyPlaces(
    latitude: number, 
    longitude: number, 
    radius: number = 1000, // meters
    type: string = 'point_of_interest'
  ): Promise<any[]> {
    const config = getConfig();
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${config.externalApis.googleMaps.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.map((place: any) => ({
          name: place.name,
          type: place.types[0],
          rating: place.rating,
          vicinity: place.vicinity,
          location: place.geometry.location,
          distance: this.calculateDistance(
            latitude,
            longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          ),
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Nearby places search error`, error);
      return [];
    }
  }

  private getDefaultCoordinates(): { latitude: number; longitude: number } {
    // Return coordinates for San Francisco as default
    return {
      latitude: 37.7749,
      longitude: -122.4194,
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
