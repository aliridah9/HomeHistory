import * as React from 'react';

import imageUrl from '@/assets/pexels-thirdman.png';
type Props = {
  innerTitle: string[];
  title: string;
  description: string[];
  primaryButton: string[];
  imageAlt: string;
  onPrimaryClick?: () => void;
};

export default function TwoColPromo({
  innerTitle,
  title,
  description,
  primaryButton,
  imageAlt,
  onPrimaryClick,
}: Props) {
  const [selected, setSelected] = React.useState<number>(0);
  const textContent = (
    <div className="flex flex-col justify-center space-y-6">
      <h2 className="text-gray-900 text-2xl font-bold">{innerTitle[selected]}</h2>
      <p className="text-[15px] text-zinc-600 leading-6 whitespace-pre-line">
        {description[selected]}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPrimaryClick}
          className="h-11 py-3 px-6 btn-outline text-[16px] flex items-center duration-300"
        >
          {primaryButton[selected]}
        </button>
      </div>
    </div>
  );

  const imageContent = (
    <div className="flex items-center justify-center">
      <div className="bg-zinc-50 rounded-2xl p-2 w-full">
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
        <h2 className="text-[24px] mb-8 md:text-[28px] font-bold text-zinc-900 leading-tight whitespace-pre-line">
          {title}
        </h2>
        <div className="flex text-gray-900">
          {['List Your Property', 'Find an Agent'].map((title: string, index: number) => (
            <div
              key={index}
              onClick={() => setSelected(index)}
              className={`cursor-pointer pr-12 px-7 py-4 pb-2 transition-all duration-500 ease-in-out ${
                selected === index ? 'bg-gray-100 text-white' : 'bg-white text-black'
              }`}
              style={
                selected === 0
                  ? {
                      borderTopLeftRadius: '1.5rem',
                      borderTopRightRadius: '5rem',
                      clipPath: 'polygon(0 0, 80% 0, 100% 100%, 0% 100%)',
                      transition: 'all 0.5s ease',
                    }
                  : selected === 1
                    ? {
                        borderTopLeftRadius: '10rem',
                        borderTopRightRadius: '10rem',
                        clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)',
                        paddingLeft: '3rem',
                        paddingRight: '3rem',
                        transition: 'all 0.5s ease',
                      }
                    : {}
              }
            >
              <div
                className={
                  selected === index
                    ? 'text-white py-2 px-6 bg-black rounded-3xl transition-colors duration-500'
                    : 'text-gray-400 transition-colors duration-500'
                }
              >
                {title}
              </div>
            </div>
          ))}
        </div>

        <div
          className={`
                    flex gap-8 p-8 bg-gray-100
                    rounded-tr-3xl rounded-br-3xl rounded-bl-3xl
                    ${selected === 1 ? 'rounded-tl-3xl' : 'rounded-tl-none'}
                    transition-all duration-500`}
        >
          <div className={`w-full lg:w-1/2 ${selected === 1 ? 'order-2' : 'order-1'}`}>
            {textContent}
          </div>

          <div className={`w-full lg:w-1/2 ${selected === 1 ? 'order-1' : 'order-2'}`}>
            {imageContent}
          </div>
        </div>
      </div>
    </section>
  );
}
