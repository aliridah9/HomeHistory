import * as React from 'react';
import { ChevronLeft, ChevronRight, HomeIcon } from 'lucide-react';
import reportImg from '../../../assets/report-img.jpg';
import GoogleMapComponent from './Map';
import { Property } from '@/types';
import { PropertyDescription } from './PropertyDescription';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

type Props = {
  properties: Property[];
};

export default function ReportShowcase({ properties }: Props) {
  console.log(properties[0]);
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[24px] md:text-[28px] font-bold text-zinc-900">
          Access a detailed Home History report <br /> on any home, land, or commercial space.
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Previous report"
          >
            <ChevronLeft color="#24292e" size={16} />
          </button>
          <button
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Next report"
          >
            <ChevronRight color="#24292e" size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Large property preview card */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            <img
              src={reportImg}
              alt="Property report preview"
              className="w-full h-64 lg:h-80 object-cover"
              loading="lazy"
            />
            <div className="absolute top-4 left-4">
              <div className="h-8 px-3 rounded-full  bg-white text-gray-900 text-[16px] flex items-center gap-1 min-w-[110px]">
                <HomeIcon size={14} />
                Residential
              </div>
            </div>
            <div className="rounded-[12px] bg-white/85 backdrop-blur-[4.75px] absolute left-[18rem] top-[12rem]">
              <PropertyDescription
                property={{
                  id: '123',
                  price: 250000,
                  beds: 3,
                  baths: 2,
                  areaSqft: 1200,
                  city: 'Beirut',
                }}
              />
            </div>
          </div>
        </div>

        {/* Map snapshot card */}

        <GoogleMapComponent />

        {/* Chart card */}
        <div className="bg-white rounded-2xl shadow-md p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-zinc-700">Price Trend</span>
            <span className="px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded-full font-medium">
              +21.8%
            </span>
          </div>
          <div className="h-24 bg-zinc-100 rounded-lg flex items-center justify-center">
            {/* Simple line chart placeholder SVG */}
            <svg width="80" height="40" viewBox="0 0 80 40" className="text-green-500">
              <path
                d="M10 30 Q20 25 30 20 T50 15 Q60 12 70 10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="70" cy="10" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
