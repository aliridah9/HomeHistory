-- AI Analytics and Tracking Tables Migration
-- This migration adds tables for tracking AI usage, search analytics, and recommendation feedback

-- ============================================
-- AI Usage Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type VARCHAR(50) NOT NULL,  -- 'scoring', 'recommendation', 'search', 'embedding', 'analysis'
  operation VARCHAR(100) NOT NULL,    -- Specific operation performed
  model VARCHAR(50),                  -- AI model used (gpt-4, text-embedding-3-small, etc.)
  total_tokens INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 8) DEFAULT 0,      -- Cost in USD
  latency_ms INTEGER,                 -- Response time in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,                     -- Additional contextual data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ai_usage_created_at (created_at),
  INDEX idx_ai_usage_user_id (user_id),
  INDEX idx_ai_usage_service_type (service_type),
  INDEX idx_ai_usage_model (model)
);

-- ============================================
-- Recommendation Feedback Table
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  recommended_property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  helpful BOOLEAN,
  comments TEXT,
  issues TEXT[],                      -- Array of issue types: 'too_far', 'wrong_price_range', etc.
  similarity_score DECIMAL(3, 2),     -- The similarity score that was shown
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_recommendation_feedback_user_id (user_id),
  INDEX idx_recommendation_feedback_source (source_property_id),
  INDEX idx_recommendation_feedback_created_at (created_at)
);

-- ============================================
-- Search Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),            -- Track searches in same session
  query TEXT NOT NULL,
  search_type VARCHAR(50),            -- 'natural_language', 'traditional', 'saved'
  filters JSONB,                      -- Applied filters
  extracted_criteria JSONB,           -- AI-extracted search criteria
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  clicked_property_ids UUID[],        -- Properties user clicked on
  favorited_property_ids UUID[],      -- Properties user favorited from results
  conversion BOOLEAN DEFAULT false,   -- Did search lead to property view/inquiry
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_search_analytics_user_id (user_id),
  INDEX idx_search_analytics_created_at (created_at),
  INDEX idx_search_analytics_search_type (search_type),
  INDEX idx_search_analytics_query_text (query text_pattern_ops)
);

-- ============================================
-- Property Score History Table (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS property_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  previous_score INTEGER,
  score_breakdown JSONB NOT NULL,     -- Full breakdown of all categories
  change_reason VARCHAR(255),         -- Why score changed
  confidence DECIMAL(3, 2),
  data_completeness DECIMAL(3, 2),
  calculation_time_ms INTEGER,        -- How long it took to calculate
  version VARCHAR(20),                -- Scoring algorithm version
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_property_score_history_property_id (property_id),
  INDEX idx_property_score_history_created_at (created_at)
);

-- ============================================
-- AI Cache Performance Metrics
-- ============================================
CREATE TABLE IF NOT EXISTS ai_cache_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key_hash VARCHAR(64),
  service_type VARCHAR(50),
  hit BOOLEAN,                        -- Cache hit or miss
  response_time_ms INTEGER,
  cached_data_age_seconds INTEGER,    -- How old was the cached data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ai_cache_metrics_created_at (created_at),
  INDEX idx_ai_cache_metrics_service_type (service_type)
);

-- ============================================
-- AI Performance Alerts
-- ============================================
CREATE TABLE IF NOT EXISTS ai_performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,    -- 'high_latency', 'error_rate', 'cost_spike', etc.
  severity VARCHAR(20) NOT NULL,      -- 'info', 'warning', 'error', 'critical'
  service_type VARCHAR(50),
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ai_alerts_created_at (created_at),
  INDEX idx_ai_alerts_resolved (resolved),
  INDEX idx_ai_alerts_severity (severity)
);

-- ============================================
-- Property View Analytics (Enhanced with AI context)
-- ============================================
CREATE TABLE IF NOT EXISTS property_view_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  referrer VARCHAR(255),              -- How they found this property ('search', 'recommendation', 'direct')
  referrer_query TEXT,                -- Original search query if from search
  time_spent_seconds INTEGER,
  actions_taken JSONB,                -- ['viewed_score', 'clicked_similar', 'saved', 'shared']
  score_at_view INTEGER,              -- HomeHistory Score when viewed
  left_via VARCHAR(100),              -- How they left ('inquiry', 'back_to_search', 'closed')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_property_view_analytics_property_id (property_id),
  INDEX idx_property_view_analytics_user_id (user_id),
  INDEX idx_property_view_analytics_created_at (created_at)
);

-- ============================================
-- Embedding Generation Log
-- ============================================
CREATE TABLE IF NOT EXISTS embedding_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,   -- 'property', 'document', 'custom'
  entity_id UUID NOT NULL,
  text_length INTEGER,
  model VARCHAR(50),
  dimensions INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10, 8),
  generation_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_embedding_log_created_at (created_at),
  INDEX idx_embedding_log_entity (entity_type, entity_id)
);

-- ============================================
-- AI Cost Tracking Summary (Hourly Aggregation)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_cost_summary_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_timestamp TIMESTAMP NOT NULL,
  service_type VARCHAR(50),
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  avg_latency_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(hour_timestamp, service_type),
  INDEX idx_ai_cost_summary_hour (hour_timestamp)
);

-- ============================================
-- Create Views for Common Queries
-- ============================================

-- View: Daily AI Cost Summary
CREATE OR REPLACE VIEW ai_daily_cost_summary AS
SELECT 
  DATE(created_at) as date,
  service_type,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as error_count
