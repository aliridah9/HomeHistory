import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type WindowProps = {
  visible: boolean;
  isErrorWindow?: boolean;
  title?: string;
  size?: 'normal' | 'large' | 'full';
  hasBackIcon?: boolean;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
};

export default function Window({
  visible,
  isErrorWindow = false,
  title,
  hasBackIcon,
  size = 'normal',
  children,
  onClose,
  onBack,
}: WindowProps) {
  const sizeClasses =
    size === 'large' ? 'max-w-2xl' : size === 'full' ? 'w-full h-full rounded-none' : 'max-w-md';

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);
  return (
    <AnimatePresence>
      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className={`relative w-full ${sizeClasses} bg-white rounded-3xl shadow-lg z-10 py-6 max-h-[90vh] overflow-auto scrollbar-hide hide-scrollbar`}
          >
            <div
              className={`flex ${title ? 'justify-between' : 'justify-end'} items-center mb-4 px-6`}
            >
              <div className="flex item-center gap-2">
                {hasBackIcon && (
                  <button
                    onClick={onBack}
                    className="p-1 rounded-full text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="red" stroke="red">
                      <path
                        d="M15 10H5m0 0 5-5m-5 5 5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </button>
                )}

                {title && (
                  <h2
                    id="modal-title"
                    className={`text-lg font-semibold ${
                      isErrorWindow ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {title}
                  </h2>
                )}
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6" />

            <div className="px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
