-- ============================================================================
-- MIGRATION 025: CREATE NICE-TO-HAVE TABLES FOR ADVANCED FEATURES
-- ============================================================================
-- Purpose: Create additional tables for analytics, audit, notifications, etc.
-- Run: psql -U postgres -d nutrichain -f 025_create_nice_to_have_tables.sql
-- ============================================================================

-- 1. SYSTEM CONFIG TABLE
-- Stores application settings that can be changed from admin panel
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'ai', 'blockchain', 'payment', 'notification', 'general'
    is_public BOOLEAN DEFAULT false, -- Can be viewed by public
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_category ON system_config(category);

-- 2. USER ACTIVITY LOGS TABLE
-- Track user actions for security audit
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'verify_delivery', 'report_issue', 'lock_escrow', 'release_escrow', 'view_report'
    entity_type VARCHAR(50), -- 'delivery', 'verification', 'payment', 'escrow', 'user', 'school', 'catering'
    entity_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Additional context data
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_action ON user_activity_logs(action_type);
CREATE INDEX idx_user_activity_created ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_entity ON user_activity_logs(entity_type, entity_id);

-- 3. NOTIFICATIONS TABLE
-- In-app notifications for all users
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'delivery_reminder', 'payment_received', 'payment_pending', 'issue_alert', 'system_announcement', 'verification_required'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url TEXT, -- URL to navigate when clicked
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- 4. REGIONAL STATISTICS TABLE
-- Aggregate stats per province/city/district
CREATE TABLE IF NOT EXISTS regional_statistics (
    id SERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    region_code VARCHAR(20),
    total_schools INTEGER DEFAULT 0,
    covered_schools INTEGER DEFAULT 0,
    coverage_percentage DECIMAL(5,2) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    total_portions_delivered INTEGER DEFAULT 0,
    total_budget_allocated DECIMAL(18,2) DEFAULT 0,
    total_budget_disbursed DECIMAL(18,2) DEFAULT 0,
    avg_priority_score DECIMAL(5,2),
    avg_poverty_rate DECIMAL(5,2),
    avg_stunting_rate DECIMAL(5,2),
    active_caterings INTEGER DEFAULT 0,
    total_issues INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regional_stats_province ON regional_statistics(province);
CREATE INDEX idx_regional_stats_city ON regional_statistics(province, city);
CREATE INDEX idx_regional_stats_period ON regional_statistics(period_start, period_end);

-- 5. CATERING CONTRACTS TABLE
-- Formal contracts between government and caterings
CREATE TABLE IF NOT EXISTS catering_contracts (
    id SERIAL PRIMARY KEY,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'emergency'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    service_provinces TEXT[], -- Array of province names
    service_cities TEXT[], -- Array of city names
    service_districts TEXT[], -- Array of district names
    assigned_school_ids INTEGER[], -- Array of school IDs
    max_schools INTEGER,
    price_per_portion DECIMAL(10,2) NOT NULL,
    max_daily_portions INTEGER,
    min_daily_portions INTEGER,
    total_contract_value DECIMAL(18,2),
    sla_terms JSONB, -- {on_time_percentage: 95, quality_min_score: 4.0, max_issues_per_month: 5}
    penalties JSONB, -- {late_delivery: 100000, quality_issue: 500000, missed_delivery: 1000000}
    payment_terms VARCHAR(100), -- 'weekly', 'bi-weekly', 'monthly'
    status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'suspended', 'expired', 'terminated'
    signed_at TIMESTAMP,
    signed_by INTEGER REFERENCES users(id),
    terminated_at TIMESTAMP,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contracts_catering ON catering_contracts(catering_id);
CREATE INDEX idx_contracts_status ON catering_contracts(status);
CREATE INDEX idx_contracts_dates ON catering_contracts(start_date, end_date);

-- 6. MENU PLANS TABLE
-- Weekly/monthly menu planning per catering
CREATE TABLE IF NOT EXISTS menu_plans (
    id SERIAL PRIMARY KEY,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'snack_morning', 'snack_afternoon'
    menu_name VARCHAR(255) NOT NULL,
    description TEXT,
    calories INTEGER,
    protein_grams DECIMAL(5,2),
    carbs_grams DECIMAL(5,2),
    fat_grams DECIMAL(5,2),
    fiber_grams DECIMAL(5,2),
    sodium_mg DECIMAL(7,2),
    sugar_grams DECIMAL(5,2),
    ingredients JSONB, -- [{name: "Nasi", amount: "150g"}, {name: "Ayam", amount: "100g"}]
    allergens TEXT[], -- ['gluten', 'dairy', 'nuts']
    is_vegetarian BOOLEAN DEFAULT false,
    is_halal BOOLEAN DEFAULT true,
    is_bgn_compliant BOOLEAN DEFAULT false, -- Buah, Gizi, Nabati standards
    bgn_score DECIMAL(3,2), -- 0.00 - 1.00
    estimated_cost DECIMAL(10,2),
    image_url TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(catering_id, plan_date, meal_type)
);

CREATE INDEX idx_menu_plans_catering ON menu_plans(catering_id);
CREATE INDEX idx_menu_plans_date ON menu_plans(plan_date);
CREATE INDEX idx_menu_plans_bgn ON menu_plans(is_bgn_compliant);

-- 7. PERFORMANCE METRICS TABLE
-- KPI tracking for schools & caterings
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'catering', 'school'
    entity_id INTEGER NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Common metrics
    total_deliveries INTEGER DEFAULT 0,
    total_portions INTEGER DEFAULT 0,
    -- Catering-specific metrics
    on_time_deliveries INTEGER DEFAULT 0,
    on_time_rate DECIMAL(5,2), -- percentage
    quality_avg_score DECIMAL(3,2), -- 1.00 - 5.00
    total_issues INTEGER DEFAULT 0,
    issue_rate DECIMAL(5,2), -- percentage
    total_revenue DECIMAL(18,2),
    -- School-specific metrics
    verifications_completed INTEGER DEFAULT 0,
    verification_speed_avg_minutes INTEGER, -- average minutes to verify
    reports_submitted INTEGER DEFAULT 0,
    response_time_avg_hours INTEGER,
    -- Calculated scores
    overall_score DECIMAL(5,2), -- 0.00 - 100.00
    rank_in_category INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, period_type, period_start)
);

