// =====================================
// Core Entity Types
// =====================================

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  isActive: boolean
  notifications: NotificationSettings
}

export enum UserRole {
  USER = 'user',
  AGENT = 'agent',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  currency: string
  marketingEmails: boolean
  productUpdates: boolean
  priceAlerts: boolean
  savedSearchAlerts: boolean
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  desktop: boolean
}

// =====================================
// Property Types
// =====================================

export interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
  propertyType: PropertyType
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize?: number
  yearBuilt: number
  price: number
  mlsNumber?: string
  description: string
  features: PropertyFeature[]
  images: PropertyImage[]
  status: PropertyStatus
  listingAgent?: Agent
  ownershipHistory: OwnershipRecord[]
  aiScore?: PropertyAIScore
  reports: PropertyReport[]
  documents: PropertyDocument[]
  maintenanceRecords: MaintenanceRecord[]
  recommendations?: SimilarProperty[]
  createdAt: string
  updatedAt: string
}

export enum PropertyType {
  SINGLE_FAMILY = 'SINGLE_FAMILY',
  TOWNHOUSE = 'TOWNHOUSE',
  CONDO = 'CONDO',
  APARTMENT = 'APARTMENT',
  MULTI_FAMILY = 'MULTI_FAMILY',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  OFF_MARKET = 'OFF_MARKET',
  DRAFT = 'DRAFT',
}

export interface PropertyFeature {
  id: string
  name: string
  category: FeatureCategory
  description?: string
}

export enum FeatureCategory {
  INTERIOR = 'INTERIOR',
  EXTERIOR = 'EXTERIOR',
  AMENITIES = 'AMENITIES',
  LOCATION = 'LOCATION',
  PARKING = 'PARKING',
  UTILITIES = 'UTILITIES',
}

export interface PropertyImage {
  id: string
  url: string
  caption?: string
  isMain: boolean
  order: number
  type: ImageType
}

export enum ImageType {
  EXTERIOR = 'EXTERIOR',
  INTERIOR = 'INTERIOR',
  KITCHEN = 'KITCHEN',
  BATHROOM = 'BATHROOM',
  BEDROOM = 'BEDROOM',
  LIVING_ROOM = 'LIVING_ROOM',
  DINING_ROOM = 'DINING_ROOM',
  GARAGE = 'GARAGE',
  YARD = 'YARD',
  FLOORPLAN = 'FLOORPLAN',
  OTHER = 'OTHER',
}

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  license: string
  brokerage: string
  avatar?: string
  bio?: string
  specializations: string[]
  ratings: AgentRating
}

export interface AgentRating {
  average: number
  count: number
  reviews: AgentReview[]
}

