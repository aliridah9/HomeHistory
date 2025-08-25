-- Create property_scores table for storing calculated scores
CREATE TABLE IF NOT EXISTS property_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Individual scores (0-10 scale)
  quality_score DECIMAL(3,1) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 10),
  safety_score DECIMAL(3,1) NOT NULL CHECK (safety_score >= 0 AND safety_score <= 10),
  value_score DECIMAL(3,1) NOT NULL CHECK (value_score >= 0 AND value_score <= 10),
  location_score DECIMAL(3,1) NOT NULL CHECK (location_score >= 0 AND location_score <= 10),
  overall_score DECIMAL(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  
  -- Explanation and metadata
  explanation TEXT NOT NULL,
  metadata JSONB,
  
  -- Timestamps
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT property_scores_property_calculated_idx UNIQUE (property_id, calculated_at)
);

CREATE INDEX idx_property_scores_property_id ON property_scores(property_id);
CREATE INDEX idx_property_scores_calculated_at ON property_scores(calculated_at DESC);

-- Create property_embeddings table for vector search
CREATE TABLE IF NOT EXISTS property_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT property_embeddings_property_idx UNIQUE (property_id)
);

CREATE INDEX idx_property_embeddings_property_id ON property_embeddings(property_id);

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION search_vectors(
  query_embedding vector,
  match_threshold float,
  match_count int,
  table_name text
)
RETURNS TABLE (
  property_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT property_id, 1 - (embedding <=> %L) as similarity
    FROM %I
    WHERE 1 - (embedding <=> %L) > %L
    ORDER BY embedding <=> %L
    LIMIT %L
  ', query_embedding, table_name, query_embedding, match_threshold, query_embedding, match_count);
END;
$$;

-- RLS Policies for property_scores
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for their properties" ON property_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_scores.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert scores" ON property_scores
  FOR INSERT
  WITH CHECK (true); -- Only backend with service key can insert

CREATE POLICY "System can update scores" ON property_scores
  FOR UPDATE
  USING (true)
  WITH CHECK (true); -- Only backend with service key can update

-- RLS Policies for property_embeddings
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

CREATE POLICY "System can manage embeddings" ON property_embeddings
  FOR ALL
  USING (true)
  WITH CHECK (true); -- Only backend with service key can manage