import * as React from 'react';
import { Star } from 'lucide-react';

type DirectoryProfile = {
  id: string;
  name: string;
  role: string;
  rating: number;
  months: number;
  clients: number;
  success: number;
  projects: number;
  profile: string;
};

type Props = {
  profiles: DirectoryProfile[];
};

export default function DirectoryTable({ profiles }: Props) {
  const [activeTab, setActiveTab] = React.useState<'lenders' | 'agents' | 'contractors'>('lenders');

  const filteredProfiles = profiles.filter((p) => {
    if (activeTab === 'lenders') return p.role.toLowerCase().includes('lender');
    if (activeTab === 'agents') return p.role.toLowerCase().includes('agent');
    if (activeTab === 'contractors') return p.role.toLowerCase().includes('contractor');
    return true;
  });

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-8">
      <h2 className="text-[24px] text-start md:text-[28px] text-zinc-900 text-center mb-8 font-bold">
        Top-Rated Lenders, Trusted Contractors,
        <br />
        and Leading Real Estate Agents
      </h2>

      <div className="flex gap-1 mb-12">
        {[
          { key: 'lenders', label: 'Lenders' },
          { key: 'agents', label: 'Agents' },
          { key: 'contractors', label: 'Contractors' },
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

      <div className="bg-[#051425] rounded-2xl p-6 shadow-lg shadow-[0_-30px_30px_-10px_#CFF2FF,0_20px_30px_-10px_#CFF2FF]">
        {/* Tabs */}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide w-12">
                  #
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Rating
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Projects
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Months Active
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Total Clients
                </th>
                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Availibility
                </th>

                <th className="text-left py-3 text-[13px] font-medium text-white uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.slice(0, 8).map((profile) => (
                <tr key={profile.id} className="border-b border-slate-700/50">
                  <td className="py-4 text-[14px] text-gray-400 font-medium">{profile.id}</td>
                  <td className="py-4 text-[14px] text-gray-400 font-medium flex items-center gap-1">
                    <img
                      src={`src/assets/${profile.profile}`}
                      alt="profile"
                      width={20}
                      height={20}
                      className="rounded"
                    />
                    {profile.name}
                  </td>
                  <td className="py-4 text-[14px] text-gray-400">{profile.role}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="text-[14px] text-gray-400">{profile.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[14px] text-gray-400">{profile.projects}</td>
                  <td className="py-4 text-[14px] text-gray-400">{profile.months}</td>
                  <td className="py-4 text-[14px] text-gray-400">{profile.clients}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 text-[12px] font-medium text-gray-400">
                      {Math.round(profile.success * 100)}%
                    </span>
                  </td>

                  <td className="py-4">
                    <button className="px-3 py-1 text-[12px] text-slate-300">
                      {profile.success >= 0.9 ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M2.5 14.1663L7.5 9.16634L10.8333 12.4997L17.5 5.83301"
                            stroke="#2EBC64"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M11.667 5.83301H17.5003V11.6663"
                            stroke="#2EBC64"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M17.5 5.83366L12.5 10.8337L9.16667 7.50033L2.5 14.167"
                            stroke="#C61A23"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M8.33398 14.167L2.50065 14.167L2.50065 8.33366"
                            stroke="#C61A23"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      )}
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
  );
}
