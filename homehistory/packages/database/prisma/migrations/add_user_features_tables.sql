-- Migration: Add User Features Tables (Saved Searches, Favorites, Preferences)
-- This migration creates tables for user-specific AI features
-- Created: 2024

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    alerts_enabled BOOLEAN DEFAULT false,
    results_count INTEGER DEFAULT 0,
    new_results_count INTEGER DEFAULT 0,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT saved_searches_user_id_idx UNIQUE (user_id, name)
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_alerts_enabled ON saved_searches(alerts_enabled) WHERE alerts_enabled = true;
CREATE INDEX idx_saved_searches_last_checked ON saved_searches(last_checked);

COMMENT ON TABLE saved_searches IS 'User saved property search queries with alert configuration';
COMMENT ON COLUMN saved_searches.query IS 'Natural language search query';
COMMENT ON COLUMN saved_searches.filters IS 'Additional structured filters (price range, beds, baths, etc.)';
COMMENT ON COLUMN saved_searches.alerts_enabled IS 'Whether user wants email/push notifications for new results';
COMMENT ON COLUMN saved_searches.new_results_count IS 'Number of new properties since last checked';


-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT favorites_user_property_unique UNIQUE (user_id, property_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);
CREATE INDEX idx_favorites_tags ON favorites USING GIN(tags);
CREATE INDEX idx_favorites_saved_at ON favorites(saved_at DESC);

COMMENT ON TABLE favorites IS 'User favorite properties with personal notes and tags';
COMMENT ON COLUMN favorites.notes IS 'Personal notes about the property';
COMMENT ON COLUMN favorites.tags IS 'User-defined tags for organization (e.g., "top-choice", "backup-option")';


-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- AI Search Preferences
    search_preferences JSONB DEFAULT '{
        "enableNaturalLanguage": true,
        "saveSearchHistory": true,
        "enableSmartSuggestions": true,
        "preferenceWeight": {
            "location": 80,
            "price": 90,
            "size": 70,
            "quality": 85
        }
    }',
    
    -- AI Recommendation Preferences
    recommendation_preferences JSONB DEFAULT '{
        "enableRecommendations": true,
        "diversityLevel": "medium",
        "exploreNewAreas": false,
        "similarityThreshold": 75
    }',
    
    -- Scoring Preferences
    scoring_preferences JSONB DEFAULT '{
        "priorityFactors": ["safety", "value", "location"],
        "minimumScore": 60,
        "showDetailedBreakdown": true
    }',
    
    -- Notification Preferences
    notification_preferences JSONB DEFAULT '{
        "newRecommendations": true,
        "scoreChanges": false,
        "marketInsights": true,
        "priceDrops": true
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'User AI preferences and settings';
COMMENT ON COLUMN user_preferences.search_preferences IS 'Natural language search and search history preferences';
COMMENT ON COLUMN user_preferences.recommendation_preferences IS 'AI recommendation algorithm preferences';
COMMENT ON COLUMN user_preferences.scoring_preferences IS 'HomeHistory Score priority factors';
COMMENT ON COLUMN user_preferences.notification_preferences IS 'AI notification settings';


