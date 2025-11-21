-- ============================================================================
-- RailPay Phase 3: Complete Database Schema Migration
-- ============================================================================
-- This migration creates all required tables for Phase 3 of RailPay
-- Includes: profiles, routes, vehicles, tickets, passes, payments, staff, nfc_devices, admin_logs
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extends auth.users with additional user profile information
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  nin text,
  nin_verified boolean DEFAULT false,
  nin_verified_at timestamptz,
  dob date,
  gender text,
  address text,
  photo_url text,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing profiles table (if table already exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Add wallet_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wallet_address') THEN
      ALTER TABLE profiles ADD COLUMN wallet_address text;
    END IF;
  END IF;
END $$;

-- Create indexes on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_nin ON profiles(nin) WHERE nin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Create wallet_address index only if column exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wallet_address') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address) WHERE wallet_address IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- ROUTES TABLE
-- Stores available train routes with pricing information
-- ============================================================================
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  vehicle_type text NOT NULL,
  base_price numeric(12,2) NOT NULL,
  estimated_minutes integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing routes table (if table already exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'routes') THEN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'routes' AND column_name = 'updated_at') THEN
      ALTER TABLE routes ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END $$;

-- Create indexes on routes
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_routes_origin_destination ON routes(origin, destination);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_type ON routes(vehicle_type);

-- ============================================================================
-- VEHICLES TABLE
-- Stores vehicle information (trains, coaches, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text UNIQUE NOT NULL,
  vehicle_type text NOT NULL,
  capacity integer,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  last_maintenance_date date,
  next_maintenance_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes on vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_route_id ON vehicles(route_id) WHERE route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);

-- ============================================================================
-- TICKETS TABLE
-- Stores individual tickets purchased by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  route_id uuid REFERENCES routes(id),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  seat_number text,
  ticket_type text NOT NULL,
  qr_payload text UNIQUE,
  status text DEFAULT 'valid',
  blockchain_tx_hash text,
  blockchain_token_id bigint,
  purchased_at timestamptz DEFAULT now(),
  validated_at timestamptz,
  travel_date date,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing tickets table (if table already exists)
DO $$ 
BEGIN
  -- Add vehicle_id column if it doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'vehicle_id') THEN
      ALTER TABLE tickets ADD COLUMN vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;
    END IF;
    
    -- Add blockchain_token_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'blockchain_token_id') THEN
      ALTER TABLE tickets ADD COLUMN blockchain_token_id bigint;
    END IF;
    
    -- Add travel_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'travel_date') THEN
      ALTER TABLE tickets ADD COLUMN travel_date date;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'created_at') THEN
      ALTER TABLE tickets ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    
    -- Make ticket_type NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'ticket_type' AND is_nullable = 'YES') THEN
      ALTER TABLE tickets ALTER COLUMN ticket_type SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes on tickets (only if columns exist)
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route_id ON tickets(route_id);

-- Create indexes on new columns only if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_tickets_vehicle_id ON tickets(vehicle_id) WHERE vehicle_id IS NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'blockchain_token_id') THEN
    CREATE INDEX IF NOT EXISTS idx_tickets_blockchain_token_id ON tickets(blockchain_token_id) WHERE blockchain_token_id IS NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'travel_date') THEN
    CREATE INDEX IF NOT EXISTS idx_tickets_travel_date ON tickets(travel_date) WHERE travel_date IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_qr_payload ON tickets(qr_payload) WHERE qr_payload IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ============================================================================
-- PASSES TABLE
-- Stores travel passes (e.g., monthly passes) purchased by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  pass_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  blockchain_tx_hash text,
  blockchain_pass_id bigint,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing passes table (if table already exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passes') THEN
    -- Add blockchain_pass_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'blockchain_pass_id') THEN
      ALTER TABLE passes ADD COLUMN blockchain_pass_id bigint;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'status') THEN
      ALTER TABLE passes ADD COLUMN status text DEFAULT 'active';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'updated_at') THEN
      ALTER TABLE passes ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    
    -- Make pass_type NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'pass_type' AND is_nullable = 'YES') THEN
      ALTER TABLE passes ALTER COLUMN pass_type SET NOT NULL;
    END IF;
    
    -- Make starts_at NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'starts_at' AND is_nullable = 'YES') THEN
      ALTER TABLE passes ALTER COLUMN starts_at SET NOT NULL;
    END IF;
    
    -- Make expires_at NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'expires_at' AND is_nullable = 'YES') THEN
      ALTER TABLE passes ALTER COLUMN expires_at SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes on passes
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_expires_at ON passes(expires_at);

-- Create indexes on new columns only if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_passes_status ON passes(status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'pass_type') THEN
    CREATE INDEX IF NOT EXISTS idx_passes_pass_type ON passes(pass_type);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'blockchain_pass_id') THEN
    CREATE INDEX IF NOT EXISTS idx_passes_blockchain_pass_id ON passes(blockchain_pass_id) WHERE blockchain_pass_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- PAYMENTS TABLE
