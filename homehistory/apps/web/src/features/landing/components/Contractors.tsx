import * as React from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const imgs = [
  'trusted-contractors-1.jpg',
  'trusted-contractors-2.jpg',
  'trusted-contractors-3.jpg',
];
const names = ['Cooper Phillips', 'Justin Dias', 'Kevin Scott'];

export function Contractors() {
  const [idx, setIdx] = React.useState(0);
  const cycle = (d: number) => setIdx((i) => (i + d + imgs.length) % imgs.length);
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <h3 className="text-xl font-semibold text-zinc-900 mb-6">
        Discover Trusted Contractors, Connect with the Right Experts
      </h3>
      <div className="relative">
        <div className="absolute right-0 -top-12 flex gap-2">
          <button
            aria-label="Previous"
            onClick={() => cycle(-1)}
            className="w-8 h-8 rounded-full border bg-white flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next"
            onClick={() => cycle(1)}
            className="w-8 h-8 rounded-full border bg-white flex items-center justify-center"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {new Array(3).fill(0).map((_, i) => {
            const n = (idx + i) % imgs.length;
            const src = new URL(`/src/assets/${imgs[n]}`, import.meta.url).href;
            return (
              <div key={i} className="rounded-2xl shadow-md overflow-hidden bg-white">
                <img src={src} alt={names[n]} className="h-44 w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <div className="text-sm text-zinc-600">
                    Hi, I'm <span className="font-medium text-zinc-900">{names[n]}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" /> 4.9
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-600">Happy clients</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
