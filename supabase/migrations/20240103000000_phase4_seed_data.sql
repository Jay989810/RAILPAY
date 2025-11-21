-- ============================================================================
-- RailPay Phase 4: Seed Data Migration
-- ============================================================================
-- This migration seeds the database with sample routes and vehicles
-- ============================================================================

-- Add missing columns to vehicles table if they don't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    -- Add vehicle_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'vehicle_name') THEN
      ALTER TABLE vehicles ADD COLUMN vehicle_name text;
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'image_url') THEN
      ALTER TABLE vehicles ADD COLUMN image_url text;
    END IF;
    
    -- Add metadata column if it doesn't exist (for coach data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'metadata') THEN
      ALTER TABLE vehicles ADD COLUMN metadata jsonb;
    END IF;
    
    -- Add active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'active') THEN
      ALTER TABLE vehicles ADD COLUMN active boolean DEFAULT true;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SEED ROUTES (10 routes)
-- ============================================================================

-- Clear existing routes (optional - comment out if you want to keep existing data)
-- DELETE FROM routes;

-- Insert 10 routes
INSERT INTO routes (id, origin, destination, vehicle_type, base_price, estimated_minutes, active) VALUES
  (gen_random_uuid(), 'Kaduna', 'Abuja', 'train', 3500.00, 120, true),
  (gen_random_uuid(), 'Abuja', 'Kaduna', 'train', 3500.00, 120, true),
  (gen_random_uuid(), 'Lagos', 'Ibadan', 'train', 4500.00, 180, true),
  (gen_random_uuid(), 'Ibadan', 'Lagos', 'train', 4500.00, 180, true),
  (gen_random_uuid(), 'Kaduna', 'Kano', 'train', 2800.00, 90, true),
  (gen_random_uuid(), 'Kano', 'Kaduna', 'train', 2800.00, 90, true),
  (gen_random_uuid(), 'Abuja', 'Kaduna Airport', 'train', 2500.00, 60, true),
  (gen_random_uuid(), 'Kaduna Airport', 'Abuja', 'train', 2500.00, 60, true),
  (gen_random_uuid(), 'Lagos', 'Abeokuta', 'train', 3200.00, 150, true),
  (gen_random_uuid(), 'Abeokuta', 'Lagos', 'train', 3200.00, 150, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED VEHICLES (5 trains with coach metadata)
-- ============================================================================

-- Train 1: Zaria Express (ZR-001)
INSERT INTO vehicles (id, vehicle_number, vehicle_name, vehicle_type, capacity, image_url, active, metadata) VALUES
  (
    gen_random_uuid(),
    'ZR-001',
    'Zaria Express',
    'train',
    600,
    'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop',
    true,
    jsonb_build_object(
      'coaches', jsonb_build_array(
        jsonb_build_object('name', 'Coach A', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach B', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach C', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach D', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach E', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach F', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach G', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach H', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach I', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach J', 'seats', 40, 'class', 'first')
      )
    )
  )
ON CONFLICT (vehicle_number) DO UPDATE
SET 
  vehicle_name = EXCLUDED.vehicle_name,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  active = EXCLUDED.active;

-- Train 2: Arewa Flyer (AR-220)
INSERT INTO vehicles (id, vehicle_number, vehicle_name, vehicle_type, capacity, image_url, active, metadata) VALUES
  (
    gen_random_uuid(),
    'AR-220',
    'Arewa Flyer',
    'train',
    600,
    'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop',
    true,
    jsonb_build_object(
      'coaches', jsonb_build_array(
        jsonb_build_object('name', 'Coach A', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach B', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach C', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach D', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach E', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach F', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach G', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach H', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach I', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach J', 'seats', 40, 'class', 'first')
      )
    )
  )
ON CONFLICT (vehicle_number) DO UPDATE
SET 
  vehicle_name = EXCLUDED.vehicle_name,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  active = EXCLUDED.active;

-- Train 3: Eagle Limited (EG-330)
INSERT INTO vehicles (id, vehicle_number, vehicle_name, vehicle_type, capacity, image_url, active, metadata) VALUES
  (
    gen_random_uuid(),
    'EG-330',
    'Eagle Limited',
    'train',
    600,
    'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop',
    true,
    jsonb_build_object(
      'coaches', jsonb_build_array(
        jsonb_build_object('name', 'Coach A', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach B', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach C', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach D', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach E', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach F', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach G', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach H', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach I', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach J', 'seats', 40, 'class', 'first')
      )
    )
  )
ON CONFLICT (vehicle_number) DO UPDATE
SET 
  vehicle_name = EXCLUDED.vehicle_name,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  active = EXCLUDED.active;

-- Train 4: Jabi Coastal Runner (JB-410)
INSERT INTO vehicles (id, vehicle_number, vehicle_name, vehicle_type, capacity, image_url, active, metadata) VALUES
  (
    gen_random_uuid(),
    'JB-410',
    'Jabi Coastal Runner',
    'train',
    600,
    'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop',
    true,
    jsonb_build_object(
      'coaches', jsonb_build_array(
        jsonb_build_object('name', 'Coach A', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach B', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach C', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach D', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach E', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach F', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach G', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach H', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach I', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach J', 'seats', 40, 'class', 'first')
      )
    )
  )
ON CONFLICT (vehicle_number) DO UPDATE
SET 
  vehicle_name = EXCLUDED.vehicle_name,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  active = EXCLUDED.active;

-- Train 5: Unity Metro Express (UM-550)
INSERT INTO vehicles (id, vehicle_number, vehicle_name, vehicle_type, capacity, image_url, active, metadata) VALUES
  (
    gen_random_uuid(),
    'UM-550',
    'Unity Metro Express',
    'train',
    600,
    'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop',
    true,
    jsonb_build_object(
      'coaches', jsonb_build_array(
        jsonb_build_object('name', 'Coach A', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach B', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach C', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach D', 'seats', 80, 'class', 'standard'),
        jsonb_build_object('name', 'Coach E', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach F', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach G', 'seats', 60, 'class', 'business'),
        jsonb_build_object('name', 'Coach H', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach I', 'seats', 40, 'class', 'first'),
        jsonb_build_object('name', 'Coach J', 'seats', 40, 'class', 'first')
      )
    )
  )
ON CONFLICT (vehicle_number) DO UPDATE
SET 
  vehicle_name = EXCLUDED.vehicle_name,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  active = EXCLUDED.active;

