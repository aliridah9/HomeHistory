# HomeHistory AI API Quick Reference

## 🚀 Base URL
```
Development: http://localhost:3001/api
Production: https://api.homehistory.com/api
```

## 🔐 Authentication
All endpoints require JWT Bearer token:
```bash
Authorization: Bearer {your_jwt_token}
```

---

## 📍 AI Feature Endpoints Map

### 1. HomeHistory Score™

#### Get Property Score
```http
GET /properties/{propertyId}/score
```
**Response:**
```json
{
  "id": "score-uuid",
  "propertyId": "property-uuid",
  "score": 92,
  "breakdown": {
    "quality": { "score": 95, "factors": {...} },
    "safety": { "score": 88, "factors": {...} },
    "value": { "score": 90, "factors": {...} },
    "location": { "score": 94, "factors": {...} }
  },
  "explanation": "This property scores exceptionally well...",
  "confidence": 0.85,
  "dataCompleteness": 0.75,
  "lastCalculated": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### Recalculate Score (Admin)
```http
POST /properties/{propertyId}/recalculate-score
```

#### Get Score History
```http
GET /properties/{propertyId}/score-history?limit=50&startDate=2024-01-01&endDate=2024-12-31
```

#### Get Detailed Breakdown
```http
GET /properties/{propertyId}/score-breakdown
```

#### Bulk Update Scores (Admin)
```http
POST /properties/bulk-update-scores
Content-Type: application/json

{
  "propertyIds": ["id1", "id2", "id3"],
  "filters": {
    "city": "Austin",
    "state": "TX"
  },
  "forceRecalculation": true,
  "batchSize": 50
}
```

---

### 2. AI-Powered Search

#### Natural Language Search
```http
POST /search/nl
Content-Type: application/json

{
  "query": "Find me a modern family home with pool under $500k in Austin"
}
```
**Response:**
```json
{
  "results": [
    {
      "property": {...},
      "relevanceScore": 0.95,
      "matchedCriteria": ["modern", "family home", "pool", "price under $500k"],
      "highlights": ["Recently renovated", "Large backyard"]
    }
  ],
  "metadata": {
    "total": 45,
    "page": 1,
    "extractedCriteria": {
      "propertyType": "SINGLE_FAMILY",
      "maxPrice": 500000,
      "features": ["pool"],
      "keywords": ["modern", "family"]
    }
  }
}
```

#### Traditional Search
```http
GET /search?q=austin&city=Austin&state=TX&minPrice=300000&maxPrice=500000&bedrooms=3&sort=homeHistoryScore
```

#### Get Search Suggestions
```http
GET /search/suggestions?q=modern home
```
**Response:**
```json
{
  "suggestions": [
    "modern home with pool",
    "modern home downtown",
    "modern family home"
  ]
}
```

#### Save Search
```http
POST /search/saved
Content-Type: application/json

{
  "query": "modern homes under 500k",
  "filters": {
    "city": "Austin",
    "maxPrice": 500000
  },
  "name": "My Dream Home Search"
}
```

---

### 3. Property Recommendations

#### Get Similar Properties
```http
GET /properties/{propertyId}/similar?limit=10&maxDistance=50&minSimilarityScore=0.6
```
**Query Parameters:**
- `limit` - Number of recommendations (default: 10, max: 50)
- `maxDistance` - Maximum distance in km (default: 50)
- `priceRangePercent` - Price range ± % (default: 10)
- `minSimilarityScore` - Minimum similarity 0-1 (default: 0.6)
- `propertyTypes` - Comma-separated types

**Response:**
```json
{
  "sourceProperty": {...},
  "recommendations": [
    {
      "property": {...},
      "similarityScore": 0.92,
      "explanation": "This property matches your criteria with...",
      "keyMatchingFeatures": ["3 bedrooms", "modern kitchen", "similar price"],
      "priceDifference": -15000,
      "distanceKm": 2.5
    }
  ],
  "metadata": {
    "totalFound": 15,
    "averageSimilarity": 0.85,
    "searchTime": 145,
    "cached": true
  }
}
```

#### Get Detailed Similar Properties
```http
GET /properties/{propertyId}/similar/detailed?limit=5
```
**Includes detailed similarity breakdown:**
- locationSimilarity
- structuralSimilarity
- amenitySimilarity
- styleSimilarity
- priceSimilarity

#### Submit Recommendation Feedback
```http
POST /properties/{propertyId}/similar/feedback
Content-Type: application/json

{
  "recommendedPropertyId": "rec-prop-id",
  "rating": 4,
  "helpful": true,
  "comments": "Great match!",
  "issues": ["slightly_too_far"]
}
```

#### Get Trending Properties
```http
GET /recommendations/trending?limit=20&timeframe=week&city=Austin&state=TX
```

#### Batch Update Embeddings (Admin)
```http
POST /recommendations/batch-update-embeddings
Content-Type: application/json

