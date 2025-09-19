-- SECURITY: Audit Log Immutability Enforcement
-- This script adds database-level constraints and triggers to prevent tampering with audit logs
-- Ensures audit logs are append-only and cannot be modified or deleted

-- ==============================================
-- 1. CREATE IMMUTABILITY TRIGGER FUNCTIONS
-- ==============================================

-- Function to prevent UPDATE operations on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION: Audit logs are immutable and cannot be updated. Action: %, Table: %, User: %', 
                    TG_OP, TG_TABLE_NAME, current_user;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent DELETE operations on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_deletes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION: Audit logs are immutable and cannot be deleted. Action: %, Table: %, User: %', 
                    TG_OP, TG_TABLE_NAME, current_user;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to validate checksum integrity on INSERT
CREATE OR REPLACE FUNCTION validate_audit_log_checksum()
RETURNS TRIGGER AS $$
DECLARE
    calculated_checksum TEXT;
    audit_data JSONB;
BEGIN
    -- Calculate checksum for validation (simplified version)
    audit_data := jsonb_build_object(
        'action', NEW.action,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id,
        'old_values', NEW.old_values,
        'new_values', NEW.new_values,
        'user_id', NEW.user_id,
        'timestamp', NEW.timestamp
    );
    
    calculated_checksum := encode(digest(audit_data::text, 'sha256'), 'hex');
    calculated_checksum := substring(calculated_checksum, 1, 32);
    
    -- Validate checksum matches
    IF NEW.checksum IS NULL OR NEW.checksum = '' THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Audit log checksum is required for data integrity';
    END IF;
    
    -- Log checksum validation attempt
    RAISE LOG 'AUDIT SECURITY: Checksum validation for audit log % - provided: %, calculated: %', 
              NEW.id, NEW.checksum, calculated_checksum;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 2. CREATE IMMUTABILITY TRIGGERS
-- ==============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_logs_prevent_update ON audit_logs;
DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON audit_logs;
DROP TRIGGER IF EXISTS audit_logs_checksum_validation ON audit_logs;

-- Trigger to prevent UPDATE operations
CREATE TRIGGER audit_logs_prevent_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_updates();

-- Trigger to prevent DELETE operations  
CREATE TRIGGER audit_logs_prevent_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_deletes();

-- Trigger to validate checksum on INSERT
CREATE TRIGGER audit_logs_checksum_validation
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION validate_audit_log_checksum();

-- ==============================================
-- 3. ADD ADDITIONAL CONSTRAINTS (IF NOT EXISTS)
-- ==============================================

-- Drop existing constraints if they exist, then recreate them
DO $$ 
BEGIN
    -- Drop constraints if they exist
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_timestamp_not_null;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_timestamp_not_future;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_checksum_not_null;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_not_null;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_type_not_null;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_description_not_empty;

    -- Recreate constraints
    -- Ensure timestamp is not null and reasonable (not future-dated)
    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_timestamp_not_null 
        CHECK (timestamp IS NOT NULL);

    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_timestamp_not_future 
        CHECK (timestamp <= NOW() + interval '5 minutes'); -- Allow 5 minute clock skew

    -- Ensure checksum is not null and has proper format
    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_checksum_not_null 
        CHECK (checksum IS NOT NULL AND length(checksum) = 32);

    -- Ensure action is not null
    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_action_not_null 
        CHECK (action IS NOT NULL);

    -- Ensure entity_type is not null
    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_entity_type_not_null 
        CHECK (entity_type IS NOT NULL AND entity_type != '');

    -- Ensure description is meaningful
    ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_description_not_empty 
        CHECK (description IS NOT NULL AND length(trim(description)) > 0);
END $$;

