const { query, transaction } = require('../config/database');

// Initialize database tables
async function initializeDatabase() {
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table (base for all user types)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Student profiles table
    CREATE TABLE IF NOT EXISTS student_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skills TEXT[] DEFAULT '{}',
      domains TEXT[] DEFAULT '{}',
      interests TEXT,
      career_goals TEXT,
      university VARCHAR(255),
      major VARCHAR(255),
      graduation_year INTEGER,
      linkedin_url TEXT,
      portfolio_url TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Alumni profiles table
    CREATE TABLE IF NOT EXISTS alumni_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company VARCHAR(255),
      job_title VARCHAR(255),
      experience_years INTEGER DEFAULT 0,
      skills TEXT[] DEFAULT '{}',
      domains TEXT[] DEFAULT '{}',
      calcom_event_type_id VARCHAR(100),
      calcom_username VARCHAR(100),
      linkedin_url TEXT,
      is_available_for_mentorship BOOLEAN DEFAULT true,
      max_mentees INTEGER DEFAULT 5,
      current_mentees INTEGER DEFAULT 0,
      bio TEXT,
      graduation_year INTEGER,
      alma_mater VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Opportunities table
    CREATE TABLE IF NOT EXISTS opportunities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      alumni_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('internship', 'project', 'referral', 'mentorship', 'job')),
      company VARCHAR(255),
      location VARCHAR(255),
      is_remote BOOLEAN DEFAULT false,
      required_skills TEXT[] DEFAULT '{}',
      required_domains TEXT[] DEFAULT '{}',
      deadline DATE,
      external_link TEXT,
      is_active BOOLEAN DEFAULT true,
      views_count INTEGER DEFAULT 0,
      applications_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Mentorship sessions/bookings table
    CREATE TABLE IF NOT EXISTS mentorship_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alumni_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      calcom_booking_id VARCHAR(255),
      calcom_event_type_id VARCHAR(100),
      scheduled_at TIMESTAMP NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
      meeting_link TEXT,
      notes TEXT,
      student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
      student_feedback TEXT,
      alumni_notes TEXT,
      cancelled_by UUID REFERENCES users(id),
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Opportunity applications table
    CREATE TABLE IF NOT EXISTS opportunity_applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
      cover_note TEXT,
      resume_url TEXT,
      compatibility_score INTEGER DEFAULT NULL,
      skill_analysis JSONB DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(opportunity_id, student_id)
    );

    -- Matchmaking cache table
    CREATE TABLE IF NOT EXISTS matchmaking_cache (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cached_matches JSONB NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Conversations table for chat
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      participant_one UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant_two UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(participant_one, participant_two)
    );

    -- Messages table for chat
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      data JSONB DEFAULT '{}',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON alumni_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_opportunities_alumni_id ON opportunities(alumni_id);
    CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
    CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON opportunities(is_active);
    CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_student_id ON mentorship_sessions(student_id);
    CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_alumni_id ON mentorship_sessions(alumni_id);
    CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_matchmaking_cache_student_id ON matchmaking_cache(student_id);
    CREATE INDEX IF NOT EXISTS idx_matchmaking_cache_expires_at ON matchmaking_cache(expires_at);

    -- Chat and notification indexes
    CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one);
    CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
    CREATE INDEX IF NOT EXISTS idx_opportunity_applications_student ON opportunity_applications(student_id);
    CREATE INDEX IF NOT EXISTS idx_opportunity_applications_opportunity ON opportunity_applications(opportunity_id);

    -- GIN indexes for array searches
    CREATE INDEX IF NOT EXISTS idx_student_skills ON student_profiles USING GIN(skills);
    CREATE INDEX IF NOT EXISTS idx_student_domains ON student_profiles USING GIN(domains);
    CREATE INDEX IF NOT EXISTS idx_alumni_skills ON alumni_profiles USING GIN(skills);
    CREATE INDEX IF NOT EXISTS idx_alumni_domains ON alumni_profiles USING GIN(domains);
    CREATE INDEX IF NOT EXISTS idx_opportunities_required_skills ON opportunities USING GIN(required_skills);
    CREATE INDEX IF NOT EXISTS idx_opportunities_required_domains ON opportunities USING GIN(required_domains);
  `;

  try {
    await query(createTablesSQL);
    console.log('✅ Database tables created/verified successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Ensure resume analysis columns exist for existing deployments
async function ensureResumeAnalysisColumns() {
  const alterSQL = `
    ALTER TABLE opportunity_applications
    ADD COLUMN IF NOT EXISTS compatibility_score INTEGER DEFAULT NULL;

    ALTER TABLE opportunity_applications
    ADD COLUMN IF NOT EXISTS skill_analysis JSONB DEFAULT NULL;
  `;

  try {
    await query(alterSQL);
    console.log('✅ Ensured resume analysis columns exist');
  } catch (error) {
    console.error('❌ Error ensuring resume analysis columns:', error);
    throw error;
  }
}

// Create update timestamp trigger function
async function createTriggers() {
  const triggerSQL = `
    -- Create or replace the update timestamp function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Drop existing triggers if they exist and recreate
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
    CREATE TRIGGER update_student_profiles_updated_at
      BEFORE UPDATE ON student_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_alumni_profiles_updated_at ON alumni_profiles;
    CREATE TRIGGER update_alumni_profiles_updated_at
      BEFORE UPDATE ON alumni_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
    CREATE TRIGGER update_opportunities_updated_at
      BEFORE UPDATE ON opportunities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_mentorship_sessions_updated_at ON mentorship_sessions;
    CREATE TRIGGER update_mentorship_sessions_updated_at
      BEFORE UPDATE ON mentorship_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await query(triggerSQL);
    console.log('✅ Database triggers created successfully');
  } catch (error) {
    console.error('❌ Error creating triggers:', error);
    throw error;
  }
}

module.exports = { initializeDatabase: async () => {
  await initializeDatabase();
  await ensureResumeAnalysisColumns();
  await createTriggers();
}};
