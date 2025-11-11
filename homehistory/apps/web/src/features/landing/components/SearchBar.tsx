import * as React from 'react';
import { Search, ChevronDown, HomeIcon } from 'lucide-react';

type Props = {
  isNavbar?: boolean;
  onSearch: (q: string) => void;
};

export function SearchBar({ onSearch, isNavbar = false }: Props) {
  const [query, setQuery] = React.useState('');
  return (
    <div
      className={`rounded-full bg-white shadow-lg px-3 py-2 md:px-3 md:py-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full ${isNavbar ? 'md:w-auto' : 'md:w-[820px]'}  shadow-[0_1px_22.9px_0_rgba(10,23,49,0.09)]`}
    >
      <div className="flex gap-2">
        <button className="flex items-center gap-4 h-8 px-3 rounded-full text-gray-900 text-[16px]">
          For sale
          <ChevronDown size={12} />
        </button>
      </div>
      <div className="hidden md:block w-px h-6 bg-zinc-200" />
      <div className="h-8 px-3 rounded-full  bg-white text-gray-900 text-[16px] flex items-center gap-1 min-w-[110px]">
        <HomeIcon size={14} />
        <div className="flex items-center gap-4">
          Residential
          <ChevronDown size={12} />
        </div>
      </div>
      <div className="hidden md:block w-px h-6 bg-zinc-200" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={isNavbar ? 'Search' : 'Location, Agent, Lender, Contractor'}
        className={`${isNavbar ? 'w-[100px]' : 'flex-1'} h-9 rounded-md px-3 focus:outline-none focus:bg-gray-100 text-[15px] text-gray-900`}
      />
      <button
        onClick={() => onSearch(query)}
        className={`h-10 ${isNavbar ? 'px-3' : 'px-4'}  rounded-3xl bg-tertiary-500 hover:bg-tertiary-600 text-white flex items-center gap-1`}
      >
        <Search size={18} />
        {!isNavbar && 'Search'}
      </button>
    </div>
  );
}
