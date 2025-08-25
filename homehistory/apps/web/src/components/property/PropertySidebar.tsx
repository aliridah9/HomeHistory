import * as React from "react"
import { Phone, Mail, MessageSquare, Calculator, Share2, Heart, BarChart3, MapPin, Clock, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Property {
  id: string
  price: number
  homeHistoryScore: number
  listingType: 'sale' | 'rent'
  daysOnMarket: number
  agent?: {
    name: string
    photo: string
    phone: string
    email: string
    company: string
  }
}

interface PropertySidebarProps {
  property: Property
  isFavorited: boolean
  isCompared: boolean
  onFavorite: () => void
  onShare: () => void
  onCompare: () => void
  onScheduleTour: () => void
  onContactAgent: (data: ContactFormData) => void
  className?: string
}

interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
  tourDate?: string
}

interface MortgageCalculatorProps {
  price: number
  onCalculate: (payment: number) => void
}

function MortgageCalculator({ price, onCalculate }: MortgageCalculatorProps) {
  const [downPayment, setDownPayment] = React.useState(20)
  const [interestRate, setInterestRate] = React.useState(7.5)
  const [loanTerm, setLoanTerm] = React.useState(30)
  const [showCalculator, setShowCalculator] = React.useState(false)

  const calculatePayment = () => {
    const principal = price * (1 - downPayment / 100)
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTerm * 12
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    onCalculate(monthlyPayment)
    return monthlyPayment
  }

  const monthlyPayment = calculatePayment()

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowCalculator(!showCalculator)}
        variant="outline"
        className="w-full justify-start"
      >
        <Calculator className="w-4 h-4 mr-2" />
        Mortgage Calculator
      </Button>

      {showCalculator && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Down Payment: {downPayment}%
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Interest Rate: {interestRate}%
              </label>
              <input
                type="range"
                min="3"
                max="12"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Loan Term: {loanTerm} years
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="15">15 years</option>
                <option value="30">30 years</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Est. Monthly Payment</span>
              <span className="text-lg font-bold text-primary">
                ${Math.round(monthlyPayment).toLocaleString()}/mo
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Principal & Interest only. Excludes taxes, insurance, and HOA.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { bg: 'bg-green-500', text: 'text-green-500', label: 'Excellent' }
  if (score >= 80) return { bg: 'bg-green-400', text: 'text-green-400', label: 'Very Good' }
  if (score >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Good' }
  if (score >= 60) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Fair' }
  return { bg: 'bg-red-500', text: 'text-red-500', label: 'Needs Attention' }
}

const formatPrice = (price: number, type: 'sale' | 'rent') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
  
  return type === 'rent' ? `${formatted}/mo` : formatted
}

export function PropertySidebar({
  property,
  isFavorited,
  isCompared,
  onFavorite,
  onShare,
  onCompare,
  onScheduleTour,
  onContactAgent,
  className
}: PropertySidebarProps) {
  const [contactForm, setContactForm] = React.useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: 'I\'m interested in this property. Please contact me with more information.'
  })
  const [showContactForm, setShowContactForm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const scoreColor = getScoreColor(property.homeHistoryScore)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onContactAgent(contactForm)
      setShowContactForm(false)
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: 'I\'m interested in this property. Please contact me with more information.'
      })
    } catch (error) {
      // Error handling
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Price and Score Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
        {/* Price */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-1">
            {formatPrice(property.price, property.listingType)}
          </h2>
          <p className="text-text-secondary">
            {property.daysOnMarket} days on market
          </p>
        </div>

        {/* HomeHistory Score */}
        <div className="flex items-center justify-center space-x-4 p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg",
            scoreColor.bg
          )}>
            {property.homeHistoryScore}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="font-semibold text-text-primary">HomeHistory Score™</p>
            </div>
            <p className={cn("text-sm font-medium", scoreColor.text)}>
              {scoreColor.label}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onFavorite}
            variant="outline"
            size="sm"
            className={cn(
              "flex-col h-auto py-3",
              isFavorited && "border-red-500 text-red-500 hover:bg-red-50"
            )}
          >
            <Heart className={cn("w-4 h-4 mb-1", isFavorited && "fill-current")} />
            <span className="text-xs">{isFavorited ? 'Saved' : 'Save'}</span>
          </Button>
          
          <Button
            onClick={onShare}
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3"
          >
            <Share2 className="w-4 h-4 mb-1" />
            <span className="text-xs">Share</span>
          </Button>
          
          <Button
            onClick={onCompare}
            variant="outline"
            size="sm"
            className={cn(
              "flex-col h-auto py-3",
              isCompared && "border-primary text-primary hover:bg-primary/10"
            )}
          >
            <BarChart3 className="w-4 h-4 mb-1" />
            <span className="text-xs">{isCompared ? 'Added' : 'Compare'}</span>
          </Button>
        </div>
      </div>

      {/* Contact Agent Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
        {property.agent ? (
          <>
            {/* Agent Info */}
            <div className="flex items-center space-x-3">
              <img
                src={property.agent.photo}
                alt={property.agent.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-text-primary">{property.agent.name}</h3>
                <p className="text-sm text-text-secondary">{property.agent.company}</p>
              </div>
            </div>

            {/* Contact Options */}
            <div className="space-y-2">
              <Button
                onClick={() => setShowContactForm(!showContactForm)}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Agent
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => window.open(`tel:${property.agent?.phone}`)}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                
                <Button
                  onClick={onScheduleTour}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Tour
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <form onSubmit={handleContactSubmit} className="space-y-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="rounded-lg"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="rounded-lg"
                  />
                </div>
                
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-lg"
                />
                
                <textarea
                  placeholder="Message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </>
        ) : (
          <div className="text-center space-y-3">
            <User className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-text-secondary">Agent information not available</p>
            <Button
              onClick={() => setShowContactForm(!showContactForm)}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold"
            >
              Contact for Info
            </Button>
          </div>
        )}
      </div>

      {/* Mortgage Calculator */}
      {property.listingType === 'sale' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <MortgageCalculator
            price={property.price}
            onCalculate={(payment) => {
              // Handle calculation result
            }}
          />
        </div>
      )}

      {/* Property Insights */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">AI Insights</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Market Position</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Well Priced
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Investment Potential</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              High Growth
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Neighborhood Trend</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Rising
            </Badge>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-text-tertiary">
            AI analysis based on market data, comparable sales, and local trends.
          </p>
        </div>
      </div>

      {/* Nearby Properties */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Nearby Properties</h3>
          <Button variant="outline" size="sm" className="rounded-full">
            <MapPin className="w-4 h-4 mr-2" />
            View Map
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-text-secondary">
              3 similar properties within 0.5 miles
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Average price: ${((property.price * 0.95) / 1000).toFixed(0)}K - ${((property.price * 1.05) / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}