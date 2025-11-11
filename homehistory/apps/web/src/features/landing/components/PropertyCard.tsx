import * as React from 'react';
import { Heart } from 'lucide-react';

import { PropertyDescription } from './PropertyDescription';

type Property = {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  areaSqft: number;
  city: string;
  image: string;
  category?: string;
  forSale?: boolean;
};

type Props = {
  property: Property;
};

export function PropertyCard({ property }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden  bg-white hover:shadow-lg transition-shadow p-2 border border-gray-100 duration-300">
      {/* Image with overlay elements */}
      <div className="relative h-48">
        <img
          src={`/src/assets/${property.image}`}
          alt={property.title}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Top-left category pills */}
        <div className="absolute top-3 left-3 flex gap-1">
          {property.category && (
            <span className="px-2 py-1 text-[11px] font-medium bg-white/90 text-zinc-800 rounded-full">
              {property.category}
            </span>
          )}
          {property.forSale && (
            <span className="px-2 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-full">
              For Sale
            </span>
          )}
        </div>

        {/* Top-right bookmark */}
        <button
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Bookmark property"
        >
          <Heart size={16} className="text-zinc-600" />
        </button>
      </div>

      <PropertyDescription property={property} />
    </div>
  );
}
