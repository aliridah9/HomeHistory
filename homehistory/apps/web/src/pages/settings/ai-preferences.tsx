import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { Save, Brain, Search, Bell, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { userPreferencesApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AIPreferences {
  searchPreferences: {
    enableNaturalLanguage: boolean
    saveSearchHistory: boolean
    enableSmartSuggestions: boolean
    preferenceWeight: {
      location: number
      price: number
      size: number
      quality: number
    }
  }
  recommendationPreferences: {
    enableRecommendations: boolean
    diversityLevel: 'low' | 'medium' | 'high'
    exploreNewAreas: boolean
    similarityThreshold: number
  }
  scoringPreferences: {
    priorityFactors: string[]
    minimumScore: number
    showDetailedBreakdown: boolean
  }
  notificationPreferences: {
    newRecommendations: boolean
    scoreChanges: boolean
    marketInsights: boolean
    priceDrops: boolean
  }
}

export default function AIPreferencesPage() {
  const [preferences, setPreferences] = React.useState<AIPreferences>({
    searchPreferences: {
      enableNaturalLanguage: true,
      saveSearchHistory: true,
      enableSmartSuggestions: true,
      preferenceWeight: {
        location: 80,
        price: 90,
        size: 70,
        quality: 85
      }
    },
    recommendationPreferences: {
      enableRecommendations: true,
      diversityLevel: 'medium',
      exploreNewAreas: false,
      similarityThreshold: 75
    },
    scoringPreferences: {
      priorityFactors: ['safety', 'value', 'location'],
      minimumScore: 60,
      showDetailedBreakdown: true
    },
    notificationPreferences: {
      newRecommendations: true,
      scoreChanges: false,
      marketInsights: true,
      priceDrops: true
    }
  })

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await userPreferencesApi.getAIPreferences()
      if (response.data) {
        setPreferences(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await userPreferencesApi.updateAIPreferences(preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save preferences:', err)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSearchPreference = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      searchPreferences: {
        ...preferences.searchPreferences,
        [key]: value
      }
    })
  }

  const updateWeight = (factor: string, value: number) => {
    setPreferences({
      ...preferences,
      searchPreferences: {
        ...preferences.searchPreferences,
        preferenceWeight: {
          ...preferences.searchPreferences.preferenceWeight,
          [factor]: value
        }
      }
    })
  }

  const updateRecommendationPreference = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      recommendationPreferences: {
        ...preferences.recommendationPreferences,
        [key]: value
      }
    })
  }

  const updateScoringPreference = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      scoringPreferences: {
        ...preferences.scoringPreferences,
        [key]: value
      }
    })
  }

  const updateNotificationPreference = (key: string, value: boolean) => {
    setPreferences({
      ...preferences,
      notificationPreferences: {
        ...preferences.notificationPreferences,
        [key]: value
      }
    })
  }

  const togglePriorityFactor = (factor: string) => {
    const factors = preferences.scoringPreferences.priorityFactors
    const newFactors = factors.includes(factor)
      ? factors.filter(f => f !== factor)
      : [...factors, factor]
    
    updateScoringPreference('priorityFactors', newFactors)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-text-secondary">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>AI Preferences | HomeHistory</title>
        <meta name="description" content="Customize your AI-powered property search experience" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary flex items-center">
              <Brain className="w-8 h-8 mr-3 text-primary" />
              AI Preferences
            </h1>
            <p className="text-text-secondary mt-1">
              Customize how AI helps you find and evaluate properties
            </p>
          </div>

          <div className="space-y-6">
            {/* Search Preferences */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-primary" />
                Search Preferences
              </h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Natural Language Search</p>
                    <p className="text-sm text-text-secondary">
                      Use conversational queries like "modern home with pool"
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.searchPreferences.enableNaturalLanguage}
                    onChange={(e) => updateSearchPreference('enableNaturalLanguage', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Save Search History</p>
                    <p className="text-sm text-text-secondary">
                      Remember your searches to improve recommendations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.searchPreferences.saveSearchHistory}
                    onChange={(e) => updateSearchPreference('saveSearchHistory', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Smart Suggestions</p>
                    <p className="text-sm text-text-secondary">
                      Get AI-powered search suggestions as you type
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.searchPreferences.enableSmartSuggestions}
                    onChange={(e) => updateSearchPreference('enableSmartSuggestions', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <div className="pt-4 border-t border-gray-200">
                  <p className="font-medium text-text-primary mb-4">
                    Search Priority Weights
                  </p>
                  {Object.entries(preferences.searchPreferences.preferenceWeight).map(([factor, weight]) => (
                    <div key={factor} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-secondary capitalize">{factor}</span>
                        <span className="text-sm font-semibold text-text-primary">{weight}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight}
                        onChange={(e) => updateWeight(factor, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recommendation Preferences */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                Recommendation Preferences
              </h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Enable Recommendations</p>
                    <p className="text-sm text-text-secondary">
                      Get personalized property recommendations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.recommendationPreferences.enableRecommendations}
                    onChange={(e) => updateRecommendationPreference('enableRecommendations', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Explore New Areas</p>
                    <p className="text-sm text-text-secondary">
                      Include properties outside your typical search areas
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.recommendationPreferences.exploreNewAreas}
                    onChange={(e) => updateRecommendationPreference('exploreNewAreas', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>

                <div>
                  <label className="block mb-2">
                    <span className="font-medium text-text-primary">Diversity Level</span>
                    <p className="text-sm text-text-secondary">
                      How varied should recommendations be?
                    </p>
                  </label>
                  <select
                    value={preferences.recommendationPreferences.diversityLevel}
                    onChange={(e) => updateRecommendationPreference('diversityLevel', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="low">Low - Very similar properties</option>
                    <option value="medium">Medium - Balanced variety</option>
                    <option value="high">High - Diverse options</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary">Similarity Threshold</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {preferences.recommendationPreferences.similarityThreshold}%
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Minimum similarity score for recommendations
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={preferences.recommendationPreferences.similarityThreshold}
                    onChange={(e) => updateRecommendationPreference('similarityThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </section>

            {/* Scoring Preferences */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                HomeHistory Score™ Preferences
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-text-primary mb-2">Priority Factors</p>
                  <p className="text-sm text-text-secondary mb-3">
                    Which factors matter most to you?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['safety', 'value', 'location', 'quality', 'investment', 'schools'].map((factor) => (
                      <button
                        key={factor}
                        onClick={() => togglePriorityFactor(factor)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                          preferences.scoringPreferences.priorityFactors.includes(factor)
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        )}
                      >
                        {factor.charAt(0).toUpperCase() + factor.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary">Minimum Score Filter</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {preferences.scoringPreferences.minimumScore}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Only show properties above this score
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={preferences.scoringPreferences.minimumScore}
                    onChange={(e) => updateScoringPreference('minimumScore', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Detailed Breakdown</p>
                    <p className="text-sm text-text-secondary">
                      Show detailed score breakdown by default
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.scoringPreferences.showDetailedBreakdown}
                    onChange={(e) => updateScoringPreference('showDetailedBreakdown', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </section>

            {/* Notification Preferences */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-primary" />
                AI Notifications
              </h2>

              <div className="space-y-4">
                {Object.entries(preferences.notificationPreferences).map(([key, enabled]) => (
                  <label key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {getNotificationDescription(key)}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updateNotificationPreference(key, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Changes are saved automatically
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-primary to-purple-500"
            >
              {saving ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </Container>
      </div>
    </>
  )
}

function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    newRecommendations: 'Get notified of new property recommendations',
    scoreChanges: 'Alert when property scores change significantly',
    marketInsights: 'Receive AI-powered market trend insights',
    priceDrops: 'Get notified of price drops on saved properties'
  }
  return descriptions[key] || ''
}

