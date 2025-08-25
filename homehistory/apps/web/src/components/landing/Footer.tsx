import * as React from 'react'
import { Globe, MessageCircle } from 'lucide-react'

export function Footer() {
  const [showAIAssistant, setShowAIAssistant] = React.useState(false)

  return (
    <>
      <footer className="bg-white border-t border-zinc-100">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Company Info</h3>
              <ul className="space-y-3">
                <li><a href="/about" className="text-[14px] text-zinc-600 hover:text-zinc-900">About Us</a></li>
                <li><a href="/careers" className="text-[14px] text-zinc-600 hover:text-zinc-900">Careers</a></li>
                <li><a href="/press" className="text-[14px] text-zinc-600 hover:text-zinc-900">Press</a></li>
                <li><a href="/blog" className="text-[14px] text-zinc-600 hover:text-zinc-900">Blog</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Services</h3>
              <ul className="space-y-3">
                <li><a href="/buy" className="text-[14px] text-zinc-600 hover:text-zinc-900">Buy Properties</a></li>
                <li><a href="/rent" className="text-[14px] text-zinc-600 hover:text-zinc-900">Rent Properties</a></li>
                <li><a href="/sell" className="text-[14px] text-zinc-600 hover:text-zinc-900">Sell Properties</a></li>
                <li><a href="/reports" className="text-[14px] text-zinc-600 hover:text-zinc-900">Property Reports</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="/privacy" className="text-[14px] text-zinc-600 hover:text-zinc-900">Privacy Policy</a></li>
                <li><a href="/terms" className="text-[14px] text-zinc-600 hover:text-zinc-900">Terms of Service</a></li>
                <li><a href="/cookies" className="text-[14px] text-zinc-600 hover:text-zinc-900">Cookie Policy</a></li>
                <li><a href="/licenses" className="text-[14px] text-zinc-600 hover:text-zinc-900">Licenses</a></li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:support@homehistory.com" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                    support@homehistory.com
                  </a>
                </li>
                <li>
                  <a href="tel:+1-555-0123" className="text-[14px] text-zinc-600 hover:text-zinc-900">
                    +1 (555) 012-3456
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Stay in the Know</h3>
              <p className="text-[13px] text-zinc-600 mb-4">
                Get the latest updates and insights delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[14px] font-medium">
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
              <span className="text-[12px] text-zinc-500">History</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Globe size={14} className="text-zinc-400" />
              <select className="text-[12px] text-zinc-500 bg-transparent border-none focus:outline-none">
                <option>English (US)</option>
                <option>Español</option>
                <option>Français</option>
              </select>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowAIAssistant(true)}
          className="h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 text-[15px] font-medium"
        >
          <MessageCircle size={20} />
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
            <p className="text-[14px] text-zinc-600">
              AI Assistant functionality coming soon...
            </p>
          </div>
        </div>
      )}
    </>
  )
}