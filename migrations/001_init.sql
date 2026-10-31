-- =========================================================
-- OmniX-AI Enterprise PostgreSQL Database Migration: 001_init.sql
-- =========================================================

-- Enable UUID extension for unique identifier generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Agents, Managers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Agent', 'Viewer')),
    department VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Silver', 'Gold', 'Enterprise')),
    lifetime_value NUMERIC(10, 2) DEFAULT 0.00,
    phone VARCHAR(50),
    preferred_channel VARCHAR(50) DEFAULT 'Mobile App',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interactions Table (Omnichannel support tickets & touchpoints)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('Web Chat', 'Mobile App', 'Email', 'Social', 'Voice')),
    device_type VARCHAR(50) DEFAULT 'Desktop' CHECK (device_type IN ('Desktop', 'Android App', 'iOS App', 'Mobile Web')),
    subject VARCHAR(255) NOT NULL,
    raw_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Escalated')),
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    category VARCHAR(100),
    sentiment_score NUMERIC(3, 2), -- Range -1.00 to 1.00
    sentiment_label VARCHAR(50),
    churn_risk VARCHAR(50) CHECK (churn_risk IN ('Low', 'Medium', 'High', 'Critical')),
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interaction Responses / Audit Log Table
CREATE TABLE IF NOT EXISTS interaction_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    responder_type VARCHAR(50) CHECK (responder_type IN ('Agent', 'Customer', 'AI_Draft')),
    message TEXT NOT NULL,
    tone_used VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Articles Table
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_status ON interactions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_sentiment ON interactions(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_interaction ON interaction_responses(interaction_id);

