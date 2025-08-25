import * as React from 'react'
import logoImg from '../../assets/logo.jpg'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-[64px] border-b border-zinc-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            alt="HomeHistory" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-[18px] font-semibold text-zinc-900">HomeHistory</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/buy" className="text-[15px] text-zinc-700 hover:text-zinc-900">Buy</a>
          <a href="/rent" className="text-[15px] text-zinc-700 hover:text-zinc-900">Rent</a>
          <a href="/sell" className="text-[15px] text-zinc-700 hover:text-zinc-900">Sell</a>
          <a href="/auction" className="text-[15px] text-zinc-700 hover:text-zinc-900">Auction</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a 
            href="/list" 
            className="h-11 px-5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[15px] flex items-center"
          >
            List Your Property
          </a>
          <a 
            href="/auth" 
            className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-[15px] flex items-center"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}