export interface AgentReview {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface OwnershipRecord {
  id: string
  ownerName: string
  purchaseDate: string
  purchasePrice?: number
  saleDate?: string
  salePrice?: number
  mortgageInfo?: MortgageInfo
}

export interface MortgageInfo {
  lender: string
  amount: number
  interestRate: number
  term: number
  type: MortgageType
}

export enum MortgageType {
  CONVENTIONAL = 'CONVENTIONAL',
  FHA = 'FHA',
  VA = 'VA',
  USDA = 'USDA',
  JUMBO = 'JUMBO',
  OTHER = 'OTHER',
}

// =====================================
// AI & Scoring Types
// =====================================

export interface PropertyAIScore {
  id: string
  propertyId: string
  overall: number
  breakdown: ScoreBreakdown
  explanation: string
  confidence: number
  dataCompleteness: number
  lastCalculated: string
  version: string
  history: ScoreHistory[]
}

export interface ScoreBreakdown {
  quality: ScoreComponent
  safety: ScoreComponent
  value: ScoreComponent
  location: ScoreComponent
}

export interface ScoreComponent {
  score: number
  weight: number
  factors: ScoreFactor[]
  explanation: string
}

export interface ScoreFactor {
  name: string
  impact: number
  description: string
  source: string
  confidence: number
}

export interface ScoreHistory {
  id: string
  score: number
  breakdown: ScoreBreakdown
  calculatedAt: string
  reason: string
}

export interface SimilarProperty {
  property: Property
  similarityScore: number
  explanation: string
  keyMatchingFeatures: string[]
  priceDifference: number
  distanceKm: number
}

export interface PropertyEmbedding {
  id: string
  propertyId: string
  embedding: number[]
  content: string
  model: string
  createdAt: string
  features: EmbeddingFeatures
}

export interface EmbeddingFeatures {
  locationFeatures: number[]
  structuralFeatures: number[]
  amenityFeatures: number[]
  styleFeatures: number[]
  priceFeatures: number[]
  qualityFeatures: number[]
}

// =====================================
// Search Types
// =====================================

export interface SearchQuery {
  q?: string
  filters: SearchFilters
  sort: SearchSort
  page: number
  limit: number
}

export interface SearchFilters {
  location?: LocationFilter
  propertyType?: PropertyType[]
  priceRange?: PriceRange
  bedrooms?: NumberRange
  bathrooms?: NumberRange
  squareFeet?: NumberRange
  yearBuilt?: NumberRange
  features?: string[]
  propertyStatus?: PropertyStatus[]
  hasVirtualTour?: boolean
  hasPhotos?: boolean
  scoreRange?: NumberRange
}

export interface LocationFilter {
  city?: string
  state?: string
  zipCode?: string
  radius?: number
  coordinates?: {
    lat: number
    lng: number
  }
  neighborhood?: string
}

export interface PriceRange {
  min?: number
  max?: number
}

export interface NumberRange {
  min?: number
  max?: number
}

export interface SearchSort {
  field: SearchSortField
  direction: 'asc' | 'desc'
}

export enum SearchSortField {
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SQUARE_FEET = 'squareFeet',
  YEAR_BUILT = 'yearBuilt',
  AI_SCORE = 'aiScore',
  BEDROOMS = 'bedrooms',
  BATHROOMS = 'bathrooms',
  RELEVANCE = 'relevance',
}

export interface SearchResult {
  properties: Property[]
  total: number
  page: number
  limit: number
  totalPages: number
  aggregations: SearchAggregations
  suggestions?: SearchSuggestion[]
}

export interface SearchAggregations {
  priceRanges: PriceRangeBucket[]
  propertyTypes: PropertyTypeBucket[]
  cities: CityBucket[]
  features: FeatureBucket[]
}

export interface PriceRangeBucket {
  min: number
  max: number
  count: number
}

export interface PropertyTypeBucket {
  type: PropertyType
  count: number
}

export interface CityBucket {
  city: string
  state: string
  count: number
}

export interface FeatureBucket {
  feature: string
  count: number
}

export interface SearchSuggestion {
  text: string
  type: SuggestionType
  highlight: string
}

export enum SuggestionType {
  LOCATION = 'LOCATION',
  PROPERTY_TYPE = 'PROPERTY_TYPE',
  FEATURE = 'FEATURE',
  AGENT = 'AGENT',
  QUERY = 'QUERY',
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  query: SearchQuery
  alertsEnabled: boolean
  lastRun?: string
  resultCount?: number
  createdAt: string
  updatedAt: string
}

export interface NaturalLanguageSearchRequest {
  query: string
  context?: SearchContext
}

export interface SearchContext {
  userLocation?: {
    lat: number
    lng: number
  }
  userPreferences?: UserSearchPreferences
  previousQueries?: string[]
}

export interface UserSearchPreferences {
  preferredLocations: string[]
  priceRange?: PriceRange
  propertyTypes: PropertyType[]
  mustHaveFeatures: string[]
}

// =====================================
// Document Types
// =====================================

export interface PropertyDocument {
  id: string
  propertyId: string
  name: string
  type: DocumentType
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  aiAnalysis?: DocumentAIAnalysis
  status: DocumentStatus
  tags: string[]
}

export enum DocumentType {
  DEED = 'DEED',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  APPRAISAL = 'APPRAISAL',
  HOA_DOCUMENTS = 'HOA_DOCUMENTS',
  TAX_RECORDS = 'TAX_RECORDS',
  PERMIT = 'PERMIT',
  SURVEY = 'SURVEY',
  INSURANCE = 'INSURANCE',
  WARRANTY = 'WARRANTY',
  DISCLOSURE = 'DISCLOSURE',
  CONTRACT = 'CONTRACT',
  PHOTO = 'PHOTO',
  FLOORPLAN = 'FLOORPLAN',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

export interface DocumentAIAnalysis {
  id: string
  documentId: string
  extractedText: string
  summary: string
  keyFindings: string[]
  metadata: Record<string, any>
  confidence: number
  processingTime: number
  model: string
  analyzedAt: string
}

// =====================================
// Report Types
// =====================================

export interface PropertyReport {
  id: string
  propertyId: string
  type: ReportType
  title: string
  summary: string
  sections: ReportSection[]
  aiGenerated: boolean
  status: ReportStatus
  generatedBy?: string
  generatedAt: string
  version: string
  metadata: Record<string, any>
}

export enum ReportType {
  HOME_HISTORY = 'HOME_HISTORY',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  INVESTMENT = 'INVESTMENT',
  INSPECTION = 'INSPECTION',
  APPRAISAL = 'APPRAISAL',
  INSURANCE = 'INSURANCE',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

export interface ReportSection {
  id: string
  title: string
  content: string
  order: number
  type: SectionType
  data?: Record<string, any>
  charts?: ChartData[]
}

export enum SectionType {
  TEXT = 'TEXT',
  TABLE = 'TABLE',
  CHART = 'CHART',
  IMAGE = 'IMAGE',
  MAP = 'MAP',
  TIMELINE = 'TIMELINE',
  COMPARISON = 'COMPARISON',
}

export interface ChartData {
  type: ChartType
  title: string
  data: any[]
  config: ChartConfig
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  AREA = 'AREA',
  SCATTER = 'SCATTER',
  DONUT = 'DONUT',
}

export interface ChartConfig {
  xAxisLabel?: string
  yAxisLabel?: string
  colors?: string[]
  legend?: boolean
  grid?: boolean
  responsive?: boolean
}

// =====================================
// Maintenance Types
// =====================================

export interface MaintenanceRecord {
  id: string
  propertyId: string
  type: MaintenanceType
  title: string
  description: string
  cost: number
  completedDate: string
  performedBy: string
  documents: string[]
  images: string[]
  warranty?: WarrantyInfo
  tags: string[]
  status: MaintenanceStatus
  priority: MaintenancePriority
}

export enum MaintenanceType {
  HVAC = 'HVAC',
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  ROOFING = 'ROOFING',
  FLOORING = 'FLOORING',
  PAINTING = 'PAINTING',
  LANDSCAPING = 'LANDSCAPING',
  APPLIANCE = 'APPLIANCE',
  STRUCTURAL = 'STRUCTURAL',
  SAFETY = 'SAFETY',
  COSMETIC = 'COSMETIC',
  OTHER = 'OTHER',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export interface WarrantyInfo {
  provider: string
  startDate: string
  endDate: string
  coverage: string
  contactInfo: string
}

// =====================================
// Notification Types
// =====================================

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  readAt?: string
  createdAt: string
  expiresAt?: string
  priority: NotificationPriority
  category: NotificationCategory
}

export enum NotificationType {
  PROPERTY_UPDATE = 'PROPERTY_UPDATE',
  PRICE_CHANGE = 'PRICE_CHANGE',
  NEW_LISTING = 'NEW_LISTING',
  SAVED_SEARCH_MATCH = 'SAVED_SEARCH_MATCH',
  REPORT_READY = 'REPORT_READY',
  SCORE_UPDATE = 'SCORE_UPDATE',
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationCategory {
  PROPERTY = 'PROPERTY',
  ACCOUNT = 'ACCOUNT',
  SYSTEM = 'SYSTEM',
  MARKETING = 'MARKETING',
  MAINTENANCE = 'MAINTENANCE',
}

// =====================================
// Admin & Analytics Types
// =====================================

export interface AIMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  openaiRequests: number
  openaiTokensUsed: number
  openaiCostUSD: number
  openaiErrorRate: number
  scoringRequests: number
  recommendationRequests: number
  embeddingRequests: number
  searchRequests: number
  cacheHitRate: number
  averageEmbeddingTime: number
  averageScoringTime: number
  averageRecommendationTime: number
  timeoutErrors: number
  rateLimitErrors: number
  authenticationErrors: number
  validationErrors: number
  internalErrors: number
}

export interface AIAlert {
  id: string
  type: AIAlertType
  severity: AlertSeverity
  message: string
  metric: string
  currentValue: number
  threshold: number
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

export enum AIAlertType {
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  COST_THRESHOLD = 'cost_threshold',
  SERVICE_DOWN = 'service_down',
  CACHE_PERFORMANCE = 'cache_performance',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface CacheAnalytics {
  [service: string]: {
    totalRequests: number
    cacheHits: number
    cacheMisses: number
    hitRate: number
    averageResponseTime: number
    popularKeys: string[]
    memoryUsage: number
    evictionCount: number
  }
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    [service: string]: {
      status: 'up' | 'down' | 'degraded'
      responseTime?: number
      errorRate?: number
      lastCheck?: string
    }
  }
  uptime: number
  version: string
}

// =====================================
// UI State Types
// =====================================

export interface ViewState {
  loading: boolean
  error: string | null
  data: any
  lastUpdated: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterState {
  [key: string]: any
}

export interface UITheme {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  borderRadius: string
  fontSize: 'sm' | 'md' | 'lg'
}

export interface ModalState {
  isOpen: boolean
  type?: string
  data?: any
}

export interface ToastState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive'
}

// =====================================
// Form Types
// =====================================

export interface FormField {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: FormOption[]
  validation?: ValidationRule[]
  defaultValue?: any
  disabled?: boolean
  hidden?: boolean
  description?: string
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  TEXTAREA = 'textarea',
  DATE = 'date',
  FILE = 'file',
  HIDDEN = 'hidden',
}

export interface FormOption {
  label: string
  value: any
  disabled?: boolean
}

export interface ValidationRule {
  type: ValidationType
  value?: any
  message: string
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN_VALUE = 'minValue',
  MAX_VALUE = 'maxValue',
  PATTERN = 'pattern',
  EMAIL = 'email',
  CUSTOM = 'custom',
}

// =====================================
// Map Types
// =====================================

export interface MapConfig {
  center: [number, number]
  zoom: number
  style: string
  interactive: boolean
  showNavigation: boolean
  showScale: boolean
}

export interface MapMarker {
  id: string
  coordinates: [number, number]
  type: MarkerType
  data: any
  popup?: MapPopup
}

export enum MarkerType {
  PROPERTY = 'property',
  USER_LOCATION = 'user_location',
  SEARCH_RESULT = 'search_result',
  CLUSTER = 'cluster',
}

export interface MapPopup {
  title: string
  content: string
  actions?: PopupAction[]
}

export interface PopupAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

// =====================================
// Utility Types
// =====================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

// =====================================
// Component Props Types
// =====================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends BaseComponentProps {
  type?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

export interface SelectProps extends BaseComponentProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  options: FormOption[]
  onChange?: (value: string) => void
  searchable?: boolean
  multiple?: boolean
}

// Export all types
export type * from './index'