CREATE INDEX idx_perf_metrics_entity ON performance_metrics(entity_type, entity_id);
CREATE INDEX idx_perf_metrics_period ON performance_metrics(period_start, period_end);
CREATE INDEX idx_perf_metrics_score ON performance_metrics(overall_score DESC);

-- 8. PUBLIC FEEDBACK TABLE
-- Feedback from parents, community
CREATE TABLE IF NOT EXISTS public_feedback (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'praise', 'complaint', 'suggestion', 'question'
    category VARCHAR(50), -- 'food_quality', 'delivery', 'portion', 'hygiene', 'service', 'other'
    submitter_name VARCHAR(255),
    submitter_email VARCHAR(255),
    submitter_phone VARCHAR(20),
    submitter_role VARCHAR(50), -- 'parent', 'community', 'teacher', 'student', 'anonymous'
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    is_anonymous BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'responded', 'archived'
    response TEXT,
    responded_by INTEGER REFERENCES users(id),
    responded_at TIMESTAMP,
    moderated_by INTEGER REFERENCES users(id),
    moderated_at TIMESTAMP,
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_school ON public_feedback(school_id);
CREATE INDEX idx_feedback_catering ON public_feedback(catering_id);
CREATE INDEX idx_feedback_type ON public_feedback(feedback_type);
CREATE INDEX idx_feedback_status ON public_feedback(status);
CREATE INDEX idx_feedback_published ON public_feedback(is_published) WHERE is_published = true;

-- 9. BUDGET ALLOCATIONS TABLE
-- Budget allocation per fiscal period per region
CREATE TABLE IF NOT EXISTS budget_allocations (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER, -- 1, 2, 3, 4 or NULL for annual
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    allocation_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'emergency', 'supplemental'
    source_fund VARCHAR(100), -- 'APBN', 'APBD', 'DAK', 'BOS'
    total_budget DECIMAL(18,2) NOT NULL,
    allocated_amount DECIMAL(18,2) DEFAULT 0,
    disbursed_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount DECIMAL(18,2),
    target_schools INTEGER,
    target_students INTEGER,
    target_portions INTEGER,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'active', 'depleted', 'closed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_year ON budget_allocations(fiscal_year);
CREATE INDEX idx_budget_province ON budget_allocations(province);
CREATE INDEX idx_budget_status ON budget_allocations(status);

-- 10. AUDIT TRAILS TABLE
-- Immutable log for all financial transactions
CREATE TABLE IF NOT EXISTS audit_trails (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL, -- 'escrow_locked', 'escrow_released', 'payment_sent', 'refund_issued', 'budget_allocated'
    actor_id INTEGER REFERENCES users(id),
    actor_role VARCHAR(50),
    actor_email VARCHAR(255),
    entity_type VARCHAR(50) NOT NULL, -- 'escrow', 'payment', 'delivery', 'budget', 'contract'
    entity_id INTEGER NOT NULL,
    amount DECIMAL(18,2),
    currency VARCHAR(10) DEFAULT 'IDR',
    before_state JSONB, -- State before the action
    after_state JSONB, -- State after the action
    changes JSONB, -- Summary of what changed
    tx_hash VARCHAR(66), -- Blockchain transaction hash if applicable
    block_number INTEGER,
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    is_system_action BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_action ON audit_trails(action);
CREATE INDEX idx_audit_actor ON audit_trails(actor_id);
CREATE INDEX idx_audit_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_trails(created_at DESC);
CREATE INDEX idx_audit_tx_hash ON audit_trails(tx_hash) WHERE tx_hash IS NOT NULL;

-- 11. SCHOOL STUDENT COUNTS TABLE
-- Historical student counts per school per academic year
CREATE TABLE IF NOT EXISTS school_student_counts (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL, -- '2024/2025'
    semester INTEGER, -- 1 or 2
    total_students INTEGER NOT NULL,
    male_students INTEGER,
    female_students INTEGER,
    eligible_students INTEGER, -- Students eligible for MBG program
    special_needs_students INTEGER,
    grade_breakdown JSONB, -- {"grade_1": 50, "grade_2": 45, ...}
    data_source VARCHAR(50), -- 'dapodik', 'manual', 'survey'
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(school_id, academic_year, semester)
);

CREATE INDEX idx_student_counts_school ON school_student_counts(school_id);
CREATE INDEX idx_student_counts_year ON school_student_counts(academic_year);

-- 12. CATERING MENU CATALOG TABLE
-- Master catalog of all menu items per catering
CREATE TABLE IF NOT EXISTS catering_menu_catalog (
    id SERIAL PRIMARY KEY,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE CASCADE,
    menu_code VARCHAR(50) NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'main_course', 'side_dish', 'soup', 'dessert', 'beverage', 'snack'
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    portion_size VARCHAR(50), -- '150g', '200ml'
    preparation_time_minutes INTEGER,
    shelf_life_hours INTEGER,
    storage_temp VARCHAR(50), -- 'room', 'refrigerated', 'frozen'
    calories INTEGER,
    protein_grams DECIMAL(5,2),
    carbs_grams DECIMAL(5,2),
    fat_grams DECIMAL(5,2),
    ingredients TEXT[],
    allergens TEXT[],
    is_vegetarian BOOLEAN DEFAULT false,
    is_halal BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    min_order_quantity INTEGER DEFAULT 50,
    image_url TEXT,
    nutritional_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(catering_id, menu_code)
);

CREATE INDEX idx_menu_catalog_catering ON catering_menu_catalog(catering_id);
CREATE INDEX idx_menu_catalog_category ON catering_menu_catalog(category);
CREATE INDEX idx_menu_catalog_available ON catering_menu_catalog(is_available) WHERE is_available = true;

-- 13. DELIVERY ROUTES TABLE
-- Optimized delivery routes for caterings
CREATE TABLE IF NOT EXISTS delivery_routes (
    id SERIAL PRIMARY KEY,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE CASCADE,
    route_date DATE NOT NULL,
    route_name VARCHAR(100),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(50), -- 'motorcycle', 'car', 'van', 'truck'
    schools_order INTEGER[] NOT NULL, -- Array of school_ids in delivery order
    estimated_start_time TIME,
    estimated_end_time TIME,
    actual_start_time TIME,
    actual_end_time TIME,
    total_distance_km DECIMAL(8,2),
    total_portions INTEGER,
    total_schools INTEGER,
    route_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    waypoints JSONB, -- [{school_id: 1, eta: "08:00", distance_from_prev: 5.2}, ...]
    optimization_score DECIMAL(5,2), -- Route efficiency score
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_routes_catering ON delivery_routes(catering_id);
CREATE INDEX idx_routes_date ON delivery_routes(route_date);
CREATE INDEX idx_routes_status ON delivery_routes(route_status);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all new tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'system_config', 'notifications', 'regional_statistics',
            'catering_contracts', 'menu_plans', 'public_feedback',
            'budget_allocations', 'school_student_counts',
            'catering_menu_catalog', 'delivery_routes'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE system_config IS 'Application configuration settings manageable via admin panel';
COMMENT ON TABLE user_activity_logs IS 'Audit log of all user actions for security compliance';
COMMENT ON TABLE notifications IS 'In-app notifications for all user types';
COMMENT ON TABLE regional_statistics IS 'Aggregated statistics per geographic region';
COMMENT ON TABLE catering_contracts IS 'Formal service contracts with catering vendors';
COMMENT ON TABLE menu_plans IS 'Daily/weekly menu plans with nutritional information';
COMMENT ON TABLE performance_metrics IS 'KPI metrics for schools and caterings';
COMMENT ON TABLE public_feedback IS 'Public feedback from parents and community';
COMMENT ON TABLE budget_allocations IS 'Budget allocation tracking per fiscal period';
COMMENT ON TABLE audit_trails IS 'Immutable audit trail for financial transactions';
COMMENT ON TABLE school_student_counts IS 'Historical student enrollment data';
COMMENT ON TABLE catering_menu_catalog IS 'Master catalog of available menu items';
COMMENT ON TABLE delivery_routes IS 'Optimized delivery routes for logistics';

SELECT 'Migration 025 completed successfully - All nice-to-have tables created!' as status;
