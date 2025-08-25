export declare class GeolocationService {
    private readonly logger;
    geocodeAddress(address: string): Promise<{
        latitude: number;
        longitude: number;
    }>;
    reverseGeocode(latitude: number, longitude: number): Promise<{
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    }>;
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number>;
    getNearbyPlaces(latitude: number, longitude: number, radius?: number, // meters
    type?: string): Promise<any[]>;
    private getDefaultCoordinates;
    private toRadians;
}
//# sourceMappingURL=geolocation.service.d.ts.map
