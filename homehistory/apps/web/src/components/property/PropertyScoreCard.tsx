import * as React from 'react'
import { TrendingUp, Shield, DollarSign, MapPin, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreBreakdown {
  quality: { score: number; factors: any }
  safety: { score: number; factors: any }
  value: { score: number; factors: any }
  location: { score: number; factors: any }
}

interface PropertyScoreCardProps {
  score: number
  breakdown: ScoreBreakdown
  explanation: string
  confidence: number
  dataCompleteness: number
  lastCalculated: string
  className?: string
}

export function PropertyScoreCard({
  score,
  breakdown,
  explanation,
  confidence,
  dataCompleteness,
  lastCalculated,
  className
}: PropertyScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 80) return 'text-green-500 bg-green-50 border-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Attention'
  }

  const categories = [
    {
      name: 'Quality',
      score: breakdown.quality.score,
      icon: TrendingUp,
      description: 'Property condition and maintenance',
      color: 'text-blue-600'
    },
    {
      name: 'Safety',
      score: breakdown.safety.score,
      icon: Shield,
      description: 'Security and structural integrity',
      color: 'text-purple-600'
    },
    {
      name: 'Value',
      score: breakdown.value.score,
      icon: DollarSign,
      description: 'Market value and investment potential',
      color: 'text-green-600'
    },
    {
      name: 'Location',
      score: breakdown.location.score,
      icon: MapPin,
      description: 'Neighborhood and amenities',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">HomeHistory Score™</h2>
            <p className="text-sm text-text-secondary mt-1">
              Comprehensive property analysis powered by AI
            </p>
          </div>
          <div className={cn(
            'w-20 h-20 rounded-full border-4 flex items-center justify-center',
            getScoreColor(score)
          )}>
            <div className="text-center">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs">/ 100</div>
            </div>
          </div>
        </div>
        
        <div className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold',
          getScoreColor(score)
        )}>
          {getScoreLabel(score)}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={cn('w-4 h-4', category.color)} />
                    <span className="font-medium text-text-primary">{category.name}</span>
                  </div>
                  <span className="font-semibold text-text-primary">{category.score}/100</span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full transition-all',
                      category.score >= 90 ? 'bg-green-500' :
                      category.score >= 80 ? 'bg-green-400' :
                      category.score >= 70 ? 'bg-yellow-500' :
                      category.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary">{category.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Explanation */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-start space-x-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">AI Analysis</h3>
            <p className="text-sm text-text-secondary">Generated by GPT-4</p>
          </div>
        </div>
        <p className="text-sm text-text-primary leading-relaxed">{explanation}</p>
      </div>

      {/* Metadata */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center space-x-4">
            <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
            <span>Data Completeness: {(dataCompleteness * 100).toFixed(0)}%</span>
          </div>
          <span>Updated: {new Date(lastCalculated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

