import * as React from 'react';
import { Bath, Ruler, MapPin, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import bedIconUrl from '../../../assets/bed.svg';

type Property = {
  id: string;
  price: number;
  beds: number;
  baths: number;
  areaSqft: number;
  city: string;
  homeHistoryScore?: number;
  priceChange?: number;
  daysOnMarket?: number;
  propertyType?: string;
  isNew?: boolean;
  isFeatured?: boolean;
};

type Props = {
  property: Property;
  showScore?: boolean;
  showPriceChange?: boolean;
  compact?: boolean;
};

export function PropertyDescription({ 
  property, 
  showScore = true, 
  showPriceChange = true,
  compact = false 
}: Props) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className={`p-4 ${compact ? 'p-3' : 'p-4'}`}>
      {/* Badges */}
      <div className="flex gap-2 mb-2">
        {property.isNew && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
            New
          </Badge>
        )}
        {property.isFeatured && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )}
        {property.propertyType && (
          <Badge variant="outline" className="text-xs">
            {property.propertyType}
          </Badge>
        )}
      </div>

      {/* Price and Score */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-zinc-900 ${compact ? 'text-[16px]' : 'text-[18px]'}`}>
            {formatPrice(property.price)}
          </span>
          {showPriceChange && property.priceChange && (
            <div className={`flex items-center text-xs ${
              property.priceChange > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${
                property.priceChange > 0 ? 'rotate-0' : 'rotate-180'
              }`} />
              {Math.abs(property.priceChange)}%
            </div>
          )}
        </div>
        
        {showScore && property.homeHistoryScore && (
          <Badge 
            variant="outline" 
            className={`text-xs font-semibold ${getScoreColor(property.homeHistoryScore)}`}
          >
            {property.homeHistoryScore}/100
          </Badge>
        )}
      </div>

      {/* Meta info */}
      <div className={`flex items-center mb-2 ${compact ? 'flex-wrap gap-1' : 'gap-0'}`}>
        {property.beds > 0 && (
          <div className={`flex gap-1 items-center px-2 py-1 text-zinc-700 ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}>
            <img src={bedIconUrl} width={compact ? 12 : 15} height={compact ? 12 : 15} alt="Beds" />
            <div>
              {property.beds} bed{property.beds !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {property.baths > 0 && (
          <div className={`flex gap-1 items-center px-2 py-1 text-zinc-700 ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}>
            <Bath size={compact ? 12 : 15} />
            <div>
              {property.baths} bath{property.baths !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {property.areaSqft && (
          <div className={`flex gap-1 items-center px-2 py-1 text-zinc-700 ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}>
            <Ruler size={compact ? 12 : 15} />
            <div>{property.areaSqft.toLocaleString()} sqft</div>
          </div>
        )}
      </div>

      {/* Location and Days on Market */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-zinc-400" />
          <p className={`text-zinc-500 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
            {property.city}
          </p>
        </div>
        
        {property.daysOnMarket && (
          <span className={`text-zinc-400 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            {property.daysOnMarket} days on market
          </span>
        )}
      </div>
    </div>
  );
}
