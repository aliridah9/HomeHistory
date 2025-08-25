import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import reportImg from '../../assets/report-img.jpg'

export function ReportShowcase() {
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900">
          Access a detailed REPORT on any home, land, or commercial space.
        </h2>
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Previous report"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Next report"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <span className="px-3 py-1 text-[12px] font-medium bg-blue-600 text-white rounded-full">
                Check now
              </span>
            </div>
          </div>
        </div>

        {/* Right column with two mini cards */}
        <div className="flex flex-col gap-4">
          {/* Map snapshot card */}
          <div className="bg-white rounded-2xl shadow-md p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-zinc-700">Location Map</span>
              <span className="px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded-full font-medium">
                Score 8/10
              </span>
            </div>
            <div className="h-24 bg-zinc-100 rounded-lg flex items-center justify-center mb-3">
              {/* Simple map placeholder SVG */}
              <svg width="60" height="40" viewBox="0 0 60 40" className="text-zinc-400">
                <rect x="10" y="10" width="40" height="20" fill="currentColor" opacity="0.3" rx="2"/>
                <circle cx="30" cy="20" r="4" fill="#2563eb"/>
                <path d="M15 25 L25 15 L35 25 L45 15" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>

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
                <circle cx="70" cy="10" r="2" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
