import React from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const GoogleMapComponent: React.FC = () => {
  return (
    <div className="w-full h-[320] rounded-xl overflow-hidden shadow-lg">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={{ lat: 40.7128, lng: -74.006 }}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* Example Marker */}
          <Marker position={{ lat: 40.7128, lng: -74.006 }} />
        </Map>
      </APIProvider>
    </div>
  );
};

export default GoogleMapComponent;
