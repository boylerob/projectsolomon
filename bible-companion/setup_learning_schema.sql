-- Learning system database schema
-- This sets up the tables for the collective intelligence system

-- Core learning tables
CREATE TABLE IF NOT EXISTS query_patterns (
  id SERIAL PRIMARY KEY,
  pattern_hash VARCHAR(64) UNIQUE,
  normalized_pattern TEXT,
  category VARCHAR(50),
  keywords TEXT[],
  confidence_score FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_responses (
  id SERIAL PRIMARY KEY,
  original_query TEXT NOT NULL,
  response_summary VARCHAR(500),
  response_length INTEGER,
  biblical_references JSONB,
  key_topics TEXT[],
  sentiment_score FLOAT,
  complexity_level INTEGER,
  user_context JSONB,
  pattern_id INTEGER REFERENCES query_patterns(id),
  success_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS response_content (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES ai_responses(id),
  content_chunks JSONB,
  embedding_vector FLOAT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS response_variations (
  id SERIAL PRIMARY KEY,
  base_response_id INTEGER REFERENCES ai_responses(id),
  variation_type VARCHAR(50),
  variation_data JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_query_patterns_hash ON query_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_query_patterns_category ON query_patterns(category);
CREATE INDEX IF NOT EXISTS idx_query_patterns_keywords ON query_patterns USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_ai_responses_pattern ON ai_responses(pattern_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_created ON ai_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_responses_topics ON ai_responses USING GIN(key_topics);
CREATE INDEX IF NOT EXISTS idx_ai_responses_biblical ON ai_responses USING GIN(biblical_references);
CREATE INDEX IF NOT EXISTS idx_ai_responses_complexity ON ai_responses(complexity_level);
CREATE INDEX IF NOT EXISTS idx_ai_responses_sentiment ON ai_responses(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_response_content_response ON response_content(response_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_query_patterns_updated_at 
    BEFORE UPDATE ON query_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial categories for organization
INSERT INTO query_patterns (pattern_hash, normalized_pattern, category, keywords, confidence_score) VALUES
('d41d8cd98f00b204e9800998ecf8427e', 'prayer guidance', 'prayer', ARRAY['pray', 'prayer', 'guidance'], 0.0),
('a1b2c3d4e5f678901234567890123456', 'biblical interpretation', 'interpretation', ARRAY['bible', 'interpret', 'meaning'], 0.0),
('b2c3d4e5f6789012345678901234567', 'life application', 'application', ARRAY['apply', 'life', 'practical'], 0.0)
ON CONFLICT (pattern_hash) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres; 