-- ============================================================================
-- RailPay Phase 3: Row Level Security (RLS) Policies
-- ============================================================================
-- This migration creates RLS policies for all tables to ensure proper access control
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (idempotent - safe to run multiple times)
-- ============================================================================

-- Enable RLS on tables (will not error if already enabled)
DO $$ 
BEGIN
  -- Enable RLS on all tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'routes') THEN
    ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passes') THEN
    ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Handle both 'nfc_devices' and 'devices' table names
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nfc_devices') THEN
    ALTER TABLE nfc_devices ENABLE ROW LEVEL SECURITY;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') THEN
    ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
    ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nin_verifications') THEN
    ALTER TABLE nin_verifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- PROFILES POLICIES
-- Users can view and update only their own profile
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies only if profiles table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Users can view their own profile
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    -- Users can update their own profile
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

    -- Users can insert their own profile (during registration)
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================================================
-- ROUTES POLICIES
-- All authenticated users can view active routes
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view active routes" ON routes;

-- Create policy only if routes table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'routes') THEN
    CREATE POLICY "Authenticated users can view active routes"
      ON routes FOR SELECT
      TO authenticated
      USING (active = true);
  END IF;
END $$;

-- Admin/staff can manage routes (enforced via Edge Functions)
-- No direct database policies for INSERT/UPDATE/DELETE

-- ============================================================================
-- VEHICLES POLICIES
-- All authenticated users can view active vehicles
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view active vehicles" ON vehicles;

-- Create policy only if vehicles table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    CREATE POLICY "Authenticated users can view active vehicles"
      ON vehicles FOR SELECT
      TO authenticated
      USING (status = 'active');
  END IF;
END $$;

-- Admin/staff can manage vehicles (enforced via Edge Functions)
-- No direct database policies for INSERT/UPDATE/DELETE

-- ============================================================================
-- TICKETS POLICIES
-- Users can view and insert only their own tickets
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;

-- Create policies only if tickets table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    -- Users can view their own tickets
    CREATE POLICY "Users can view own tickets"
      ON tickets FOR SELECT
      USING (auth.uid() = user_id);

    -- Users can insert their own tickets
    CREATE POLICY "Users can insert own tickets"
      ON tickets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin/staff can view all tickets for validation (enforced via Edge Functions)
-- No direct database policies for UPDATE/DELETE

-- ============================================================================
-- PASSES POLICIES
-- Users can view and insert only their own passes
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own passes" ON passes;
DROP POLICY IF EXISTS "Users can insert own passes" ON passes;

-- Create policies only if passes table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passes') THEN
    -- Users can view their own passes
    CREATE POLICY "Users can view own passes"
      ON passes FOR SELECT
      USING (auth.uid() = user_id);

    -- Users can insert their own passes
    CREATE POLICY "Users can insert own passes"
      ON passes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin/staff can view all passes for validation (enforced via Edge Functions)
-- No direct database policies for UPDATE/DELETE

-- ============================================================================
-- PAYMENTS POLICIES
-- Users can view and insert only their own payments
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

-- Create policies only if payments table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    -- Users can view their own payments
    CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);

    -- Users can insert their own payments
    CREATE POLICY "Users can insert own payments"
      ON payments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin/staff can view all payments (enforced via Edge Functions)
-- No direct database policies for UPDATE/DELETE

-- ============================================================================
-- STAFF POLICIES
-- Restricted access - only via Edge Functions
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can view active staff" ON staff;

-- Create policy only if staff table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    -- All authenticated users can view active staff (for display purposes)
    CREATE POLICY "Authenticated users can view active staff"
      ON staff FOR SELECT
      TO authenticated
      USING (active = true);
  END IF;
END $$;

-- Admin/staff management restricted to Edge Functions
-- No direct database policies for INSERT/UPDATE/DELETE

-- ============================================================================
-- NFC_DEVICES/DEVICES POLICIES
-- Restricted access - only via Edge Functions
-- Handle both table name variations
-- ============================================================================

-- Drop existing policies on both table name variations
DO $$ 
BEGIN
  -- Drop policy on nfc_devices if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nfc_devices') THEN
    DROP POLICY IF EXISTS "Authenticated users can view devices" ON nfc_devices;
    DROP POLICY IF EXISTS "Authenticated users can view active devices" ON nfc_devices;
  END IF;
  
  -- Drop policy on devices if it exists (old table name)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') THEN
    DROP POLICY IF EXISTS "Authenticated users can view devices" ON devices;
    DROP POLICY IF EXISTS "Authenticated users can view active devices" ON devices;
  END IF;
END $$;

-- Create policy on nfc_devices if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nfc_devices') THEN
    CREATE POLICY "Authenticated users can view active devices"
      ON nfc_devices FOR SELECT
      TO authenticated
      USING (status = 'active');
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') THEN
    -- Create policy on old 'devices' table name
    CREATE POLICY "Authenticated users can view active devices"
      ON devices FOR SELECT
      TO authenticated
      USING (status = 'active');
  END IF;
END $$;

-- Device management restricted to Edge Functions
-- No direct database policies for INSERT/UPDATE/DELETE

-- ============================================================================
-- ADMIN_LOGS POLICIES
-- Restricted access - only via Edge Functions
-- ============================================================================

-- No public access to admin logs
-- All access restricted to Edge Functions with admin authentication

-- ============================================================================
-- NIN_VERIFICATIONS POLICIES
-- Users can view only their own verification records
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own NIN verifications" ON nin_verifications;

-- Create policy only if nin_verifications table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nin_verifications') THEN
    -- Users can view their own NIN verification records
    CREATE POLICY "Users can view own NIN verifications"
      ON nin_verifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- NIN verification insertion handled by Edge Functions
-- No direct database policies for INSERT/UPDATE/DELETE

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Admin and staff operations are enforced via Edge Functions with proper
--    authentication and authorization checks
-- 2. Direct database access for admin operations is intentionally restricted
-- 3. All sensitive operations should go through Edge Functions
-- 4. Service role key is used in Edge Functions to bypass RLS when needed

