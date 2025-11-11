import * as React from 'react';

import imageUrl from '@/assets/finance-your-future.jpg';
type Props = {
  innerTitle: string;
  title: string;
  description: string;
  primaryButton: string;
  imageAlt: string;
  onPrimaryClick?: () => void;
};

export default function FinanceFuture({
  innerTitle,
  title,
  description,
  primaryButton,
  imageAlt,
  onPrimaryClick,
}: Props) {
  const textContent = (
    <div className="flex flex-col justify-center space-y-6">
      <h2 className="text-gray-900 text-2xl font-bold whitespace-pre-line">{innerTitle}</h2>
      <p className="text-[15px] text-zinc-600 leading-6 whitespace-pre-line">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPrimaryClick}
          className="h-11 py-3 px-6 btn-outline text-[16px] flex items-center duration-300"
        >
          {primaryButton}
        </button>
      </div>
    </div>
  );

  const imageContent = (
    <div className="flex items-center justify-center">
      <div className="rounded-2xl w-full">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-64 object-cover rounded-xl"
          loading="lazy"
        />
      </div>
    </div>
  );

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex flex-col">
        <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900 leading-tight whitespace-pre-line">
          {title}
        </h2>
        <div className=" flex gap-8 py-8 rounded-3xl transition-all duration-500">
          <div className="w-full lg:w-1/2">{imageContent}</div>
          <div className="w-full lg:w-1/2">{textContent}</div>
        </div>
      </div>
    </section>
  );
}