{
  "propertyIds": ["id1", "id2"],
  "filters": {
    "city": "Austin",
    "updatedBefore": "2024-01-01"
  },
  "batchSize": 50
}
```

---

### 4. AI Analysis

#### Analyze Property
```http
POST /ai/analyze/property
Content-Type: application/json

{
  "propertyId": "property-uuid",
  "analysisType": "valuation",
  "includeComparables": true,
  "includeMarketTrends": true,
  "includeRiskFactors": true,
  "customPrompt": "Focus on investment potential",
  "maxTokens": 1000,
  "temperature": 0.1
}
```
**Analysis Types:**
- `valuation` - Property valuation analysis
- `investment` - Investment potential
- `risk_assessment` - Risk factors
- `market_analysis` - Market trends

#### Analyze Document
```http
POST /ai/analyze/document
Content-Type: application/json

{
  "documentId": "doc-uuid",
  "documentType": "inspection",
  "extractionType": "structured",
  "customFields": ["roof_condition", "foundation_issues"],
  "language": "en"
}
```
**Document Types:**
- `inspection` - Inspection reports
- `appraisal` - Appraisal documents
- `deed` - Property deeds
- `permit` - Building permits
- `contract` - Purchase contracts

#### Generate Embedding
```http
POST /ai/embeddings/generate
Content-Type: application/json

{
  "text": "Modern 3-bedroom house with pool and large backyard",
  "model": "text-embedding-3-small",
  "dimensions": 1536
}
```

#### Batch Generate Embeddings
```http
POST /ai/embeddings/batch
Content-Type: application/json

{
  "texts": [
    "Property description 1",
    "Property description 2"
  ],
  "model": "text-embedding-3-small"
}
```

#### Semantic Similarity Search
```http
POST /ai/search/similarity
Content-Type: application/json

{
  "query": "luxury waterfront properties with pool",
  "filters": {
    "propertyType": ["SINGLE_FAMILY"],
    "priceRange": [500000, 2000000]
  },
  "limit": 20,
  "threshold": 0.7
}
```

#### Generate Text Completion
```http
POST /ai/completion
Content-Type: application/json

{
  "prompt": "Describe this property in a compelling way:",
  "model": "gpt-4",
  "maxTokens": 500,
  "temperature": 0.7,
  "systemPrompt": "You are a professional real estate agent"
}
```

---

### 5. AI System Management

#### Get Model Capabilities
```http
GET /ai/models/capabilities/gpt-4
```

#### Get Usage Statistics
```http
GET /ai/usage/stats?timeframe=week
```
**Timeframes:** `hour`, `day`, `week`, `month`

#### Get Embedding Statistics
```http
GET /ai/embeddings/stats
```

#### Get Cache Statistics
```http
GET /ai/cache/stats
```

#### Get Cache Health
```http
GET /ai/cache/health
```

#### Clear All Cache
```http
POST /ai/cache/clear
```

#### Clear Cache by Tags
```http
POST /ai/cache/clear-tags
Content-Type: application/json

{
  "tags": ["property-scores", "recommendations"]
}
```

#### Update All Property Embeddings (Admin)
```http
POST /ai/embeddings/update-all
```

#### Get AI Health
```http
GET /ai/health
```

---

### 6. Admin AI Dashboard

#### Get Dashboard Overview
```http
GET /admin/ai/dashboard
```
**Response:**
```json
{
  "summary": {
    "totalRequests": 847000,
    "monthlyCost": 12400,
    "avgResponseTime": 1200,
    "scoreAccuracy": 94.2,
    "cacheHitRate": 85
  },
  "services": [...],
  "recentAlerts": [...],
  "costTrends": [...]
}
```

#### Get Detailed Metrics
```http
GET /admin/ai/metrics?timeframe=week&service=scoring
```
**Services:** `scoring`, `recommendations`, `search`, `embeddings`, `all`

#### Get Active Alerts
```http
GET /admin/ai/alerts?resolved=false&severity=warning&limit=50
```
**Severities:** `info`, `warning`, `error`, `critical`

#### Resolve Alert
```http
PUT /admin/ai/alerts/{alertId}/resolve
Content-Type: application/json

{
  "resolution": "Increased cache TTL to resolve performance issue",
  "resolvedBy": "admin-user-id"
}
```

#### Get Cache Analytics
```http
GET /admin/ai/cache/analytics
```

#### Start Cache Warming
```http
POST /admin/ai/cache/warm
Content-Type: application/json

{
  "propertyIds": ["id1", "id2"],
  "services": ["scoring", "recommendations"],
  "priority": "high"
}
```

#### Get Cache Warming Job Status
```http
GET /admin/ai/cache/jobs/{jobId}
```

#### Bulk Score Recalculation
```http
POST /admin/ai/operations/bulk-score-recalculation
Content-Type: application/json

