BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendor', 'customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vendor profiles
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  farm_name VARCHAR(200) NOT NULL,
  certification_status TEXT NOT NULL DEFAULT 'pending' CHECK (certification_status IN ('pending', 'approved', 'rejected', 'expired')),
  farm_location TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  bio TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_cert_status ON vendor_profiles(certification_status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_location ON vendor_profiles(farm_location);

CREATE TRIGGER trg_vendor_profiles_updated_at
BEFORE UPDATE ON vendor_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sustainability certificates
CREATE TABLE IF NOT EXISTS sustainability_certs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  certifying_agency VARCHAR(255) NOT NULL,
  certification_date DATE NOT NULL,
  expiry_date DATE,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_certs_vendor_id ON sustainability_certs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_certs_status ON sustainability_certs(status);

CREATE TRIGGER trg_sustainability_certs_updated_at
BEFORE UPDATE ON sustainability_certs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Produce / marketplace items
CREATE TABLE IF NOT EXISTS produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  category TEXT NOT NULL CHECK (category IN ('seeds', 'tools', 'organic_products', 'fresh_produce', 'other')),
  certification_status TEXT NOT NULL DEFAULT 'pending' CHECK (certification_status IN ('pending', 'approved', 'rejected', 'expired')),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produce_vendor_id ON produce(vendor_id);
CREATE INDEX IF NOT EXISTS idx_produce_category ON produce(category);
CREATE INDEX IF NOT EXISTS idx_produce_cert_status ON produce(certification_status);
CREATE INDEX IF NOT EXISTS idx_produce_active ON produce(is_active);

CREATE TRIGGER trg_produce_updated_at
BEFORE UPDATE ON produce
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Rental spaces
CREATE TABLE IF NOT EXISTS rental_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  size NUMERIC(10,2) NOT NULL CHECK (size > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_spaces_vendor_id ON rental_spaces(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rental_spaces_availability ON rental_spaces(availability);
CREATE INDEX IF NOT EXISTS idx_rental_spaces_location ON rental_spaces(location);

CREATE TRIGGER trg_rental_spaces_updated_at
BEFORE UPDATE ON rental_spaces
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Booking layer for space rentals
CREATE TABLE IF NOT EXISTS rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_space_id UUID NOT NULL REFERENCES rental_spaces(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_rental_bookings_space_id ON rental_bookings(rental_space_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_customer_id ON rental_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON rental_bookings(status);

-- Prevent overlapping bookings for the same space when active/pending/approved
ALTER TABLE rental_bookings
ADD CONSTRAINT rental_bookings_no_overlap
EXCLUDE USING gist (
  rental_space_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
)
WHERE (status IN ('pending', 'approved', 'active'));

CREATE TRIGGER trg_rental_bookings_updated_at
BEFORE UPDATE ON rental_bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  produce_id UUID NOT NULL REFERENCES produce(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  post_content TEXT NOT NULL,
  post_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_date ON community_posts(post_date DESC);

CREATE TRIGGER trg_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Plant tracking
CREATE TABLE IF NOT EXISTS plant_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,
  rental_booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
  plant_name VARCHAR(200) NOT NULL,
  species VARCHAR(200),
  planted_at DATE,
  expected_harvest_date DATE,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'harvest_ready')),
  growth_stage TEXT NOT NULL DEFAULT 'seedling' CHECK (growth_stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'harvested')),
  current_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plant_tracks_user_id ON plant_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_tracks_vendor_id ON plant_tracks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_plant_tracks_health_status ON plant_tracks(health_status);

CREATE TRIGGER trg_plant_tracks_updated_at
BEFORE UPDATE ON plant_tracks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS plant_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_track_id UUID NOT NULL REFERENCES plant_tracks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plant_tracking_events_track_id ON plant_tracking_events(plant_track_id);
CREATE INDEX IF NOT EXISTS idx_plant_tracking_events_created_at ON plant_tracking_events(created_at DESC);

COMMIT;