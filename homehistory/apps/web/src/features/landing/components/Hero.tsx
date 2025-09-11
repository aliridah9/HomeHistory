import * as React from 'react';
import { SearchBar } from './SearchBar';
import mainImg from '../../../assets/main-img.jpg';
import { Link } from 'react-router-dom';

export default function Hero() {
  const navigate = (q: string) => {
    window.location.href = `/search?intent=sale&type=residential&q=${encodeURIComponent(q)}`;
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-[40px] lg:text-[48px] font-semibold text-gray-900 leading-[1.1] mb-4">
            List. Search. Verify. Own.
          </h1>
          <p className="text-[32px] text-gray-900 leading-7 font-semibold">
            Buy, Rent, & Sell, Land, Homes, Business & More
          </p>
        </div>
        <Link
          to="/discover"
          className="flex items-center gap-2 text-[15px] text-blue-500 mt-2 no-underline "
        >
          <span className="underline font-semibold">Discover the Truth</span>
          <span className="text-gray-500 font-semibold no-underline">Behind Every Property</span>
        </Link>
      </div>

      {/* Hero Image Card with Search Bar */}
      <div className="relative shadow-[0_-30px_30px_-10px_#CFF2FF,0_20px_30px_-10px_#CFF2FF]">
        <div className=" md:h-[700px] sm:h-[500px] rounded-3xl overflow-hidden shadow-xl relative">
          <img src={mainImg} alt="Modern home with pool" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        {/* Search Bar positioned inside hero */}
        <div className="absolute left-[calc(50%-(820px/2))]  bottom-6 right-6 md:left-[calc(50%-(820px/2))] md:bottom-4 md:right-auto">
          <SearchBar onSearch={navigate} />
        </div>
      </div>
    </section>
  );
}
