-- Subcategories and Sublocations Migration
-- Safe non-destructive update

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

-- Add columns to items table if they do not exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory_id INT REFERENCES subcategories(id) ON DELETE SET NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sublocation_id INT REFERENCES sublocations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_items_subcat ON items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_items_subloc ON items(sublocation_id);

-- Seed realistic subcategories
-- Electronics (id: 1)
INSERT INTO subcategories (category_id, name) VALUES
  (1, 'Smartphones & Mobile'),
  (1, 'Laptops & MacBooks'),
  (1, 'Headphones & Earbuds'),
  (1, 'Smartwatches & Fitness Trackers'),
  (1, 'Chargers, Cables & Adapters'),
  (1, 'Tablets & iPads')
ON CONFLICT (category_id, name) DO NOTHING;

-- Books (id: 2)
INSERT INTO subcategories (category_id, name) VALUES
  (2, 'Course Textbooks'),
  (2, 'Notebooks & Registers'),
  (2, 'Novels & Fiction'),
  (2, 'Lab Manuals & Project Reports')
ON CONFLICT (category_id, name) DO NOTHING;

-- Clothing (id: 3)
INSERT INTO subcategories (category_id, name) VALUES
  (3, 'Jackets, Hoodies & Sweaters'),
  (3, 'Caps, Hats & Beanies'),
  (3, 'Scarves & Shawls'),
  (3, 'Lab Coats')
ON CONFLICT (category_id, name) DO NOTHING;

-- Accessories (id: 4)
INSERT INTO subcategories (category_id, name) VALUES
  (4, 'Backpacks & Laptop Bags'),
  (4, 'Wallets & Purses'),
  (4, 'Eyeglasses & Sunglasses'),
  (4, 'Umbrellas')
ON CONFLICT (category_id, name) DO NOTHING;

-- Keys (id: 5)
INSERT INTO subcategories (category_id, name) VALUES
  (5, 'Room / Hostel Keys'),
  (5, 'Vehicle / Bike Keys'),
  (5, 'Locker / Padlock Keys')
ON CONFLICT (category_id, name) DO NOTHING;

-- ID / Cards (id: 6)
INSERT INTO subcategories (category_id, name) VALUES
  (6, 'Student ID Card'),
  (6, 'Debit / Credit Card'),
  (6, 'Driver License / Govt ID'),
  (6, 'Transit / Metro Card')
ON CONFLICT (category_id, name) DO NOTHING;

-- Sports (id: 7)
INSERT INTO subcategories (category_id, name) VALUES
  (7, 'Badminton & Tennis Racquets'),
  (7, 'Sports Shoes & Gear'),
  (7, 'Water Bottles & Shakers')
ON CONFLICT (category_id, name) DO NOTHING;

-- Stationery (id: 8)
INSERT INTO subcategories (category_id, name) VALUES
  (8, 'Scientific Calculators'),
  (8, 'Pencil Cases & Pouches'),
  (8, 'Geometry & Drafting Sets')
ON CONFLICT (category_id, name) DO NOTHING;

-- Jewelry (id: 9)
INSERT INTO subcategories (category_id, name) VALUES
  (9, 'Rings & Bands'),
  (9, 'Bracelets & Bangles'),
  (9, 'Chains & Necklaces')
ON CONFLICT (category_id, name) DO NOTHING;

-- Other (id: 10)
INSERT INTO subcategories (category_id, name) VALUES
  (10, 'General Item'),
  (10, 'Cosmetics & Personal Care')
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed realistic sublocations
-- Main Library (id: 1)
INSERT INTO sublocations (location_id, name) VALUES
  (1, 'Ground Floor / Issue Counter'),
  (1, '1st Floor Reading Hall'),
  (1, '2nd Floor Reference Section'),
  (1, 'Digital Library / Computers'),
  (1, 'Discussion Rooms')
ON CONFLICT (location_id, name) DO NOTHING;

