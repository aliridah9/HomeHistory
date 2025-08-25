import * as React from 'react'

type Props = {
  overline?: string
  title: string
  description: string
  primaryButton: string
  secondaryButton?: string
  imageName: string
  imageAlt: string
  reverse?: boolean
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
}

export function TwoColPromo({ 
  overline, 
  title, 
  description, 
  primaryButton, 
  secondaryButton, 
  imageName, 
  imageAlt, 
  reverse = false,
  onPrimaryClick,
  onSecondaryClick 
}: Props) {
  const textContent = (
    <div className="flex flex-col justify-center space-y-6">
      {overline && (
        <span className="text-[13px] text-zinc-500 font-medium uppercase tracking-wide">
          {overline}
        </span>
      )}
      <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900 leading-tight">
        {title}
      </h2>
      <p className="text-[15px] text-zinc-600 leading-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={onPrimaryClick}
          className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-[15px] font-medium"
        >
          {primaryButton}
        </button>
        {secondaryButton && (
          <button 
            onClick={onSecondaryClick}
            className="h-11 px-5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[15px] font-medium"
          >
            {secondaryButton}
          </button>
        )}
      </div>
    </div>
  )

  const imageContent = (
    <div className="flex items-center justify-center">
      <div className="bg-zinc-50 rounded-2xl p-2 w-full max-w-md">
        <img 
          src={`/src/assets/${imageName}`} 
          alt={imageAlt}
          className="w-full h-64 object-cover rounded-xl"
          loading="lazy"
        />
      </div>
    </div>
  )

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:grid-flow-col-dense' : ''}`}>
        <div className={reverse ? 'lg:col-start-2' : ''}>
          {textContent}
        </div>
        <div className={reverse ? 'lg:col-start-1' : ''}>
          {imageContent}
        </div>
      </div>
    </section>
  )
}
