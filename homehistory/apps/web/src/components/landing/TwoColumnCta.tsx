import * as React from 'react'

type Props = {
  title: string
  subtitle?: string
  body: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  image: string
  reverse?: boolean
}

export function TwoColumnCta({ title, subtitle, body, ctaPrimary, ctaSecondary, image, reverse }: Props) {
  const img = new URL(`/src/assets/${image}`, import.meta.url).href
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <div>
          {subtitle && <div className="text-sm text-zinc-500 mb-2">{subtitle}</div>}
          <h3 className="text-2xl md:text-3xl font-semibold text-zinc-900 mb-2 whitespace-pre-line">{title}</h3>
          <p className="text-zinc-600">{body}</p>
          <div className="mt-4 flex gap-3">
            <a href={ctaPrimary.href} className="h-10 px-4 rounded-full bg-blue-600 text-white inline-flex items-center">{ctaPrimary.label}</a>
            {ctaSecondary && (
              <a href={ctaSecondary.href} className="h-10 px-4 rounded-full border border-zinc-200 inline-flex items-center">{ctaSecondary.label}</a>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <img src={img} alt="" className="rounded-xl w-full h-64 object-cover" loading="lazy"/>
        </div>
      </div>
    </section>
  )
}


