import * as React from 'react';
import { Bath, Ruler } from 'lucide-react';
import bedIconUrl from '../../../assets/bed.svg';

type Property = {
  id: string;
  price: number;
  beds: number;
  baths: number;
  areaSqft: number;
  city: string;
};

type Props = {
  property: Property;
};

export function PropertyDescription({ property }: Props) {
  console.log(property);
  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="p-4">
      {/* Price */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[18px] font-semibold text-zinc-900">
          {formatPrice(property.price)}
        </span>
      </div>

      {/* Meta info */}
      <div className="flex items-center mb-2">
        {property.beds > 0 && (
          <div className="flex gap-1 items-center px-2 py-1 text-[11px] text-zinc-700">
            <img src={bedIconUrl} width={15} height={15} alt="Beds" />
            <div>
              {property.beds} bed{property.beds !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {property.baths > 0 && (
          <div className="flex gap-1 items-center px-2 py-1 text-[11px] text-zinc-700">
            <Bath size={15} />
            <div>
              {property.baths} bath{property.baths !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {property.areaSqft && (
          <div className="flex gap-1 items-center px-2 py-1 text-[11px] text-zinc-700">
            <Ruler size={15} />
            <div>{property.areaSqft.toLocaleString()} sqft</div>
          </div>
        )}
      </div>

      {/* Location */}
      <p className="text-[13px] text-zinc-500">{property.city}</p>
    </div>
  );
}
