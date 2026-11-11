-- Migration: Add subcategories and sublocations tables and link them to items

CREATE TABLE IF NOT EXISTS subcategories (
  id          SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        VARCHAR(80) NOT NULL,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS sublocations (
  id          SERIAL PRIMARY KEY,
  location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  UNIQUE(location_id, name)
);

-- Add nullable foreign keys to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory_id INT REFERENCES subcategories(id) ON DELETE SET NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sublocation_id INT REFERENCES sublocations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_items_subcat ON items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_items_subloc ON items(sublocation_id);

-- Seed realistic subcategories
INSERT INTO subcategories (category_id, name)
SELECT c.id, s.name
FROM categories c
CROSS JOIN (VALUES
  ('Electronics', 'Smartphones / Mobile Phones'),
  ('Electronics', 'Laptops & MacBooks'),
  ('Electronics', 'Headphones & Earbuds'),
  ('Electronics', 'Smartwatches & Fitness Bands'),
  ('Electronics', 'Chargers & Cables'),
  ('Electronics', 'Tablets & iPads'),
  ('Books', 'Textbooks'),
  ('Books', 'Notebooks & Spiral Pads'),
  ('Books', 'Novels & Fiction'),
  ('Clothing', 'Jackets & Hoodies'),
  ('Clothing', 'Caps & Hats'),
  ('Clothing', 'Scarves & Gloves'),
  ('Accessories', 'Backpacks'),
  ('Accessories', 'Wallets & Purses'),
  ('Accessories', 'Umbrellas'),
  ('Accessories', 'Sunglasses / Eyeglasses'),
  ('Keys', 'Bike / Scooter Keys'),
  ('Keys', 'Car Keys'),
  ('Keys', 'Hostel Room Keys'),
  ('ID / Cards', 'Student ID Card'),
  ('ID / Cards', 'Driver License'),
  ('ID / Cards', 'ATM / Debit Card'),
  ('Sports', 'Basketball / Football'),
  ('Sports', 'Badminton Racket'),
  ('Sports', 'Gym Gear / Gloves'),
  ('Stationery', 'Calculator (Scientific)'),
  ('Stationery', 'Pencil Pouch'),
  ('Jewelry', 'Watches (Analog)'),
  ('Jewelry', 'Rings & Chains'),
  ('Other', 'Water Bottles'),
  ('Other', 'Lunch Boxes')
) AS s(category_name, name)
WHERE c.name = s.category_name
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed realistic sublocations
INSERT INTO sublocations (location_id, name)
SELECT l.id, s.name
FROM locations l
CROSS JOIN (VALUES
  ('Main Library', '1st Floor Reading Room'),
  ('Main Library', '2nd Floor Reference Section'),
  ('Main Library', 'Circulation Counter'),
  ('Science Block', 'Physics Lab (Room 102)'),
  ('Science Block', 'Chemistry Lab (Room 205)'),
  ('Science Block', 'Ground Floor Corridor'),
  ('Computer Lab', 'Lab 1 (Systems Lab)'),
  ('Computer Lab', 'Lab 2 (Programming Lab)'),
  ('Cafeteria', 'Food Counter'),
  ('Cafeteria', 'Central Seating Area'),
  ('Cafeteria', 'Outdoor Patio'),
  ('Sports Complex', 'Indoor Badminton Court'),
  ('Sports Complex', 'Gymnasium'),
  ('Sports Complex', 'Grounds & Bleachers'),
  ('Student Union', 'Lounge Area'),
  ('Student Union', 'Club Office'),
  ('Admin Building', 'Registrar Window'),
  ('Admin Building', 'Dean Office Lobby'),
  ('Parking Lot A', 'Two-Wheeler Section'),
  ('Parking Lot A', 'Car Section'),
  ('Hostel Block A', 'Common Room'),
  ('Hostel Block A', 'Mess Dining Hall'),
  ('Hostel Block B', 'Common Room'),
  ('Hostel Block B', 'Entrance Lobby')
) AS s(loc_name, name)
WHERE l.name = s.loc_name
ON CONFLICT (location_id, name) DO NOTHING;