{
  "propertyIds": ["id1", "id2"],
  "filters": {
    "city": "Austin",
    "scoreRange": { "min": 0, "max": 70 }
  },
  "forceRecalculation": true,
  "batchSize": 50
}
```

#### Bulk Embedding Update
```http
POST /admin/ai/operations/bulk-embedding-update
Content-Type: application/json

{
  "propertyIds": ["id1", "id2"],
  "filters": {
    "updatedBefore": "2024-01-01"
  },
  "batchSize": 50
}
```

#### Get Cost Analysis
```http
GET /admin/ai/cost-analysis?timeframe=month
```
**Response:**
```json
{
  "timeframe": "month",
  "totalCost": 12400,
  "breakdown": {
    "gpt4": 8500,
    "embeddings": 2400,
    "scoring": 1200,
    "search": 300
  },
  "trends": [...],
  "projections": {
    "nextMonth": 13500,
    "annual": 150000
  }
}
```

#### Get Service Health
```http
GET /admin/ai/service-health
```

#### Reset Metrics (Admin)
```http
POST /admin/ai/maintenance/reset-metrics
```

#### Get Configuration
```http
GET /admin/ai/configuration
```

---

### 7. Health Check Endpoints

#### Basic AI Health
```http
GET /health/ai
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "openai": "healthy",
    "embedding": "healthy",
    "cache": "healthy"
  },
  "version": "1.0.0"
}
```

#### Detailed AI Health
```http
GET /health/ai/detailed
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "up",
      "responseTime": "5ms",
      "connectionPool": {
        "active": 5,
        "idle": 10,
        "max": 50
      }
    },
    "openai": {
      "status": "up",
      "responseTime": "200ms",
      "rateLimit": {
        "remaining": 2500,
        "limit": 3000
      }
    },
    "cache": {
      "status": "up",
      "hitRate": 0.85,
      "memoryUsage": "1.2GB",
      "evictionRate": 0.05
    },
    "aiServices": {
      "status": "up",
      "activeRequests": 15,
      "queueSize": 3
    },
    "performance": {
      "status": "up",
      "errorRate": 0.02,
      "avgResponseTime": 1200
    },
    "circuitBreakers": {
      "status": "up",
      "openBreakers": 0,
      "halfOpenBreakers": 0
    }
  },
  "summary": {
    "healthy": 6,
    "degraded": 0,
    "unhealthy": 0,
    "total": 6,
    "criticalIssues": []
  }
}
```

#### AI Health Metrics
```http
GET /health/ai/metrics
```

---

## 🧪 Testing Examples

### Test Property Score
```bash
# Replace {id} with actual property ID
curl -X GET "http://localhost:3001/api/properties/{id}/score" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Natural Language Search
```bash
curl -X POST "http://localhost:3001/api/search/nl" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find me a modern family home with pool under 500k in Austin"
  }'
```

### Test Similar Properties
```bash
curl -X GET "http://localhost:3001/api/properties/{id}/similar?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test AI Analysis
```bash
curl -X POST "http://localhost:3001/api/ai/analyze/property" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "{property-id}",
    "analysisType": "valuation",
    "includeComparables": true
  }'
```

### Test Health Check
```bash
curl -X GET "http://localhost:3001/api/health/ai/detailed"
```

---

## 📊 Response Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing (async operations)
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## 🔒 Rate Limits

### Standard Users:
- Search: 100 requests/minute
- Property Score: 50 requests/minute
- Recommendations: 30 requests/minute
- AI Analysis: 10 requests/minute

### Admin Users:
- All endpoints: 1000 requests/minute
- Bulk operations: 10 requests/minute

### Cost Limits:
- Daily AI cost limit: $100
- Monthly AI cost limit: $2000
- Per-user daily limit: $10

---

## 💡 Best Practices

1. **Use Caching Wisely:**
   - Property scores cached for 24 hours
   - Recommendations cached for 6 hours
   - Search results cached for 1 hour

2. **Batch Operations:**
   - Use batch endpoints for multiple properties
   - Recommended batch size: 50 items
   - Monitor bulk operation status via job ID

3. **Error Handling:**
   - Implement exponential backoff for retries
   - Check circuit breaker status
   - Handle rate limit errors gracefully

4. **Performance:**
   - Use pagination for large result sets
   - Implement client-side caching
   - Monitor response times

5. **Cost Optimization:**
   - Cache aggressively
   - Use batch operations when possible
   - Choose appropriate AI models for tasks
   - Monitor daily/monthly costs

---

## 📚 Additional Resources

- **API Documentation:** Swagger UI at `/api/docs`
- **Backend Code:** `homehistory/apps/api/src/ai/`
- **Frontend Integration:** `homehistory/apps/web/src/lib/api.ts`
- **Deployment Guide:** `homehistory/apps/api/src/ai/DEPLOYMENT_GUIDE.md`

---

**Last Updated:** January 2024
**API Version:** 1.0.0