-- ============================================
-- SEARCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL, -- 'natural', 'semantic', 'structured'
    filters JSONB DEFAULT '{}',
    extracted_criteria JSONB,
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Privacy: auto-delete after 90 days
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days')
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_session_id ON search_history(session_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX idx_search_history_expires_at ON search_history(expires_at);

COMMENT ON TABLE search_history IS 'User search history for improving recommendations (auto-deleted after 90 days)';
COMMENT ON COLUMN search_history.extracted_criteria IS 'AI-extracted search criteria from natural language';
COMMENT ON COLUMN search_history.expires_at IS 'Automatic deletion date for privacy';


-- ============================================
-- FAVORITE PRICE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_price_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    favorite_id UUID NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_price DECIMAL(12, 2),
    current_price DECIMAL(12, 2),
    price_change DECIMAL(12, 2),
    price_change_percentage DECIMAL(5, 2),
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fav_price_tracking_favorite_id ON favorite_price_tracking(favorite_id);
CREATE INDEX idx_fav_price_tracking_user_id ON favorite_price_tracking(user_id);
CREATE INDEX idx_fav_price_tracking_last_checked ON favorite_price_tracking(last_checked);

COMMENT ON TABLE favorite_price_tracking IS 'Track price changes for favorited properties';
COMMENT ON COLUMN favorite_price_tracking.notification_sent IS 'Whether user has been notified of this price change';


-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Updated_at trigger for saved_searches
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- Updated_at trigger for favorites
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_favorites_updated_at
    BEFORE UPDATE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_favorites_updated_at();

-- Updated_at trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();


-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to clean up expired search history
CREATE OR REPLACE FUNCTION cleanup_expired_search_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM search_history
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_search_history IS 'Delete search history records past their expiration date. Run daily via cron.';


-- Function to get user's favorite stats
CREATE OR REPLACE FUNCTION get_user_favorite_stats(p_user_id UUID)
RETURNS TABLE (
    total_favorites BIGINT,
    unique_tags TEXT[],
    avg_score DECIMAL,
    total_value DECIMAL,
    properties_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_favorites,
        ARRAY_AGG(DISTINCT unnest) as unique_tags,
        AVG(p.score)::DECIMAL as avg_score,
        SUM(p.price)::DECIMAL as total_value,
        jsonb_object_agg(p.property_type, type_count) as properties_by_type
    FROM favorites f
    LEFT JOIN properties p ON f.property_id = p.id,
    LATERAL unnest(f.tags) unnest,
    LATERAL (
        SELECT COUNT(*) as type_count
        FROM favorites f2
        LEFT JOIN properties p2 ON f2.property_id = p2.id
        WHERE f2.user_id = p_user_id
        AND p2.property_type = p.property_type
    ) type_counts
    WHERE f.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_favorite_stats IS 'Get comprehensive statistics about a user\'s favorite properties';


-- ============================================
-- VIEWS
-- ============================================

-- View: User Search Insights
CREATE OR REPLACE VIEW user_search_insights AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT sh.id) as total_searches,
    COUNT(DISTINCT DATE(sh.created_at)) as search_days,
    AVG(sh.results_count) as avg_results_per_search,
    AVG(sh.response_time_ms) as avg_response_time_ms,
    MODE() WITHIN GROUP (ORDER BY sh.search_type) as most_used_search_type,
    MAX(sh.created_at) as last_search_at,
    COUNT(DISTINCT CASE WHEN sh.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN sh.id END) as searches_last_7_days
FROM users u
LEFT JOIN search_history sh ON u.id = sh.user_id
GROUP BY u.id, u.email;

COMMENT ON VIEW user_search_insights IS 'User engagement metrics based on search history';


-- View: Favorite Properties with Details
CREATE OR REPLACE VIEW favorite_properties_detailed AS
SELECT 
    f.id as favorite_id,
    f.user_id,
    f.property_id,
    f.notes,
    f.tags,
    f.saved_at,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.price,
    p.beds,
    p.baths,
    p.sqft,
    p.property_type,
    p.score as homehistory_score,
    fpt.price_change,
    fpt.price_change_percentage,
    fpt.last_checked as price_last_checked
FROM favorites f
LEFT JOIN properties p ON f.property_id = p.id
LEFT JOIN favorite_price_tracking fpt ON f.id = fpt.favorite_id;

COMMENT ON VIEW favorite_properties_detailed IS 'Favorites with full property details and price tracking';


-- ============================================
-- SAMPLE DATA (optional, for development)
-- ============================================

-- Uncomment to insert sample preferences for existing users
/*
INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
*/


-- ============================================
-- GRANTS (adjust based on your user roles)
-- ============================================

-- Grant permissions (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON saved_searches TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON search_history TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON favorite_price_tracking TO app_user;

COMMENT ON SCHEMA public IS 'User features and AI preferences schema - Migration completed';

