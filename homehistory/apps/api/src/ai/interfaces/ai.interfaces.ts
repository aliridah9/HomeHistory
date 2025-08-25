/**
 * AI Module Interfaces - HomeHistory Real Estate Intelligence Platform
 * Enterprise-grade TypeScript interfaces for AI operations
 */

import { Prisma } from '@prisma/client'; // ⬅️ Prisma 5 JSON types

// Enums
export enum AIJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  defaultModel: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface AIUsageMetrics {
  requestId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  timestamp: Date;
  userId?: string;
  propertyId?: string;
  operation: string;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
  dimensions?: number;
  userId?: string;
  metadata?: Record<string, any>;
  operation?: string; // Add missing operation field
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  tokens: number;
  cost: number;
  cached: boolean;
  requestId: string;
}

export interface PropertyAnalysisRequest {
  propertyId: string;
  analysisType: 'summary' | 'valuation' | 'risk' | 'investment' | 'market';
  includeComparables?: boolean;
  includeMarketTrends?: boolean;
  includeRiskFactors?: boolean;
  customPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PropertyAnalysisResponse {
  propertyId: string;
  analysisType: string;
  summary: string;
  keyInsights: string[];
  riskFactors?: RiskFactor[];
  marketComparables?: MarketComparable[];
  valuation?: PropertyValuation;
  confidence: number;
  sources: string[];
  generatedAt: Date;
  requestId: string;
  cached: boolean;
}

export interface RiskFactor {
  category: 'structural' | 'environmental' | 'financial' | 'legal' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation?: string;
  confidence: number;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface MarketComparable {
  address: string;
  distance: number;
  price: number;
  pricePerSqft: number;
  beds: number;
  baths: number;
  sqft: number;
  similarity: number;
  soldDate: Date;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface PropertyValuation {
  estimatedValue: number;
  valuationRange: {
    low: number;
    high: number;
  };
  pricePerSqft: number;
  methodology: string[];
  confidence: number;
  lastUpdated: Date;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface DocumentAnalysisRequest {
  documentId: string;
  documentType: 'inspection' | 'appraisal' | 'deed' | 'permit' | 'insurance' | 'other';
  extractionType: 'summary' | 'structured' | 'issues' | 'compliance' | 'full';
  customFields?: string[];
  language?: string;
}

export interface DocumentAnalysisResponse {
  documentId: string;
  documentType: string;
  extractionType: string;
  summary: string;
  structuredData: Record<string, any>;
  issues: DocumentIssue[];
  compliance: ComplianceCheck[];
  entities: ExtractedEntity[];
  confidence: number;
  processingTime: number;
  requestId: string;
}

export interface DocumentIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
  confidence: number;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface ComplianceCheck {
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'unknown' | 'pending';
  details: string;
  requirements?: string[];
  confidence: number;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'amount' | 'percentage' | 'other';
  value: string;
  confidence: number;
  context?: string;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface SearchQuery {
  query: string;
  filters?: {
    propertyType?: string[];
    priceRange?: [number, number];
    location?: {
      city?: string;
      state?: string;
      zipCode?: string;
      radius?: number;
    };
    dateRange?: [Date, Date];
  };
  embedding?: number[];
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  propertyId: string;
  score: number;
  snippet: string;
  highlights: string[];
  metadata: Record<string, any>;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  hash: string;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  lastAccessed: Date;
  size: number;
  tags: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
  requestId?: string;
}

export interface RateLimitInfo {
  requests: number;
  tokens: number;
  resetTime: Date;
  remaining: number;
  limit: number;
}

export interface ModelCapabilities {
  model: string;
  maxTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  contextWindow: number;
}

export interface AIServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  errorRate: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface BatchProcessingJob {
  jobId: string;
  type: 'embedding' | 'analysis' | 'extraction';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  items: any[];
  results: any[];
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  [key: string]: any; // Index signature for JSON compatibility
}

// Utility types for enhanced type safety
export type AIOperation =
  | 'property_analysis'
  | 'document_extraction'
  | 'embedding_generation'
  | 'similarity_search'
  | 'market_analysis'
  | 'risk_assessment'
  | 'valuation_estimate';

export type ModelProvider = 'openai' | 'anthropic' | 'cohere' | 'huggingface';

export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

export type CompletionModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k';

// Event interfaces for real-time updates
export interface AIEventData {
  eventType: 'job_started' | 'job_progress' | 'job_completed' | 'job_failed';
  jobId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketAIMessage {
  type: 'ai_update';
  data: AIEventData;
}

/* -------------------- Prisma JSON helpers (Prisma 5) -------------------- */

// For compatibility where you referenced PrismaJsonValue elsewhere:
export type PrismaJsonValue = Prisma.InputJsonValue | typeof Prisma.JsonNull;

/** Type guard for Prisma JSON compatibility (post-conversion) */
export function isPrismaJsonCompatible(value: unknown): value is PrismaJsonValue {
  if (value === Prisma.JsonNull) return true;
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isPrismaJsonCompatible);
  if (t === 'object') return Object.values(value as Record<string, unknown>).every(isPrismaJsonCompatible);
  return false;
}

/**
 * Convert arbitrary data to Prisma-acceptable JSON:
 * - null/undefined -> Prisma.JsonNull
 * - Date -> ISO string
 * - strips `undefined` keys
 */
export function toPrismaJson<T>(obj: T): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (obj === null || obj === undefined) return Prisma.JsonNull;

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as Prisma.InputJsonValue;
  }

  if (Array.isArray(obj)) {
    const arr = (obj as unknown[]).map((v) =>
      v === undefined ? null : toPrismaJson(v)
    );
    return arr as unknown as Prisma.InputJsonValue;
  }

  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue; // JSON has no undefined
      out[k] = toPrismaJson(v);
    }
    return out as Prisma.InputJsonValue;
  }

  // primitives
  return obj as unknown as Prisma.InputJsonValue;
}