-- Science Block (id: 2)
INSERT INTO sublocations (location_id, name) VALUES
  (2, 'Physics Lab'),
  (2, 'Chemistry Lab'),
  (2, 'Lecture Hall 101-105'),
  (2, 'Block Lobby')
ON CONFLICT (location_id, name) DO NOTHING;

-- Arts Block (id: 3)
INSERT INTO sublocations (location_id, name) VALUES
  (3, 'Ground Floor Corridor'),
  (3, 'Language Lab'),
  (3, 'Lecture Hall 201-204')
ON CONFLICT (location_id, name) DO NOTHING;

-- Computer Lab (id: 4)
INSERT INTO sublocations (location_id, name) VALUES
  (4, 'Lab 1 (CS/IT)'),
  (4, 'Lab 2 (Programming)'),
  (4, 'Hardware Lab'),
  (4, 'Server Room Entrance')
ON CONFLICT (location_id, name) DO NOTHING;

-- Cafeteria (id: 5)
INSERT INTO sublocations (location_id, name) VALUES
  (5, 'Main Dining Area'),
  (5, 'Juice & Coffee Counter'),
  (5, 'Outdoor Seating Patio'),
  (5, 'Tray Return Area')
ON CONFLICT (location_id, name) DO NOTHING;

-- Sports Complex (id: 6)
INSERT INTO sublocations (location_id, name) VALUES
  (6, 'Badminton Court'),
  (6, 'Gymnasium'),
  (6, 'Table Tennis Room'),
  (6, 'Locker Room')
ON CONFLICT (location_id, name) DO NOTHING;

-- Student Union (id: 7)
INSERT INTO sublocations (location_id, name) VALUES
  (7, 'Activity Hall'),
  (7, 'Club Offices'),
  (7, 'Student Lounge')
ON CONFLICT (location_id, name) DO NOTHING;

-- Admin Building (id: 8)
INSERT INTO sublocations (location_id, name) VALUES
  (8, 'Accounts / Fee Counter'),
  (8, 'Registrar Office Corridor'),
  (8, 'Security / Lost & Found Desk')
ON CONFLICT (location_id, name) DO NOTHING;

-- Parking Lot A (id: 9)
INSERT INTO sublocations (location_id, name) VALUES
  (9, 'Two-Wheeler Section'),
  (9, 'Four-Wheeler Section')
ON CONFLICT (location_id, name) DO NOTHING;

-- Parking Lot B (id: 10)
INSERT INTO sublocations (location_id, name) VALUES
  (10, 'Staff Parking Area'),
  (10, 'Visitor Parking Area')
ON CONFLICT (location_id, name) DO NOTHING;

-- Hostel Block A (id: 11)
INSERT INTO sublocations (location_id, name) VALUES
  (11, 'Common Room'),
  (11, 'Mess / Dining Hall'),
  (11, 'Block Entrance / Reception')
ON CONFLICT (location_id, name) DO NOTHING;

-- Hostel Block B (id: 12)
INSERT INTO sublocations (location_id, name) VALUES
  (12, 'Common Room'),
  (12, 'Mess / Dining Hall'),
  (12, 'Block Entrance / Reception')
ON CONFLICT (location_id, name) DO NOTHING;

-- Seminar Hall (id: 13)
INSERT INTO sublocations (location_id, name) VALUES
  (13, 'Main Stage Area'),
  (13, 'Auditorium Seating'),
  (13, 'Foyer / Entry Lobby')
ON CONFLICT (location_id, name) DO NOTHING;

-- Medical Center (id: 14)
INSERT INTO sublocations (location_id, name) VALUES
  (14, 'Waiting Lounge'),
  (14, 'Doctor Consultation Room'),
  (14, 'Pharmacy Counter')
ON CONFLICT (location_id, name) DO NOTHING;

-- Bus Stop (id: 15)
INSERT INTO sublocations (location_id, name) VALUES
  (15, 'Campus Main Gate Shelter'),
  (15, 'North Gate Pick-up Point')
ON CONFLICT (location_id, name) DO NOTHING;
