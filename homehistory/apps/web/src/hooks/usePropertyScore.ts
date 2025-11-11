import { useState, useEffect } from 'react'
import { propertiesApi } from '@/lib/api'

interface ScoreData {
  id: string
  propertyId: string
  score: number
  breakdown: {
    quality: { score: number; factors: any }
    safety: { score: number; factors: any }
    value: { score: number; factors: any }
    location: { score: number; factors: any }
  }
  explanation: string
  confidence: number
  dataCompleteness: number
  lastCalculated: string
  version: string
}

interface UseProp ertyScoreResult {
  score: ScoreData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePropertyScore(propertyId: string | undefined): UsePropertyScoreResult {
  const [score, setScore] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = async () => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await propertiesApi.getPropertyScore(propertyId)
      
      if (response.data) {
        setScore(response.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch property score:', err)
      setError(err.response?.data?.message || 'Failed to load property score')
      // Set mock data for development if API fails
      setScore({
        id: 'mock-1',
        propertyId: propertyId,
        score: 92,
        breakdown: {
          quality: { score: 95, factors: {} },
          safety: { score: 88, factors: {} },
          value: { score: 92, factors: {} },
          location: { score: 94, factors: {} }
        },
        explanation: 'This property receives an exceptional HomeHistory Score™ of 92/100. The score reflects outstanding property quality, excellent safety ratings, strong market value, and prime location.',
        confidence: 0.85,
        dataCompleteness: 0.75,
        lastCalculated: new Date().toISOString(),
        version: '1.0.0'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScore()
  }, [propertyId])

  return {
    score,
    loading,
    error,
    refetch: fetchScore
  }
}

interface SimilarProperty {
  property: {
    id: string
    address: string
    city: string
    state: string
    price: number
    bedrooms: number
    bathrooms: number
    squareFeet: number
    thumbnailUrl?: string
  }
  similarityScore: number
  explanation: string
  keyMatchingFeatures: string[]
  priceDifference: number
  distanceKm: number
}

interface UseSimilarPropertiesResult {
  properties: SimilarProperty[]
  loading: boolean
  error: string | null
}

export function useSimilarProperties(
  propertyId: string | undefined,
  limit: number = 5
): UseSimilarPropertiesResult {
  const [properties, setProperties] = useState<SimilarProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    const fetchSimilar = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await propertiesApi.getSimilarProperties(propertyId, limit)
        
        if (response.data) {
          setProperties(response.data)
        }
      } catch (err: any) {
        console.error('Failed to fetch similar properties:', err)
        setError(err.response?.data?.message || 'Failed to load similar properties')
        // Set empty array on error
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [propertyId, limit])

  return {
    properties,
    loading,
    error
  }
}