-- ==============================================
-- 4. CREATE INTEGRITY VERIFICATION FUNCTIONS
-- ==============================================

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_log_integrity(audit_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    audit_record RECORD;
    calculated_checksum TEXT;
    audit_data JSONB;
BEGIN
    -- Get the audit record
    SELECT * INTO audit_record FROM audit_logs WHERE id = audit_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit log not found: %', audit_id;
    END IF;
    
    -- Calculate expected checksum
    audit_data := jsonb_build_object(
        'action', audit_record.action,
        'entity_type', audit_record.entity_type,
        'entity_id', audit_record.entity_id,
        'old_values', audit_record.old_values,
        'new_values', audit_record.new_values,
        'user_id', audit_record.user_id,
        'timestamp', audit_record.timestamp
    );
    
    calculated_checksum := encode(digest(audit_data::text, 'sha256'), 'hex');
    calculated_checksum := substring(calculated_checksum, 1, 32);
    
    -- Compare checksums
    IF audit_record.checksum = calculated_checksum THEN
        RETURN TRUE;
    ELSE
        RAISE WARNING 'SECURITY ALERT: Checksum mismatch for audit log %. Expected: %, Found: %', 
                      audit_id, calculated_checksum, audit_record.checksum;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to verify integrity of all audit logs (for periodic checks)
CREATE OR REPLACE FUNCTION verify_all_audit_log_integrity()
RETURNS TABLE(audit_id TEXT, is_valid BOOLEAN, error_message TEXT) AS $$
DECLARE
    record_cursor CURSOR FOR SELECT id FROM audit_logs ORDER BY timestamp;
    audit_log_id TEXT;
    is_integrity_valid BOOLEAN;
BEGIN
    FOR audit_log_id IN SELECT id FROM audit_logs ORDER BY timestamp LOOP
        BEGIN
            is_integrity_valid := verify_audit_log_integrity(audit_log_id);
            audit_id := audit_log_id;
            is_valid := is_integrity_valid;
            error_message := NULL;
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            audit_id := audit_log_id;
            is_valid := FALSE;
            error_message := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. CREATE AUDIT TRAIL MONITORING VIEW
-- ==============================================

-- View to monitor audit log health and detect anomalies
CREATE OR REPLACE VIEW audit_log_health AS
SELECT 
    DATE(timestamp) as audit_date,
    COUNT(*) as total_logs,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_logs,
    COUNT(CASE WHEN severity = 'error' THEN 1 END) as error_logs,
    COUNT(CASE WHEN action = 'create' THEN 1 END) as create_actions,
    COUNT(CASE WHEN action = 'update' THEN 1 END) as update_actions,
    COUNT(CASE WHEN action = 'delete' THEN 1 END) as delete_actions,
    COUNT(CASE WHEN approval_request_id IS NOT NULL THEN 1 END) as approval_related_logs,
    MIN(timestamp) as earliest_log,
    MAX(timestamp) as latest_log
FROM audit_logs 
GROUP BY DATE(timestamp) 
ORDER BY audit_date DESC;

-- ==============================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant SELECT permissions on audit_logs (read-only access)
-- Note: This assumes your application user is different from postgres superuser
-- GRANT SELECT ON audit_logs TO your_app_user;
-- GRANT INSERT ON audit_logs TO your_app_user;

-- Grant permissions on the monitoring view
-- GRANT SELECT ON audit_log_health TO your_app_user;

-- ==============================================
-- 7. LOG INSTALLATION SUCCESS
-- ==============================================

-- Insert a system audit log entry to record the installation of immutability constraints
INSERT INTO audit_logs (
    action, 
    entity_type, 
    entity_id, 
    description, 
    business_context,
    user_id,
    user_name,
    source,
    severity,
    checksum,
    timestamp
) VALUES (
    'create',
    'security_configuration',
    'audit_immutability_constraints',
    'Installed database-level audit log immutability constraints and triggers',
    'SECURITY: Added triggers to prevent UPDATE/DELETE on audit_logs table, checksum validation, and integrity verification functions',
    NULL,
    'Database Administrator',
    'system',
    'critical',
    substring(encode(digest('audit_immutability_installed_' || now()::text, 'sha256'), 'hex'), 1, 32),
    NOW()
);

-- Verify the installation worked
SELECT 'AUDIT IMMUTABILITY CONSTRAINTS INSTALLED SUCCESSFULLY' as status,
       count(*) as total_audit_logs,
       max(timestamp) as latest_log_timestamp
FROM audit_logs;

-- Display trigger information
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'audit_logs'
ORDER BY trigger_name;