FROM ai_usage_metrics
GROUP BY DATE(created_at), service_type
ORDER BY date DESC, service_type;

-- View: Top Searched Queries
CREATE OR REPLACE VIEW top_search_queries AS
SELECT 
  query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  AVG(response_time_ms) as avg_response_time_ms,
  SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END) as conversion_count,
  (SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as conversion_rate
FROM search_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY query
HAVING COUNT(*) >= 3
ORDER BY search_count DESC
LIMIT 100;

-- View: Recommendation Accuracy
CREATE OR REPLACE VIEW recommendation_accuracy AS
SELECT 
  source_property_id,
  COUNT(*) as total_recommendations,
  AVG(rating) as avg_rating,
  SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END) as helpful_count,
  (SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as helpful_percentage,
  AVG(similarity_score) as avg_similarity_score
FROM recommendation_feedback
GROUP BY source_property_id;

-- View: Property Score Trends
CREATE OR REPLACE VIEW property_score_trends AS
SELECT 
  property_id,
  COUNT(*) as score_count,
  MIN(score) as min_score,
  MAX(score) as max_score,
  AVG(score) as avg_score,
  (ARRAY_AGG(score ORDER BY created_at DESC))[1] as latest_score,
  (ARRAY_AGG(score ORDER BY created_at DESC))[1] - (ARRAY_AGG(score ORDER BY created_at DESC))[COUNT(*)] as score_change,
  MAX(created_at) as last_updated
FROM property_score_history
GROUP BY property_id;

-- ============================================
-- Functions for Analytics
-- ============================================

-- Function: Get AI cost for date range
CREATE OR REPLACE FUNCTION get_ai_cost_for_period(
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  service_filter VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  service_type VARCHAR(50),
  total_cost DECIMAL(10, 6),
  request_count BIGINT,
  avg_cost_per_request DECIMAL(10, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aum.service_type,
    SUM(aum.cost) as total_cost,
    COUNT(*) as request_count,
    AVG(aum.cost) as avg_cost_per_request
  FROM ai_usage_metrics aum
  WHERE aum.created_at BETWEEN start_date AND end_date
    AND (service_filter IS NULL OR aum.service_type = service_filter)
  GROUP BY aum.service_type
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get search conversion funnel
CREATE OR REPLACE FUNCTION get_search_conversion_funnel(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_searches BIGINT,
  searches_with_results BIGINT,
  searches_with_clicks BIGINT,
  searches_with_favorites BIGINT,
  searches_with_conversion BIGINT,
  click_rate DECIMAL(5, 2),
  favorite_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_searches,
    SUM(CASE WHEN results_count > 0 THEN 1 ELSE 0 END) as searches_with_results,
    SUM(CASE WHEN array_length(clicked_property_ids, 1) > 0 THEN 1 ELSE 0 END) as searches_with_clicks,
    SUM(CASE WHEN array_length(favorited_property_ids, 1) > 0 THEN 1 ELSE 0 END) as searches_with_favorites,
    SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END) as searches_with_conversion,
    (SUM(CASE WHEN array_length(clicked_property_ids, 1) > 0 THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100)::DECIMAL(5,2) as click_rate,
    (SUM(CASE WHEN array_length(favorited_property_ids, 1) > 0 THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100)::DECIMAL(5,2) as favorite_rate,
    (SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100)::DECIMAL(5,2) as conversion_rate
  FROM search_analytics
  WHERE created_at >= CURRENT_DATE - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Insert sample data for testing (optional)
-- ============================================

-- Sample AI usage metrics
INSERT INTO ai_usage_metrics (service_type, operation, model, total_tokens, cost, latency_ms, success)
SELECT 
  'scoring' as service_type,
  'calculate_property_score' as operation,
  'gpt-4' as model,
  (RANDOM() * 1000 + 500)::INTEGER as total_tokens,
  (RANDOM() * 0.05 + 0.01)::DECIMAL(10, 8) as cost,
  (RANDOM() * 2000 + 500)::INTEGER as latency_ms,
  true as success
FROM generate_series(1, 100);

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO homehistory_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO homehistory_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO homehistory_app;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE ai_usage_metrics IS 'Tracks all AI service usage including costs, tokens, and performance';
COMMENT ON TABLE recommendation_feedback IS 'Stores user feedback on property recommendations for ML training';
COMMENT ON TABLE search_analytics IS 'Comprehensive search analytics including natural language queries';
COMMENT ON TABLE property_score_history IS 'Historical record of property scores and changes over time';
COMMENT ON TABLE ai_cache_metrics IS 'Performance metrics for AI caching system';
COMMENT ON TABLE ai_performance_alerts IS 'System alerts for AI performance issues';
COMMENT ON TABLE embedding_generation_log IS 'Log of all embedding generation operations';
COMMENT ON TABLE ai_cost_summary_hourly IS 'Hourly aggregation of AI costs for reporting';

-- ============================================
-- Maintenance
-- ============================================

-- Auto-vacuum configuration for high-write tables
ALTER TABLE ai_usage_metrics SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE search_analytics SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE ai_cache_metrics SET (autovacuum_vacuum_scale_factor = 0.05);

-- Partition property_score_history by month (PostgreSQL 11+)
-- This improves query performance for historical data
-- (Optional - can be implemented later if needed)

COMMENT ON SCHEMA public IS 'HomeHistory AI Analytics Schema - Tracks usage, performance, and user interactions';

