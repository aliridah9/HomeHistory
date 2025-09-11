import React, { useEffect, useState } from 'react';
import logoImg from '../../assets/logo.jpg';
import { Link } from 'react-router-dom';
import Auth from '@/features/auth/Auth';
import { SearchBar } from '@/features/landing/components/SearchBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import Window from '@/libs/lib-window/Window';
import MainFilterWindow from '@/features/landing/components/MainFilterWindow';

export function Navbar() {
  const [isAuthWindow, setIsAuthWindow] = useState<boolean>(false);

  const [isSecondNavbar, setIsSecondNavbar] = useState(false);
  const [filterBy, setFilterBy] = useState('');
  const [isFilterWindow, setIsFilterWindow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 900) {
        setIsSecondNavbar(true);
      } else {
        setIsSecondNavbar(false);
      }
    };

    // Attach listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 h-[64px] border-b border-gray-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to={'/'} className="flex items-center gap-3 cursor-pointer">
            <img src={logoImg} alt="HomeHistory" className="w-8 h-8 rounded object-cover" />
            <span className="text-[18px] font-semibold text-gray-900">HomeHistory</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center">
            <Link
              to="/buy"
              className="text-[16px] text-gray-900 hover:bg-gray-100 hover: px-5 py-2 rounded-3xl duration-300"
            >
              Buy
            </Link>
            <Link
              to="/rent"
              className="text-[16px] text-gray-900 hover:bg-gray-100 hover: px-5 py-2 rounded-3xl duration-300"
            >
              Rent
            </Link>
            <Link
              to="/sell"
              className="text-[16px] text-gray-900 hover:bg-gray-100 hover: px-5 py-2 rounded-3xl duration-300"
            >
              Sell
            </Link>
            <Link
              to="/auction"
              className="text-[16px] text-gray-900 hover:bg-gray-100 hover: px-5 py-2 rounded-3xl duration-300"
            >
              Auction
            </Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/list"
              className="h-11 py-3 px-6 btn-outline text-[16px] flex items-center duration-300"
            >
              List Your Property
            </Link>
            <button
              // to="/auth"
              onClick={() => setIsAuthWindow(true)}
              className="h-11 px-5 btn-primary  text-[16px] flex items-center duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
        {isSecondNavbar && (
          <AnimatePresence>
            <motion.nav
              initial={{ y: -40, opacity: 0, zIndex: -1 }}
              animate={{ y: 0, opacity: 1, zIndex: -1 }}
              exit={{ y: -80, opacity: 0, zIndex: 50 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="border-b border-[#E5E7EA] py-10 z-50 h-[64px] border-b border-zinc-100 bg-gray-50 flex items-center justify-center"
            >
              <SearchBar onSearch={() => {}} isNavbar={true} />
              <div
                className="ml-4 flex items-center gap-1 cursor-pointer bg-transparent border border-[#E5E7EA] px-4 py-3 rounded-3xl hover:bg-tertiary-50"
                onClick={() => setIsFilterWindow(true)}
              >
                <Settings2 color="#000000" size={20} />
                <div className="text-black">Filters</div>
              </div>
            </motion.nav>
          </AnimatePresence>
        )}
      </nav>

      {isAuthWindow && (
        <Auth isVisible={isAuthWindow} emitVisibility={() => setIsAuthWindow(false)} />
      )}

      {isFilterWindow && (
        <Window
          title="Filters"
          visible={isFilterWindow}
          onClose={() => {
            setFilterBy('');
            setIsFilterWindow(false);
          }}
          size="large"
        >
          <MainFilterWindow />
        </Window>
      )}
    </>
  );
}
