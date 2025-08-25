import * as React from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

type Contractor = {
  id: string
  name: string
  image: string
  rating: number
  clients: number
}

type Props = {
  contractors: Contractor[]
}

export function ContractorsRow({ contractors }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % contractors.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + contractors.length) % contractors.length)
  }

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900">
          Discover Trusted Contractors,<br />
          Connect with the Right Experts
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Previous contractor"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={nextSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Next contractor"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {contractors.slice(0, 3).map((contractor, index) => (
          <div key={contractor.id} className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={`/src/assets/${contractor.image}`} 
                alt={contractor.name}
                className="w-16 h-16 rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 text-[10px] bg-blue-100 text-blue-700 rounded-full font-medium">
                    Hi, I'm {contractor.name.split(' ')[0]}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">
                  {contractor.name}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-[13px] font-medium text-zinc-700">
                      {contractor.rating}
                    </span>
                  </div>
                  <span className="text-[13px] text-zinc-500">
                    {contractor.clients} Happy clients
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button className="h-11 px-6 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[15px] font-medium">
          See All Contractors
        </button>
      </div>
    </section>
  )
}
