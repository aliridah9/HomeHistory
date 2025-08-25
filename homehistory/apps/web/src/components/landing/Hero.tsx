import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { SearchBar } from './SearchBar'
import mainImg from '../../assets/main-img.jpg'

export function Hero() {
  const navigate = (q: string) => {
    window.location.href = `/search?intent=sale&type=residential&q=${encodeURIComponent(q)}`
  }

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-[40px] md:text-[48px] lg:text-[56px] font-semibold text-zinc-900 leading-[1.1] mb-4">
            List. Search. Verify. Own.
          </h1>
          <p className="text-[18px] text-zinc-600 leading-7">
            Buy, Rent, & Sell, Land, Homes, Business & More
          </p>
        </div>
        <a 
          href="/discover" 
          className="flex items-center gap-2 text-[15px] text-blue-600 hover:underline mt-2"
        >
          Discover the Truth Behind Every Property
          <ChevronRight size={16} />
        </a>
      </div>

      {/* Hero Image Card with Search Bar */}
      <div className="relative">
        <div className="h-[380px] md:h-[320px] sm:h-[260px] rounded-3xl overflow-hidden shadow-xl relative">
          <img 
            src={mainImg} 
            alt="Modern home with pool" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        
        {/* Search Bar positioned inside hero */}
        <div className="absolute left-8 bottom-6 md:left-10 md:bottom-8 right-6 md:right-auto">
          <SearchBar onSearch={navigate} />
        </div>
      </div>
    </section>
  )
}