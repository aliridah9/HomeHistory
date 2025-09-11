import * as React from 'react';
import { Facebook, Globe, Home, Instagram, Mail, Phone, Send, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const [showAIAssistant, setShowAIAssistant] = React.useState(false);

  return (
    <>
      <footer className="border-t border-zinc-100 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Company Info</h3>
              <div className="flex gap-16">
                <ul className="space-y-3">
                  <li>
                    <Link to="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                      Real Estate News
                    </Link>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li>
                    <Link to="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:support@homehistory.com"
                    className="text-[14px] text-zinc-600 hover:text-zinc-900 flex items-center gap-2"
                  >
                    <Mail size={15} />
                    support@homehistory.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+1-555-0123"
                    className="text-[14px] text-zinc-600 hover:text-zinc-900 flex items-center gap-2"
                  >
                    <Phone size={15} />
                    +1 (555) 012-3456
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Stay in the Know</h3>
              <p className="text-[13px] text-zinc-600 mb-4">
                Subscribe to our newsletter for the latest updates, and valuable insights. Don't
                miss out; be part of our community!
              </p>
              <div className="flex gap-2 bg-white p-1.5 rounded-3xl border border-[rgba(229,231,234,1)] bg-white shadow-[0_1px_15.5px_0_rgba(10,23,49,0.14)]">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 h-7 px-3 text-[14px] text-gray-900 focus:outline-none focus:none focus:none rounded-3xl"
                />
                <button className="flex h-8 items-center gap-2 px-2 btn-dark text-[14px] font-small">
                  <Send size={15} />
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-100">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-black p-1 rounded">
                  <Home color="white" size={12} />
                </div>
                History
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Globe size={14} className="text-zinc-400" />
                <select className="text-[12px] text-zinc-500 bg-transparent border-none focus:outline-none  cursor-pointer">
                  <option>English (US)</option>
                  <option>Español</option>
                  <option>Français</option>
                </select>
              </div>
              <div className="flex gap-6 cursor-pointer">
                <Twitter color="#24292e" size={15} />
                <Facebook color="#24292e" size={15} />
                <Instagram color="#24292e" size={15} />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowAIAssistant(true)}
          className="ai-gradient relative shadow-[0_4px_7.5px_0_rgba(7,16,34,0.15)] h-12 px-4 text-black rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-1 text-[12px] font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
          >
            <g clip-path="url(#clip0_2193_2368)">
              <path
                d="M3.75033 18.3337V14.167M3.75033 5.83366V1.66699M1.66699 3.75033H5.83366M1.66699 16.2503H5.83366M10.8337 2.50033L9.38851 6.25771C9.1535 6.86874 9.036 7.17425 8.85327 7.43123C8.69132 7.65899 8.49232 7.85798 8.26456 8.01993C8.00758 8.20266 7.70207 8.32017 7.09104 8.55518L3.33366 10.0003L7.09105 11.4455C7.70207 11.6805 8.00758 11.798 8.26456 11.9807C8.49232 12.1427 8.69132 12.3417 8.85327 12.5694C9.036 12.8264 9.1535 13.1319 9.38851 13.7429L10.8337 17.5003L12.2788 13.7429C12.5138 13.1319 12.6313 12.8264 12.8141 12.5694C12.976 12.3417 13.175 12.1427 13.4028 11.9807C13.6597 11.798 13.9653 11.6805 14.5763 11.4455L18.3337 10.0003L14.5763 8.55518C13.9652 8.32017 13.6597 8.20266 13.4028 8.01993C13.175 7.85798 12.976 7.65899 12.8141 7.43123C12.6313 7.17425 12.5138 6.86874 12.2788 6.25771L10.8337 2.50033Z"
                stroke="#24292E"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_2193_2368">
                <rect width="20" height="20" fill="white" />
              </clipPath>
            </defs>
          </svg>
          AI Search
        </button>
      </div>

      {/* AI Assistant Drawer (placeholder) */}
      {showAIAssistant && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-end">
          <div className="bg-white w-full max-w-md h-96 rounded-t-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold">AI Assistant</h3>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <p className="text-[14px] text-zinc-600">AI Assistant functionality coming soon...</p>
          </div>
        </div>
      )}
    </>
  );
}
