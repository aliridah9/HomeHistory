-- AI Module Database Schema
-- Property embeddings for semantic search and similarity matching

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Property embeddings table
CREATE TABLE IF NOT EXISTS property_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Embedding data
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL, -- Default dimension for text-embedding-3-small
  model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,8) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT property_embeddings_property_unique UNIQUE (property_id)
);

-- Indexes for vector similarity search
CREATE INDEX idx_property_embeddings_vector ON property_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_property_embeddings_property_id ON property_embeddings(property_id);
CREATE INDEX idx_property_embeddings_model ON property_embeddings(model);
CREATE INDEX idx_property_embeddings_created_at ON property_embeddings(created_at);

-- AI usage metrics table
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id VARCHAR(100) NOT NULL,
  
  -- User and context
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  
  -- Model and operation
  model VARCHAR(50) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  
  -- Token usage
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Cost and performance
  cost DECIMAL(10,8) DEFAULT 0,
  latency INTEGER DEFAULT 0, -- milliseconds
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'success',
  error_code VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage analytics
CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id);
CREATE INDEX idx_ai_usage_metrics_property_id ON ai_usage_metrics(property_id);
CREATE INDEX idx_ai_usage_metrics_model ON ai_usage_metrics(model);
CREATE INDEX idx_ai_usage_metrics_operation ON ai_usage_metrics(operation);
CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at);
CREATE INDEX idx_ai_usage_metrics_request_id ON ai_usage_metrics(request_id);

-- AI analysis results table
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id VARCHAR(100) NOT NULL,
  
  -- Context
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  document_id UUID REFERENCES raw_documents(id),
  
  -- Analysis details
  analysis_type VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  
  -- Results
  summary TEXT,
  structured_data JSONB DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0,
  
  -- Metadata
  processing_time INTEGER DEFAULT 0,
  cached BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for analysis results
CREATE INDEX idx_ai_analysis_results_user_id ON ai_analysis_results(user_id);
CREATE INDEX idx_ai_analysis_results_property_id ON ai_analysis_results(property_id);
CREATE INDEX idx_ai_analysis_results_document_id ON ai_analysis_results(document_id);
CREATE INDEX idx_ai_analysis_results_analysis_type ON ai_analysis_results(analysis_type);
CREATE INDEX idx_ai_analysis_results_created_at ON ai_analysis_results(created_at);
CREATE INDEX idx_ai_analysis_results_expires_at ON ai_analysis_results(expires_at);

-- Batch processing jobs table
CREATE TABLE IF NOT EXISTS ai_batch_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- Job details
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- User context
  user_id UUID REFERENCES users(id),
  
  -- Job data
  items JSONB DEFAULT '[]',
  results JSONB DEFAULT '[]',
  progress DECIMAL(5,2) DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for batch jobs
CREATE INDEX idx_ai_batch_jobs_job_id ON ai_batch_jobs(job_id);
CREATE INDEX idx_ai_batch_jobs_user_id ON ai_batch_jobs(user_id);
CREATE INDEX idx_ai_batch_jobs_status ON ai_batch_jobs(status);
CREATE INDEX idx_ai_batch_jobs_job_type ON ai_batch_jobs(job_type);
CREATE INDEX idx_ai_batch_jobs_created_at ON ai_batch_jobs(created_at);

-- RLS Policies for AI tables

-- Property embeddings - users can only access embeddings for their properties
ALTER TABLE property_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their properties" ON property_embeddings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_embeddings.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage all embeddings" ON property_embeddings
  FOR ALL
  USING (auth.role() = 'service_role');

-- AI usage metrics - users can only view their own metrics
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage metrics" ON ai_usage_metrics
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert usage metrics" ON ai_usage_metrics
  FOR INSERT
  WITH CHECK (true);

-- AI analysis results - users can only access their own results
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis results" ON ai_analysis_results
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage analysis results" ON ai_analysis_results
  FOR ALL
  USING (auth.role() = 'service_role');

-- AI batch jobs - users can only access their own jobs
ALTER TABLE ai_batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own batch jobs" ON ai_batch_jobs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage batch jobs" ON ai_batch_jobs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Functions for vector similarity search optimization

-- Function to update embedding updated_at timestamp
CREATE OR REPLACE FUNCTION update_embedding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_embedding_updated_at
  BEFORE UPDATE ON property_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding_updated_at();

-- Function to clean up expired analysis results
CREATE OR REPLACE FUNCTION cleanup_expired_analysis_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_analysis_results
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for AI analytics dashboard
CREATE OR REPLACE VIEW ai_analytics_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  model,
  operation,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(latency) as avg_latency,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
FROM ai_usage_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), model, operation
ORDER BY date DESC, total_cost DESC;