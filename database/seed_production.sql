-- CampusFind Production Seed Data
-- Safe lookup data ONLY (Categories & Campus Locations).
-- Does NOT insert any test accounts, demo users, or default admin credentials.
-- Run after database/init_production.sql:
-- psql "$DATABASE_URL" -f database/seed_production.sql

-- ─────────────────────────────────────────────
--  CATEGORIES LOOKUP
-- ─────────────────────────────────────────────
INSERT INTO categories (name, icon) VALUES
  ('Electronics',    '💻'),
  ('Books',          '📚'),
  ('Clothing',       '👕'),
  ('Accessories',    '🎒'),
  ('Keys',           '🔑'),
  ('ID / Cards',     '🪪'),
  ('Sports',         '⚽'),
  ('Stationery',     '✏️'),
  ('Jewelry',        '💍'),
  ('Other',          '📦')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
--  LOCATIONS LOOKUP
-- ─────────────────────────────────────────────
INSERT INTO locations (name, zone) VALUES
  ('Main Library',          'Academic'),
  ('Science Block',         'Academic'),
  ('Arts Block',            'Academic'),
  ('Computer Lab',          'Academic'),
  ('Cafeteria',             'Common'),
  ('Sports Complex',        'Sports'),
  ('Student Union',         'Common'),
  ('Admin Building',        'Admin'),
  ('Parking Lot A',         'Outdoor'),
  ('Parking Lot B',         'Outdoor'),
  ('Hostel Block A',        'Residential'),
  ('Hostel Block B',        'Residential'),
  ('Seminar Hall',          'Academic'),
  ('Medical Center',        'Services'),
  ('Bus Stop',              'Outdoor')
ON CONFLICT (name) DO NOTHING;

