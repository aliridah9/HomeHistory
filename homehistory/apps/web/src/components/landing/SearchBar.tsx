import * as React from 'react'
import { Search } from 'lucide-react'

type Props = {
  onSearch: (q: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = React.useState('')
  return (
    <div className="rounded-full bg-white shadow-lg px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-[820px]">
      <div className="flex gap-2">
        <button className="h-8 px-3 rounded-full bg-blue-600 text-white text-[13px]">For sale</button>
        <button className="h-8 px-3 rounded-full border border-zinc-200 bg-white text-zinc-800 text-[13px] hover:bg-zinc-50">For rent</button>
      </div>
      <div className="hidden md:block w-px h-6 bg-zinc-200"/>
      <div className="h-8 px-3 rounded-full border border-zinc-200 bg-white text-zinc-700 text-[13px] flex items-center min-w-[110px]">Residential</div>
      <input
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        placeholder="Location, Agent, Lender, Contractor"
        className="flex-1 h-9 rounded-full px-3 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-[15px]"
      />
      <button onClick={()=>onSearch(query)} className="h-11 px-5 rounded-xl bg-blue-600 text-white flex items-center gap-2">
        <Search size={18}/> Search
      </button>
    </div>
  )
}