-- Stores payment records for tickets and passes
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  pass_id uuid REFERENCES passes(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'ETH',
  payment_method text,
  status text DEFAULT 'pending',
  blockchain_tx_hash text,
  blockchain_receipt_id bigint,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing payments table (if table already exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_method') THEN
      ALTER TABLE payments ADD COLUMN payment_method text;
    END IF;
    
    -- Add blockchain_receipt_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'blockchain_receipt_id') THEN
      ALTER TABLE payments ADD COLUMN blockchain_receipt_id bigint;
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'metadata') THEN
      ALTER TABLE payments ADD COLUMN metadata jsonb;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'updated_at') THEN
      ALTER TABLE payments ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    
    -- Make amount NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount' AND is_nullable = 'YES') THEN
      ALTER TABLE payments ALTER COLUMN amount SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes on payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket_id ON payments(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_pass_id ON payments(pass_id) WHERE pass_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create indexes on new columns only if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'blockchain_tx_hash') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_blockchain_tx_hash ON payments(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'blockchain_receipt_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_blockchain_receipt_id ON payments(blockchain_receipt_id) WHERE blockchain_receipt_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STAFF TABLE
-- Stores staff member information
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  station_name text,
  department text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing staff table (if table already exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'user_id') THEN
      ALTER TABLE staff ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'department') THEN
      ALTER TABLE staff ADD COLUMN department text;
    END IF;
    
    -- Add active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'active') THEN
      ALTER TABLE staff ADD COLUMN active boolean DEFAULT true;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'updated_at') THEN
      ALTER TABLE staff ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    
    -- Make full_name NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'full_name' AND is_nullable = 'YES') THEN
      ALTER TABLE staff ALTER COLUMN full_name SET NOT NULL;
    END IF;
    
    -- Make email NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'email' AND is_nullable = 'YES') THEN
      ALTER TABLE staff ALTER COLUMN email SET NOT NULL;
    END IF;
    
    -- Make role NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role' AND is_nullable = 'YES') THEN
      ALTER TABLE staff ALTER COLUMN role SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes on staff
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_staff_station_name ON staff(station_name) WHERE station_name IS NOT NULL;

-- ============================================================================
-- NFC_DEVICES TABLE
-- Stores NFC device information for ticket validation
-- ============================================================================
CREATE TABLE IF NOT EXISTS nfc_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  device_name text,
  station_name text,
  location text,
  status text DEFAULT 'active',
  last_online timestamptz,
  last_sync timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes on nfc_devices
CREATE INDEX IF NOT EXISTS idx_nfc_devices_device_id ON nfc_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_status ON nfc_devices(status);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_station_name ON nfc_devices(station_name) WHERE station_name IS NOT NULL;

-- ============================================================================
-- ADMIN_LOGS TABLE
-- Stores administrative action logs for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  description text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes on admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_type ON admin_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_id ON admin_logs(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ============================================================================
-- NIN_VERIFICATIONS TABLE (if not exists)
-- Stores NIN verification requests and responses for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS nin_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nin text,
  request_payload jsonb,
  response_payload jsonb,
  success boolean,
  created_at timestamptz DEFAULT now()
);

-- Create indexes on nin_verifications
CREATE INDEX IF NOT EXISTS idx_nin_verifications_user_id ON nin_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_nin_verifications_success ON nin_verifications(success);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at on relevant tables
-- Only create triggers if the table and updated_at column exist

DO $$ 
BEGIN
  -- Profiles trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Routes trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'routes' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;
    CREATE TRIGGER update_routes_updated_at
      BEFORE UPDATE ON routes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Vehicles trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
    CREATE TRIGGER update_vehicles_updated_at
      BEFORE UPDATE ON vehicles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Passes trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'passes' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_passes_updated_at ON passes;
    CREATE TRIGGER update_passes_updated_at
      BEFORE UPDATE ON passes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Payments trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Staff trigger
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
    CREATE TRIGGER update_staff_updated_at
      BEFORE UPDATE ON staff
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- NFC Devices trigger (handle both table name variations)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nfc_devices' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_nfc_devices_updated_at ON nfc_devices;
    CREATE TRIGGER update_nfc_devices_updated_at
      BEFORE UPDATE ON nfc_devices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
    CREATE TRIGGER update_devices_updated_at
      BEFORE UPDATE ON devices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users with additional information';
COMMENT ON TABLE routes IS 'Available train routes with pricing';
COMMENT ON TABLE vehicles IS 'Vehicle information (trains, coaches)';
COMMENT ON TABLE tickets IS 'Individual tickets purchased by users';
COMMENT ON TABLE passes IS 'Travel passes (daily, weekly, monthly)';
COMMENT ON TABLE payments IS 'Payment records for tickets and passes';
COMMENT ON TABLE staff IS 'Staff member information';
COMMENT ON TABLE nfc_devices IS 'NFC device information for ticket validation';
COMMENT ON TABLE admin_logs IS 'Administrative action logs for audit trail';

