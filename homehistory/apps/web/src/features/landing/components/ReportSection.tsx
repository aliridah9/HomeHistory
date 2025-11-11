import * as React from 'react'

export function ReportSection() {
  const leftImg = new URL('/src/assets/report-img.jpg', import.meta.url).href
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-zinc-900">Access a detailed REPORT on any home, land, or commercial space</h2>
        <div className="hidden md:flex gap-2">
          <button aria-label="Previous" className="w-8 h-8 rounded-full border bg-white">‹</button>
          <button aria-label="Next" className="w-8 h-8 rounded-full border bg-white">›</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-md relative">
          <img src={leftImg} alt="Property report" className="w-full h-72 md:h-80 object-cover" loading="lazy"/>
          <span className="absolute left-4 top-4 bg-white/90 text-sm px-3 py-1 rounded-full shadow">Check now</span>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl shadow-md bg-white p-4 h-36 relative">
            {/* Map placeholder */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <svg viewBox="0 0 300 140" className="w-full h-full">
                <rect width="300" height="140" fill="#eef2ff"/>
                <path d="M0 40 L80 60 L140 30 L220 70 L300 50" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                <circle cx="220" cy="70" r="6" fill="#10b981"/>
              </svg>
            </div>
          </div>
          <div className="rounded-2xl shadow-md bg-white p-4 h-36 relative">
            {/* Line chart placeholder */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <svg viewBox="0 0 300 140" className="w-full h-full">
                <rect width="300" height="140" fill="#f1f5f9"/>
                <polyline points="0,120 40,110 80,90 120,100 160,70 200,80 240,40 300,60" fill="none" stroke="#22c55e" strokeWidth="3"/>
              </svg>
            </div>
            <span className="absolute right-4 top-4 bg-zinc-800 text-white text-xs px-2 py-1 rounded-full">Score 8/10</span>
            <span className="absolute left-4 bottom-4 text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded-full">Trending ↑</span>
          </div>
        </div>
      </div>
    </section>
  )
}


