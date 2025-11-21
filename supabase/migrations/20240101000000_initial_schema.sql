-- RailPay Database Schema
-- This migration creates all tables, indexes, and RLS policies for the RailPay application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extends auth.users with additional user profile information
-- ============================================================================
CREATE TABLE profiles (
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

-- Create index on NIN for faster lookups
CREATE INDEX idx_profiles_nin ON profiles(nin) WHERE nin IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- ============================================================================
-- ROUTES TABLE
-- Stores available train routes with pricing information
-- ============================================================================
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  vehicle_type text NOT NULL,
  base_price numeric(12,2) NOT NULL,
  estimated_minutes integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create index on active routes for faster queries
CREATE INDEX idx_routes_active ON routes(active) WHERE active = true;
CREATE INDEX idx_routes_origin_destination ON routes(origin, destination);

-- ============================================================================
-- TICKETS TABLE
-- Stores individual tickets purchased by users
-- ============================================================================
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  route_id uuid REFERENCES routes(id),
  seat_number text,
  ticket_type text,
  qr_payload text UNIQUE,
  status text DEFAULT 'valid',
  blockchain_tx_hash text,
  purchased_at timestamptz DEFAULT now(),
  validated_at timestamptz
);

-- Create indexes for faster lookups
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_route_id ON tickets(route_id);
CREATE INDEX idx_tickets_qr_payload ON tickets(qr_payload) WHERE qr_payload IS NOT NULL;
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================================================
-- PASSES TABLE
-- Stores travel passes (e.g., monthly passes) purchased by users
-- ============================================================================
CREATE TABLE passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  pass_type text,
  starts_at timestamptz,
  expires_at timestamptz,
  blockchain_tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_passes_user_id ON passes(user_id);
CREATE INDEX idx_passes_expires_at ON passes(expires_at);

-- ============================================================================
-- PAYMENTS TABLE
-- Stores payment records for tickets and passes
-- ============================================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  pass_id uuid REFERENCES passes(id) ON DELETE SET NULL,
  amount numeric(12,2),
  currency text DEFAULT 'ETH',
  status text DEFAULT 'pending',
  blockchain_tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_ticket_id ON payments(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_payments_pass_id ON payments(pass_id) WHERE pass_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- STAFF TABLE
-- Stores staff member information
-- ============================================================================
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text UNIQUE,
  role text,
  station_name text,
  created_at timestamptz DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX idx_staff_email ON staff(email);

-- ============================================================================
-- DEVICES TABLE
-- Stores validation device information
-- ============================================================================
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  station_name text,
  status text DEFAULT 'active',
  last_online timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index on device_id for faster lookups
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_status ON devices(status);

-- ============================================================================
-- NIN_VERIFICATIONS TABLE
-- Stores NIN verification requests and responses for audit trail
-- ============================================================================
CREATE TABLE nin_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nin text,
  request_payload jsonb,
  response_payload jsonb,
  success boolean,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_nin_verifications_user_id ON nin_verifications(user_id);
CREATE INDEX idx_nin_verifications_success ON nin_verifications(success);

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

-- Trigger to automatically update updated_at on profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tickets: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Passes: Users can view their own passes
CREATE POLICY "Users can view own passes"
  ON passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passes"
  ON passes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Routes, Staff, Devices, and NIN_verifications are accessible to all authenticated users
-- (You may want to add more restrictive policies based on your requirements)
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nin_verifications ENABLE ROW LEVEL SECURITY;

-- Routes: All authenticated users can view active routes
CREATE POLICY "Authenticated users can view active routes"
  ON routes FOR SELECT
  TO authenticated
  USING (active = true);

-- Staff: All authenticated users can view staff (adjust based on your needs)
CREATE POLICY "Authenticated users can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

-- Devices: All authenticated users can view devices (adjust based on your needs)
CREATE POLICY "Authenticated users can view devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

-- NIN Verifications: Users can only view their own verification records
CREATE POLICY "Users can view own NIN verifications"
  ON nin_verifications FOR SELECT
  USING (auth.uid() = user_id);

