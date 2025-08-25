-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_type VARCHAR(100) NOT NULL, -- 'plumbing', 'electrical', 'hvac', 'general', etc.
  
  -- Status and priority
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  
  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  actual_cost DECIMAL(10,2),
  
  -- Additional details
  notes TEXT,
  recurring_frequency VARCHAR(20), -- 'weekly', 'monthly', 'quarterly', 'annually'
  
  -- Contractor/Service provider
  contractor_name VARCHAR(255),
  contractor_contact VARCHAR(255),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT maintenance_records_property_created_idx UNIQUE (property_id, created_at)
);

CREATE INDEX idx_maintenance_records_property_id ON maintenance_records(property_id);
CREATE INDEX idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_records_scheduled_date ON maintenance_records(scheduled_date);
CREATE INDEX idx_maintenance_records_maintenance_type ON maintenance_records(maintenance_type);
CREATE INDEX idx_maintenance_records_created_by ON maintenance_records(created_by);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_enabled BOOLEAN DEFAULT true,
  email_maintenance_reminders BOOLEAN DEFAULT true,
  email_report_ready BOOLEAN DEFAULT true,
  email_document_processed BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  
  -- Push notification preferences
  push_enabled BOOLEAN DEFAULT true,
  push_maintenance_reminders BOOLEAN DEFAULT true,
  push_report_ready BOOLEAN DEFAULT true,
  push_document_processed BOOLEAN DEFAULT false,
  
  -- In-app notification preferences
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_maintenance_reminders BOOLEAN DEFAULT true,
  in_app_report_ready BOOLEAN DEFAULT true,
  in_app_document_processed BOOLEAN DEFAULT true,
  
  -- Frequency settings
  digest_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notification_preferences_user_idx UNIQUE (user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  type VARCHAR(100) NOT NULL, -- 'maintenance_reminder', 'report_ready', 'document_processed', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  data JSONB,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery channels
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'email', 'push', 'in_app'
  
  -- Related entities
  entity_type VARCHAR(50), -- 'property', 'maintenance', 'report', 'document'
  entity_id UUID,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT push_subscriptions_endpoint_idx UNIQUE (endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS Policies for maintenance_records
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view maintenance for their properties" ON maintenance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = maintenance_records.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert maintenance for their properties" ON maintenance_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = maintenance_records.property_id 
      AND properties.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their maintenance records" ON maintenance_records
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their maintenance records" ON maintenance_records
  FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true); -- Only backend with service key can insert

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());