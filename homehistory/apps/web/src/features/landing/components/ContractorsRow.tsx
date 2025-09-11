import * as React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
type Contractor = {
  id: string;
  name: string;
  image: string;
  rating: number;
  clients: number;
};

type Props = {
  contractors: Contractor[];
};

export default function ContractorsRow({ contractors }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % contractors.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + contractors.length) % contractors.length);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6">
      <div className="flex items-center justify-between mb-16">
        <h2 className="text-[24px] md:text-[28px] font-bold text-zinc-900">
          Discover Trusted Contractors,
          <br />
          Connect with the Right Experts
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Previous contractor"
          >
            <ChevronLeft color="#24292e" size={16} />
          </button>
          <button
            onClick={nextSlide}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
            aria-label="Next contractor"
          >
            <ChevronRight color="#24292e" size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {contractors.slice(0, 3).map((contractor, index: number) => (
          <div
            key={contractor.id}
            className={`relative bg-white h-[400px] rounded-2xl shadow-md p-6 bg-cover bg-center bg-no-repeat bg-center bg-cover ${index === 1 ? '-mt-8' : ''}`}
            style={{ backgroundImage: `url(src/assets/${contractor.image})` }}
          >
            <div className="flex items-start w-[250px] absolute top-64 left-28">
              <div className="flex-1 rounded-[12px] bg-white/85 backdrop-blur-[4.75px] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-900 text-xl font-bold">
                    Hi, I'm {contractor.name.split(' ')[0]}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-gray-500 mb-2">{contractor.name}</h3>
                <div className="border-t border-gray-300 my-3" />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-base font-medium text-gray-500">{contractor.rating}</span>
                  </div>

                  <span className="text-base text-gray-900 font-semibold">
                    {contractor.clients} Happy clients
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button className="h-11 px-6 btn-outline text-[15px] font-medium">
          See All Contractors
        </button>
      </div>
    </section>
  );
}
