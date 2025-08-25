-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'verified', 'published');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ParsingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "providerEmail" TEXT,
    "providerName" TEXT,
    "providerAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "squareFeet" INTEGER,
    "lotSize" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "propertyType" "PropertyType",
    "price" DOUBLE PRECISION,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "extractedText" JSONB,
    "propertyId" TEXT,
    "status" "ReportStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "lastSynced" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_data_sources" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "lastSynced" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "incidentsJson" JSONB,
    "insuranceJson" JSONB,
    "aiInsights" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "dataType" TEXT NOT NULL,
    "compressed" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "size" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "ttl" INTEGER NOT NULL DEFAULT 3600,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "AICache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyEmbedding" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "dimensions" INTEGER NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageMetric" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,4) NOT NULL,
    "latency" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIUsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysisResult" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "documentId" TEXT,
    "analysisType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "summary" TEXT,
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingTime" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AIAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIBatchJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "results" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AIBatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAIScore" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "investmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL,
    "methodology" JSONB NOT NULL DEFAULT '{}',
    "factors" JSONB NOT NULL DEFAULT '{}',
    "explanation" TEXT,
    "qualityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "safetyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "valueWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "locationWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyAIScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_score_history" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "valueScore" DOUBLE PRECISION NOT NULL,
    "locationScore" DOUBLE PRECISION NOT NULL,
    "previousScore" DOUBLE PRECISION,
    "scoreChange" DOUBLE PRECISION,
    "changeReason" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "dataCompleteness" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_score_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAIAnalysis" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractedText" TEXT,
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "issues" JSONB NOT NULL DEFAULT '[]',
    "compliance" JSONB NOT NULL DEFAULT '[]',
    "entities" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "processingTime" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "supportsFunctions" BOOLEAN NOT NULL DEFAULT false,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "inputCostPer1k" DOUBLE PRECISION NOT NULL,
    "outputCostPer1k" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultSettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_recommendations" (
    "id" TEXT NOT NULL,
    "sourcePropertyId" TEXT NOT NULL,
    "recommendedPropertyId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendationRank" INTEGER NOT NULL DEFAULT 0,
    "algorithm" TEXT NOT NULL DEFAULT 'v1.0',
    "userId" TEXT,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "helpful" BOOLEAN,
    "feedback" TEXT,
    "issues" JSONB NOT NULL DEFAULT '[]',
    "searchContext" JSONB NOT NULL DEFAULT '{}',
    "distanceKm" DOUBLE PRECISION,
    "priceDifference" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "feedbackAt" TIMESTAMP(3),

    CONSTRAINT "property_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_metrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRecommendations" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalFeedback" INTEGER NOT NULL DEFAULT 0,
    "averageSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clickThroughRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "embeddingCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "city" TEXT,
    "state" TEXT,
    "propertyType" "PropertyType",
    "priceRange" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maintenance_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "notes" TEXT,
    "recurring_frequency" TEXT,
    "contractor_name" TEXT,
    "contractor_contact" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_maintenance_reminders" BOOLEAN NOT NULL DEFAULT true,
    "email_report_ready" BOOLEAN NOT NULL DEFAULT true,
    "email_document_processed" BOOLEAN NOT NULL DEFAULT true,
    "email_weekly_summary" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_maintenance_reminders" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_start" time,
    "quiet_hours_end" time,
    "push_report_ready" BOOLEAN NOT NULL DEFAULT true,
    "push_document_processed" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_maintenance_reminders" BOOLEAN NOT NULL DEFAULT true,
    "in_app_report_ready" BOOLEAN NOT NULL DEFAULT true,
    "in_app_document_processed" BOOLEAN NOT NULL DEFAULT true,
    "digest_frequency" TEXT DEFAULT 'weekly',
    "timezone" TEXT DEFAULT 'UTC',
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "propertyUpdates" BOOLEAN NOT NULL DEFAULT true,
    "documentProcessing" BOOLEAN NOT NULL DEFAULT true,
    "searchResults" BOOLEAN NOT NULL DEFAULT false,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceReminders" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "channels" TEXT[],
    "entity_type" TEXT,
    "entity_id" TEXT,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "emailSubject" TEXT,
    "emailBody" TEXT NOT NULL,
    "pushTitle" TEXT,
    "pushBody" TEXT,
    "smsMessage" TEXT,
    "channels" TEXT[],
    "variables" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_scores" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "quality_score" DECIMAL(3,1) NOT NULL,
    "safety_score" DECIMAL(3,1) NOT NULL,
    "value_score" DECIMAL(3,1) NOT NULL,
    "location_score" DECIMAL(3,1) NOT NULL,
    "overall_score" DECIMAL(3,1) NOT NULL,
    "explanation" TEXT NOT NULL,
    "metadata" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsingJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ParsingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "documentId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ParsingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE INDEX "oauth_accounts_provider_idx" ON "oauth_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_userId_key" ON "oauth_accounts"("provider", "userId");

