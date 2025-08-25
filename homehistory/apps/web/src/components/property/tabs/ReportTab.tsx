import * as React from "react"
import { Shield, AlertTriangle, TrendingUp, MapPin, Wrench, Clock, FileText, Sparkles, Star, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScoreBreakdown {
  quality: number
  safety: number
  value: number
  location: number
  overall: number
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high'
  factors: Array<{
    type: 'structural' | 'environmental' | 'financial' | 'legal'
    description: string
    severity: 'low' | 'medium' | 'high'
    recommendation: string
  }>
}

interface MaintenanceRecord {
  date: string
  type: 'repair' | 'maintenance' | 'inspection' | 'upgrade'
  description: string
  cost?: number
  contractor?: string
  warranty?: string
}

interface OwnershipHistory {
  owner: string
  period: string
  purchasePrice?: number
  salePrice?: number
  duration: string
  notes?: string
}

interface ReportTabProps {
  propertyId: string
  scoreBreakdown: ScoreBreakdown
  aiExplanation: string
  riskAssessment: RiskAssessment
  maintenanceHistory: MaintenanceRecord[]
  ownershipHistory: OwnershipHistory[]
  className?: string
}

interface ScoreCircleProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function ScoreCircle({ score, size = 'md', showLabel = false }: ScoreCircleProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return { color: '#10b981', bg: 'bg-green-500' }
    if (score >= 80) return { color: '#22c55e', bg: 'bg-green-400' }
    if (score >= 70) return { color: '#eab308', bg: 'bg-yellow-500' }
    if (score >= 60) return { color: '#f97316', bg: 'bg-orange-500' }
    return { color: '#ef4444', bg: 'bg-red-500' }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  const { color } = getScoreColor(score)
  const radius = size === 'lg' ? 45 : size === 'md' ? 35 : 25
  const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 4
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold",
            size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'
          )}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <p className="text-xs text-text-secondary mt-1 text-center">
          {getScoreLabel(score)}
        </p>
      )}
    </div>
  )
}

interface ScoreBreakdownCardProps {
  scoreBreakdown: ScoreBreakdown
}

function ScoreBreakdownCard({ scoreBreakdown }: ScoreBreakdownCardProps) {
  const categories = [
    { key: 'quality', label: 'Quality', icon: Star, description: 'Construction quality, materials, and condition' },
    { key: 'safety', label: 'Safety', icon: Shield, description: 'Structural integrity, hazards, and code compliance' },
    { key: 'value', label: 'Value', icon: TrendingUp, description: 'Market value, appreciation potential, and ROI' },
    { key: 'location', label: 'Location', icon: MapPin, description: 'Neighborhood quality, amenities, and accessibility' }
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-2">Overall Score</h3>
        <ScoreCircle score={scoreBreakdown.overall} size="lg" showLabel />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon
          const score = scoreBreakdown[category.key as keyof ScoreBreakdown]
          
          return (
            <div key={category.key} className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary">{category.label}</h4>
                  <p className="text-sm text-text-secondary">{category.description}</p>
                </div>
                <ScoreCircle score={score} size="sm" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment
}

function RiskAssessmentCard({ riskAssessment }: RiskAssessmentCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Shield className="w-4 h-4 text-green-500" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-text-primary">Risk Assessment</h3>
        <Badge className={cn("font-semibold", getRiskColor(riskAssessment.level))}>
          {riskAssessment.level.toUpperCase()} RISK
        </Badge>
      </div>

      <div className="space-y-4">
        {riskAssessment.factors.map((factor, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getRiskIcon(factor.severity)}
                <h4 className="font-semibold text-text-primary capitalize">
                  {factor.type} Risk
                </h4>
              </div>
              <Badge variant="outline" className={cn(
                "text-xs",
                factor.severity === 'high' ? 'border-red-500 text-red-600' :
                factor.severity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                'border-green-500 text-green-600'
              )}>
                {factor.severity}
              </Badge>
            </div>
            
            <p className="text-sm text-text-secondary">{factor.description}</p>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Recommendation:</strong> {factor.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReportTab({
  propertyId,
  scoreBreakdown,
  aiExplanation,
  riskAssessment,
  maintenanceHistory,
  ownershipHistory,
  className
}: ReportTabProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* AI Explanation */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-text-primary">AI Analysis Summary</h2>
          <Badge className="bg-primary text-white text-xs">Powered by AI</Badge>
        </div>
        
        <p className="text-text-primary leading-relaxed text-lg">
          {aiExplanation}
        </p>
      </div>

      {/* Score Breakdown */}
      <ScoreBreakdownCard scoreBreakdown={scoreBreakdown} />

      {/* Risk Assessment */}
      <RiskAssessmentCard riskAssessment={riskAssessment} />

      {/* Maintenance History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-text-primary">Maintenance History</h3>
        </div>

        {maintenanceHistory.length > 0 ? (
          <div className="space-y-4">
            {maintenanceHistory.map((record, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {record.type === 'repair' && <Wrench className="w-5 h-5 text-primary" />}
                  {record.type === 'maintenance' && <Clock className="w-5 h-5 text-primary" />}
                  {record.type === 'inspection' && <FileText className="w-5 h-5 text-primary" />}
                  {record.type === 'upgrade' && <TrendingUp className="w-5 h-5 text-primary" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-text-primary">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {record.type}
                      </Badge>
                    </div>
                    {record.cost && (
                      <span className="font-semibold text-primary">
                        ${record.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-2">{record.description}</p>
                  
                  {(record.contractor || record.warranty) && (
                    <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                      {record.contractor && (
                        <span>Contractor: {record.contractor}</span>
                      )}
                      {record.warranty && (
                        <span>Warranty: {record.warranty}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">No maintenance records available</p>
        )}
      </div>

      {/* Ownership History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-text-primary">Ownership History</h3>
        </div>

        {ownershipHistory.length > 0 ? (
          <div className="space-y-4">
            {ownershipHistory.map((owner, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-text-primary">{owner.owner}</h4>
                    <span className="text-sm text-text-secondary">{owner.duration}</span>
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-2">{owner.period}</p>
                  
                  {(owner.purchasePrice || owner.salePrice) && (
                    <div className="flex items-center space-x-4 text-sm">
                      {owner.purchasePrice && (
                        <span className="text-green-600">
                          Purchased: ${owner.purchasePrice.toLocaleString()}
                        </span>
                      )}
                      {owner.salePrice && (
                        <span className="text-blue-600">
                          Sold: ${owner.salePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {owner.notes && (
                    <p className="text-xs text-text-tertiary mt-2">{owner.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">No ownership history available</p>
        )}
      </div>

      {/* Report Footer */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-primary">HomeHistory Report™</h3>
        </div>
        
        <p className="text-sm text-text-secondary mb-4">
          This comprehensive report is generated using advanced AI analysis of over 50 data points 
          including public records, market trends, and property-specific information.
        </p>
        
        <div className="flex items-center justify-center space-x-6 text-xs text-text-tertiary">
          <span>Report ID: {propertyId}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
          <span>Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}