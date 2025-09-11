import { useState } from 'react';
import DualRangeSlider from './HistogramSlider';
import { Building, Building2, Castle, Home, HomeIcon, Plus } from 'lucide-react';
import SelectInput from '@/libs/lib-select-input/SelectInput';
import DatePickerInput from '@/libs/lib-date-picker/DatePickerInput';

interface StateType {
  label: string;
  value: string;
}
interface PriceType {
  label: string;
  value: string;
}
interface PropertyType {
  label: string;
  value: string;
  icon: React.ElementType;
}

interface FurnitureType {
  label: string;
  value: string;
}

interface StatusType {
  label: string;
  value: string;
}

interface SpaceBuildYear {
  label: string;
  value: string;
  min: '';
  max: '';
}

const MainFilterWindow = () => {
  const stateType: StateType[] = [
    {
      label: 'For Sale',
      value: 'sale',
    },
    {
      label: 'For Rent',
      value: 'rent',
    },
    {
      label: 'Sold',
      value: 'sold',
    },
  ];
  const priceType: PriceType[] = [
    {
      label: 'Fixed Price',
      value: 'fixedPrice',
    },
    {
      label: 'Auction',
      value: 'auction',
    },
  ];

  const propertyType: PropertyType[] = [
    {
      label: 'House',
      value: 'house',
      icon: HomeIcon,
    },
    {
      label: 'Apartment',
      value: 'apartment',
      icon: Building,
    },
    {
      label: 'Co-op',
      value: 'co-op',
      icon: Home,
    },

    {
      label: 'Premium',
      value: 'premium',
      icon: Castle,
    },
    {
      label: 'Lot',
      value: 'lot',
      icon: HomeIcon,
    },
    {
      label: 'Other',
      value: 'other',
      icon: Building2,
    },
  ];

  const furniture: FurnitureType[] = [
    { label: 'Bathrooms', value: 'bathrooms' },
    { label: 'Bedrooms', value: 'bedrooms' },
    { label: 'Parking Spots', value: 'parkingSpots' },
  ];

  const status: StatusType[] = [
    { label: 'Active', value: 'active' },
    { label: 'Under Contact/Pending', value: 'userContentPending' },
  ];

  const spaceBuildYear: SpaceBuildYear[] = [
    {
      label: 'Square Feet',
      value: 'squareFeet',
      min: '',
      max: '',
    },
    {
      label: 'Lot Size',
      value: 'lotSize',
      min: '',
      max: '',
    },
  ];

  const [query, setQuery] = useState({
    stateType: 'sale',
    priceType: '',
    priceRange: { min: '', max: '' },
    propertyType: '',
    furniture: {
      bathrooms: 99,
      bedrooms: 1,
      parkingSpots: 0,
    },
    status: '',
    squareFeet: {
      min: '',
      max: '',
    },
    lotSize: {
      min: '',
      max: '',
    },
    yearBuild: new Date(),
  });

  const increaseFurniture = (key: string) => {
    setQuery((prev) => ({
      ...prev,
      furniture: {
        ...prev.furniture,
        [key]: Math.min((prev.furniture[key] || 0) + 1, 99),
      },
    }));
  };

  const decreaseFurniture = (key: string) => {
    setQuery((prev) => ({
      ...prev,
      furniture: {
        ...prev.furniture,
        [key]: Math.max((prev.furniture[key] || 0) - 1, 0),
      },
    }));
  };

  return (
    <div>
      {/* state type */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 py-1">
        {stateType.map((type: StateType, index: number) => (
          <>
            <div
              key={index}
              className={`text-gray-900 border border-gray-200 flex-1 mx-1 text-center py-1 rounded-xl cursor-pointer hover:bg-gray-100 ${query.stateType === type.value ? 'bg-gray-100 border border-gray-600' : ''}`}
              onClick={() => setQuery((prev) => ({ ...prev, stateType: type.value }))}
            >
              {type.label}
            </div>
            {index !== stateType.length - 1 && (
              <div className="hidden md:block w-px h-6 bg-zinc-200" />
            )}
          </>
        ))}
      </div>
      {/* price type */}
      <div className="text-gray-900 my-6">
        <h2 className="font-semibold mb-4">Price Type</h2>
        <div className="flex flex-col gap-4">
          {priceType.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="priceType"
                id={type.value}
                className="w-[15px] h-[15px] cursor-pointer accent-tertiary-500"
                checked={query.priceType === type.value}
                onChange={() => {
                  setQuery((prev) => ({
                    ...prev,
                    priceType: type.value,
                  }));
                }}
              />
              <label
                htmlFor={type.value}
                className={`cursor-pointer text-sm ${
                  query.priceType === type.value ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      {/* Divider */}
      <div className="border-t border-gray-200" />
      {/* price range  */}
      <div className="my-6">
        <h2 className="font-semibold text-gray-900">Price Range</h2>
        <DualRangeSlider />
      </div>
      <div className="border-t border-gray-200" />
      {/* property type */}
      <div className="my-6">
        <h2 className="font-semibold text-gray-900 mb-4">Property Type</h2>
        <div className="grid grid-cols-3 gap-4">
          {propertyType.map((type) => (
            <div
              key={type.label}
              className={`flex flex-col items-center p-4 rounded-2xl border hover:bg-gray-50 cursor-pointer ${query.propertyType === type.label ? 'border-gray-700 bg-gray-50' : 'border-gray-200'} duration-300`}
              onClick={() =>
                setQuery((prev) => ({
                  ...prev,
                  propertyType: type.label,
                }))
              }
            >
              <type.icon className="h-6 w-6 mb-2 text-gray-700" />
              <span className="text-sm text-gray-900 font-medium">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200" />
      <div className="my-6">
        <h2 className="font-semibold text-gray-900 mb-4">Rooms, Beds and Parking Spots</h2>
        <div className="flex flex-col gap-4">
          {furniture.map((furn: FurnitureType) => (
            <div className="flex justify-between items-end text-gray-900 text-xs">
              <p className="font-medium text-gray-900">{furn.label}</p>
              <div className="flex gap-3 items-center justify-between]">
                <div
                  className={`flex items-center justify-center w-8 h-8 border rounded-full border-gray-200 text-[11px] ${query.furniture[furn.value] === 0 ? 'text-gray-300 pointer-events-none' : 'text-gray-900 cursor-pointer '}`}
                  onClick={() => decreaseFurniture(furn.value)}
                >
                  —
                </div>

                <div className="text-gray-900 text-sm w-[25px]">
                  {query.furniture[furn.value] === 0 ? 'Any' : query.furniture[furn.value] + '+'}
                </div>

                <div
                  className={`flex items-center justify-center w-8 h-8 border rounded-full border-gray-200 text-2xl pb-[0.5px] ${query.furniture[furn.value] === 99 ? 'text-gray-300 pointer-events-none' : 'text-gray-900 cursor-pointer'}`}
                  onClick={() => increaseFurniture(furn.value)}
                >
                  <Plus size={17} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200" />
      <div className="text-gray-900 my-6">
        <h2 className="font-semibold mb-4">Status</h2>
        <div className="flex flex-col gap-4">
          {status.map((stat) => (
            <div key={stat.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="status"
                id={stat.value}
                className="w-[15px] h-[15px] cursor-pointer accent-tertiary-500"
                checked={query.status === stat.value}
                onChange={() => {
                  setQuery((prev) => ({
                    ...prev,
                    status: stat.value,
                  }));
                }}
              />
              <label
                htmlFor={stat.value}
                className={`cursor-pointer text-sm ${
                  query.status === stat.value ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {stat.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200" />
      <div className="text-gray-900 my-6">
        <h2 className="font-semibold mb-4">Space & Build Year</h2>
        <div className="flex flex-col gap-4">
          {spaceBuildYear.map((space: SpaceBuildYear) => (
            <div key={space.value} className="flex flex-col items-center gap-2">
              <div className="flex items-end w-full gap-4">
                <SelectInput
                  label={space.label}
                  name={`${space.value}-min`}
                  type="select"
                  value={query[space.value]?.min || ''}
                  options={[]}
                  placeholder="Min"
                  onChange={(val) => {
                    setQuery((prev) => ({
                      ...prev,
                      [space.value]: {
                        ...prev[space.value],
                        min: val,
                      },
                    }));
                  }}
                  required
                  errorMessage=""
                />

                <span className="text-gray-500 text-xs mb-3 text-gray-300 font-bold">—</span>

                <SelectInput
                  name={`${space.value}-max`}
                  type="select"
                  value={query[space.value]?.max || ''}
                  options={[]}
                  placeholder="Max"
                  onChange={(val) => {
                    setQuery((prev) => ({
                      ...prev,
                      [space.value]: {
                        ...prev[space.value],
                        max: val,
                      },
                    }));
                  }}
                  required
                  errorMessage=""
                />
              </div>
            </div>
          ))}

          <DatePickerInput
            name="yearBuild"
            label="Year Built"
            required
            value={query.yearBuild}
            errorMessage="Enter Date"
            onChange={(date) => setQuery((prev) => ({ ...prev, yearBuild: date }))}
          />
        </div>
      </div>
    </div>
  );
};

export default MainFilterWindow;