-- CreateIndex
CREATE INDEX "properties_userId_idx" ON "properties"("userId");

-- CreateIndex
CREATE INDEX "properties_latitude_longitude_idx" ON "properties"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "raw_documents_propertyId_idx" ON "raw_documents"("propertyId");

-- CreateIndex
CREATE INDEX "raw_documents_type_idx" ON "raw_documents"("type");

-- CreateIndex
CREATE INDEX "raw_documents_status_idx" ON "raw_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");

-- CreateIndex
CREATE INDEX "property_data_sources_propertyId_idx" ON "property_data_sources"("propertyId");

-- CreateIndex
CREATE INDEX "property_data_sources_dataSourceId_idx" ON "property_data_sources"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "property_data_sources_propertyId_dataSourceId_key" ON "property_data_sources"("propertyId", "dataSourceId");

-- CreateIndex
CREATE INDEX "reports_propertyId_idx" ON "reports"("propertyId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AICache_hashedKey_key" ON "AICache"("hashedKey");

-- CreateIndex
CREATE INDEX "AICache_hashedKey_idx" ON "AICache"("hashedKey");

-- CreateIndex
CREATE INDEX "AICache_dataType_idx" ON "AICache"("dataType");

-- CreateIndex
CREATE INDEX "AICache_expiresAt_idx" ON "AICache"("expiresAt");

-- CreateIndex
CREATE INDEX "AICache_tags_idx" ON "AICache"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyEmbedding_propertyId_key" ON "PropertyEmbedding"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyEmbedding_propertyId_idx" ON "PropertyEmbedding"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyEmbedding_model_idx" ON "PropertyEmbedding"("model");

-- CreateIndex
CREATE INDEX "PropertyEmbedding_created_at_idx" ON "PropertyEmbedding"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsageMetric_requestId_key" ON "AIUsageMetric"("requestId");

-- CreateIndex
CREATE INDEX "AIUsageMetric_userId_idx" ON "AIUsageMetric"("userId");

-- CreateIndex
CREATE INDEX "AIUsageMetric_propertyId_idx" ON "AIUsageMetric"("propertyId");

-- CreateIndex
CREATE INDEX "AIUsageMetric_model_idx" ON "AIUsageMetric"("model");

-- CreateIndex
CREATE INDEX "AIUsageMetric_operation_idx" ON "AIUsageMetric"("operation");

-- CreateIndex
CREATE INDEX "AIUsageMetric_createdAt_idx" ON "AIUsageMetric"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysisResult_requestId_key" ON "AIAnalysisResult"("requestId");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_userId_idx" ON "AIAnalysisResult"("userId");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_propertyId_idx" ON "AIAnalysisResult"("propertyId");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_documentId_idx" ON "AIAnalysisResult"("documentId");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_analysisType_idx" ON "AIAnalysisResult"("analysisType");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_createdAt_idx" ON "AIAnalysisResult"("createdAt");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_expiresAt_idx" ON "AIAnalysisResult"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIBatchJob_jobId_key" ON "AIBatchJob"("jobId");

-- CreateIndex
CREATE INDEX "AIBatchJob_jobId_idx" ON "AIBatchJob"("jobId");

-- CreateIndex
CREATE INDEX "AIBatchJob_userId_idx" ON "AIBatchJob"("userId");

-- CreateIndex
CREATE INDEX "AIBatchJob_status_idx" ON "AIBatchJob"("status");

-- CreateIndex
CREATE INDEX "AIBatchJob_jobType_idx" ON "AIBatchJob"("jobType");

-- CreateIndex
CREATE INDEX "AIBatchJob_createdAt_idx" ON "AIBatchJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAIScore_propertyId_key" ON "PropertyAIScore"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAIScore_propertyId_idx" ON "PropertyAIScore"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAIScore_overallScore_idx" ON "PropertyAIScore"("overallScore");

-- CreateIndex
CREATE INDEX "PropertyAIScore_qualityScore_idx" ON "PropertyAIScore"("qualityScore");

-- CreateIndex
CREATE INDEX "PropertyAIScore_safetyScore_idx" ON "PropertyAIScore"("safetyScore");

-- CreateIndex
CREATE INDEX "PropertyAIScore_valueScore_idx" ON "PropertyAIScore"("valueScore");

-- CreateIndex
CREATE INDEX "PropertyAIScore_locationScore_idx" ON "PropertyAIScore"("locationScore");

-- CreateIndex
CREATE INDEX "PropertyAIScore_lastAnalyzedAt_idx" ON "PropertyAIScore"("lastAnalyzedAt");

-- CreateIndex
CREATE INDEX "PropertyAIScore_confidence_idx" ON "PropertyAIScore"("confidence");

-- CreateIndex
CREATE INDEX "property_score_history_propertyId_idx" ON "property_score_history"("propertyId");

-- CreateIndex
CREATE INDEX "property_score_history_calculatedAt_idx" ON "property_score_history"("calculatedAt");

-- CreateIndex
CREATE INDEX "property_score_history_overallScore_idx" ON "property_score_history"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAIAnalysis_documentId_key" ON "DocumentAIAnalysis"("documentId");

-- CreateIndex
CREATE INDEX "DocumentAIAnalysis_confidence_idx" ON "DocumentAIAnalysis"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_configs_name_key" ON "ai_model_configs"("name");

-- CreateIndex
CREATE INDEX "ai_model_configs_name_idx" ON "ai_model_configs"("name");

-- CreateIndex
CREATE INDEX "ai_model_configs_provider_idx" ON "ai_model_configs"("provider");

-- CreateIndex
CREATE INDEX "ai_model_configs_isActive_idx" ON "ai_model_configs"("isActive");

-- CreateIndex
CREATE INDEX "property_recommendations_sourcePropertyId_idx" ON "property_recommendations"("sourcePropertyId");

-- CreateIndex
CREATE INDEX "property_recommendations_recommendedPropertyId_idx" ON "property_recommendations"("recommendedPropertyId");

-- CreateIndex
CREATE INDEX "property_recommendations_userId_idx" ON "property_recommendations"("userId");

-- CreateIndex
CREATE INDEX "property_recommendations_similarityScore_idx" ON "property_recommendations"("similarityScore");

-- CreateIndex
CREATE INDEX "property_recommendations_createdAt_idx" ON "property_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "property_recommendations_viewed_clicked_idx" ON "property_recommendations"("viewed", "clicked");

-- CreateIndex
CREATE UNIQUE INDEX "property_recommendations_sourcePropertyId_recommendedProper_key" ON "property_recommendations"("sourcePropertyId", "recommendedPropertyId", "userId");

-- CreateIndex
CREATE INDEX "recommendation_metrics_metricType_idx" ON "recommendation_metrics"("metricType");

-- CreateIndex
CREATE INDEX "recommendation_metrics_timeframe_idx" ON "recommendation_metrics"("timeframe");

-- CreateIndex
CREATE INDEX "recommendation_metrics_periodStart_periodEnd_idx" ON "recommendation_metrics"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "recommendation_metrics_city_state_idx" ON "recommendation_metrics"("city", "state");

-- CreateIndex
CREATE INDEX "recommendation_metrics_propertyType_idx" ON "recommendation_metrics"("propertyType");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_metrics_metricType_timeframe_periodStart_cit_key" ON "recommendation_metrics"("metricType", "timeframe", "periodStart", "city", "state", "propertyType");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_records_property_id_created_at_key" ON "maintenance_records"("property_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "idx_property_scores_property_id" ON "property_scores"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_scores_property_id_calculated_at_key" ON "property_scores"("property_id", "calculated_at");

-- CreateIndex
CREATE INDEX "ParsingJob_status_priority_idx" ON "ParsingJob"("status", "priority");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_documents" ADD CONSTRAINT "raw_documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_data_sources" ADD CONSTRAINT "property_data_sources_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_data_sources" ADD CONSTRAINT "property_data_sources_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyEmbedding" ADD CONSTRAINT "PropertyEmbedding_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageMetric" ADD CONSTRAINT "AIUsageMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageMetric" ADD CONSTRAINT "AIUsageMetric_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisResult" ADD CONSTRAINT "AIAnalysisResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisResult" ADD CONSTRAINT "AIAnalysisResult_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisResult" ADD CONSTRAINT "AIAnalysisResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "raw_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIBatchJob" ADD CONSTRAINT "AIBatchJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAIScore" ADD CONSTRAINT "PropertyAIScore_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_score_history" ADD CONSTRAINT "property_score_history_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAIAnalysis" ADD CONSTRAINT "DocumentAIAnalysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "raw_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_sourcePropertyId_fkey" FOREIGN KEY ("sourcePropertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_recommendedPropertyId_fkey" FOREIGN KEY ("recommendedPropertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
