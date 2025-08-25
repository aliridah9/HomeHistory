import * as React from "react"
import { ArrowRight, Shield, Brain, Users, Star, CheckCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NaturalLanguageSearch } from "@/components/search/NaturalLanguageSearch"
import { Container } from "@/components/layout/Layout"
import { cn } from "@/lib/utils"

interface TrustIndicator {
  icon: React.ElementType
  title: string
  description: string
  stats?: string
}

interface HeroSectionProps {
  onSearch: (query: string) => void
  onGetStarted?: () => void
  isSearchLoading?: boolean
  className?: string
}

const TRUST_INDICATORS: TrustIndicator[] = [
  {
    icon: Shield,
    title: "Verified Data",
    description: "Every property report backed by verified public records and professional inspections",
    stats: "99.9% Accuracy"
  },
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning analyzes thousands of data points to give you the complete picture",
    stats: "50M+ Data Points"
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    description: "Join thousands of buyers, agents, and investors making smarter real estate decisions",
    stats: "25,000+ Users"
  }
]

const FEATURED_STATS = [
  { label: "Properties Analyzed", value: "2.3M+", icon: TrendingUp },
  { label: "Average Score Accuracy", value: "94.2%", icon: Star },
  { label: "Money Saved", value: "$127M+", icon: Shield },
  { label: "Reports Generated", value: "180K+", icon: CheckCircle }
]

export function HeroSection({
  onSearch,
  onGetStarted,
  isSearchLoading = false,
  className
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const handleSuggestionClick = (suggestion: any) => {
    handleSearch(suggestion.query)
  }

  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-b from-gray-50 to-white", className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-[#007AFF]/10 to-[#BF5AF2]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-[#BF5AF2]/10 to-[#007AFF]/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <Container className="relative z-10 py-16 lg:py-24">
        {/* Hero Content */}
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <Badge className="bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] text-white border-0 px-4 py-2 text-sm font-medium">
              🏠 The Carfax for Real Estate
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              Discover Your Perfect Home with
              <span className="block bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] bg-clip-text text-transparent">
                AI-Powered Intelligence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Get the complete story behind every property with HomeHistory's comprehensive reports, 
              AI-powered scoring, and verified data from thousands of sources.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto space-y-6">
            <NaturalLanguageSearch
              onSearch={handleSearch}
              onSuggestionClick={handleSuggestionClick}
              isLoading={isSearchLoading}
              size="large"
              className="w-full"
            />
            
            {/* Search Example */}
            <p className="text-sm text-text-tertiary">
              Try: "Find me a modern family home with a big backyard under $500k" or "Cozy condo near downtown"
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] hover:from-[#007AFF]/90 hover:to-[#BF5AF2]/90 text-white rounded-full font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-semibold px-8 py-3 text-lg border-2 hover:border-primary hover:text-primary transition-all duration-200"
            >
              See Sample Report
            </Button>
          </div>
        </div>

        {/* Featured Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
          {FEATURED_STATS.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#007AFF]/10 to-[#BF5AF2]/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </Container>

      {/* Trust Indicators Section */}
      <div className="bg-white border-t border-gray-100">
        <Container className="py-16">
          <div className="text-center space-y-12">
            {/* Section Header */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                Why HomeHistory is Trusted
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                We've revolutionized real estate intelligence with cutting-edge technology 
                and comprehensive data analysis.
              </p>
            </div>

            {/* Trust Indicators Grid */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {TRUST_INDICATORS.map((indicator, index) => {
                const Icon = indicator.icon
                return (
                  <div key={index} className="text-center space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#007AFF] to-[#BF5AF2] rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-text-primary">
                        {indicator.title}
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        {indicator.description}
                      </p>
                      {indicator.stats && (
                        <div className="pt-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                            {indicator.stats}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom CTA */}
            <div className="pt-8">
              <p className="text-text-secondary mb-6">
                Ready to make smarter real estate decisions?
              </p>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold px-8 py-3"
              >
                Start Your First Search
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}