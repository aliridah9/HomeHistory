import * as React from 'react'
import { getDirectory } from '@/lib/api'

type Row = { id:string; name:string; role:string; rating?:number; months?:number; clients?:number; success?:number; projects?:number }

const tabs: Array<{key:'lenders'|'agents'|'contractors'; label:string}> = [
  { key: 'lenders', label: 'Lenders' },
  { key: 'agents', label: 'Agents' },
  { key: 'contractors', label: 'Contractors' },
]

export function Directory() {
  const [tab, setTab] = React.useState<'lenders'|'agents'|'contractors'>('lenders')
  const [rows, setRows] = React.useState<Row[]>([])
  React.useEffect(()=>{(async()=>{ setRows(await getDirectory(tab)) })()},[tab])
  return (
    <section className="bg-zinc-900 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <h3 className="text-white text-xl font-semibold mb-4">Top-Rated Lenders, Trusted Contractors, and Leading Real Estate Agents</h3>
        <div className="bg-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {tabs.map(t=> (
              <button key={t.key} onClick={()=>setTab(t.key)} className={`h-9 px-3 rounded-full text-sm ${tab===t.key?'bg-white text-zinc-900':'bg-zinc-700 text-zinc-200'}`}>{t.label}</button>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-zinc-100">
              <thead className="text-zinc-300">
                <tr className="text-left">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3">Months Active</th>
                  <th className="py-3 px-3">Total Clients</th>
                  <th className="py-3 px-3">Success Rate</th>
                  <th className="py-3 px-3">Projects</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,8).map((r,i)=> (
                  <tr key={r.id} className={`${i%2?'bg-zinc-800':'bg-zinc-900/30'}`}>
                    <td className="py-3 px-3">{r.name}</td>
                    <td className="py-3 px-3">{r.role}</td>
                    <td className="py-3 px-3">{r.rating?.toFixed(1)}</td>
                    <td className="py-3 px-3">{r.months}</td>
                    <td className="py-3 px-3">{r.clients}</td>
                    <td className="py-3 px-3">{Math.round((r.success||0)*100)}%</td>
                    <td className="py-3 px-3">{r.projects}</td>
                    <td className="py-3 px-3"><button className="h-8 px-3 rounded-full bg-blue-600 text-white">Contact</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden grid grid-cols-1 gap-3">
            {rows.map(r=> (
              <div key={r.id} className="rounded-xl bg-zinc-900 p-4 text-zinc-100">
                <div className="font-medium">{r.name}</div>
                <div className="text-zinc-400 text-sm">{r.role}</div>
                <div className="mt-2 text-sm">Rating {r.rating?.toFixed(1)} • Clients {r.clients}</div>
                <button className="mt-3 h-8 px-3 rounded-full bg-blue-600 text-white">Contact</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


