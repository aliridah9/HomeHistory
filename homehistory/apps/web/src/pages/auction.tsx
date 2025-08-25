import * as React from 'react'

export default function AuctionPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-zinc-900 mb-4">Property Auctions</h1>
        <p className="text-lg text-zinc-600 mb-8">
          Bid on properties in live and online auctions
        </p>
        <button
          onClick={() => window.history.back()}
          className="h-11 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}