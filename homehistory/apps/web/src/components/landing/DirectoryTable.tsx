import * as React from 'react'
import { Star } from 'lucide-react'

type DirectoryProfile = {
  id: string
  name: string
  role: string
  rating: number
  months: number
  clients: number
  success: number
  projects: number
}

type Props = {
  profiles: DirectoryProfile[]
}

export function DirectoryTable({ profiles }: Props) {
  const [activeTab, setActiveTab] = React.useState<'lenders' | 'agents' | 'contractors'>('lenders')

  const filteredProfiles = profiles.filter(p => {
    if (activeTab === 'lenders') return p.role.toLowerCase().includes('lender')
    if (activeTab === 'agents') return p.role.toLowerCase().includes('agent')
    if (activeTab === 'contractors') return p.role.toLowerCase().includes('contractor')
    return true
  })

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900 text-center mb-8">
        Top-Rated Lenders, Trusted Contractors,<br />
        and Leading Real Estate Agents
      </h2>

      <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {[
            { key: 'lenders', label: 'Lenders' },
            { key: 'agents', label: 'Agents' },
            { key: 'contractors', label: 'Contractors' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                activeTab === key
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Title</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Rating</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Months Active</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Total Clients</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Success Rate</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Projects</th>
                <th className="text-left py-3 text-[13px] font-medium text-slate-400 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.slice(0, 8).map((profile, index) => (
                <tr 
                  key={profile.id} 
                  className={`border-b border-slate-700/50 ${index % 2 === 0 ? 'bg-slate-800/30' : ''}`}
                >
                  <td className="py-4 text-[14px] text-slate-100 font-medium">{profile.name}</td>
                  <td className="py-4 text-[14px] text-slate-300">{profile.role}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="text-[14px] text-slate-100">{profile.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[14px] text-slate-300">{profile.months}</td>
                  <td className="py-4 text-[14px] text-slate-300">{profile.clients}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-[12px] rounded-full font-medium ${
                      profile.success >= 0.9 
                        ? 'bg-green-900/50 text-green-300'
                        : profile.success >= 0.8 
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {Math.round(profile.success * 100)}%
                    </span>
                  </td>
                  <td className="py-4 text-[14px] text-slate-300">{profile.projects}</td>
                  <td className="py-4">
                    <button className="px-3 py-1 text-[12px] text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredProfiles.slice(0, 6).map((profile) => (
            <div key={profile.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[15px] font-medium text-slate-100">{profile.name}</h3>
                  <p className="text-[13px] text-slate-400">{profile.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-current" />
                  <span className="text-[13px] text-slate-100">{profile.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <span className="text-slate-400">Clients:</span>
                  <span className="text-slate-200 ml-1">{profile.clients}</span>
                </div>
                <div>
                  <span className="text-slate-400">Success:</span>
                  <span className="text-slate-200 ml-1">{Math.round(profile.success * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Active:</span>
                  <span className="text-slate-200 ml-1">{profile.months}m</span>
                </div>
                <div>
                  <span className="text-slate-400">Projects:</span>
                  <span className="text-slate-200 ml-1">{profile.projects}</span>
                </div>
              </div>
              <button className="w-full mt-3 px-3 py-2 text-[13px] text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
