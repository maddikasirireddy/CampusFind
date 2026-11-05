-- CampusFind Seed Data
-- Run AFTER schema.sql

-- Categories
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

-- Locations
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

-- Admin user  (password: Admin@123)
INSERT INTO users (name, email, password, student_id, phone, role) VALUES (
  'Admin User',
  'admin@campusfind.edu',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lptr',
  'ADMIN001',
  '9000000000',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Sample students  (password: Test@123)
INSERT INTO users (name, email, password, student_id, phone, role) VALUES
  ('Aarav Sharma',  'aarav@campus.edu',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'CS2021001', '9111111111', 'student'),
  ('Priya Patel',   'priya@campus.edu',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'CS2021002', '9222222222', 'student'),
  ('Rohan Mehta',   'rohan@campus.edu',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'CS2021003', '9333333333', 'student')
ON CONFLICT (email) DO NOTHING;

-- Sample items
INSERT INTO items (user_id, type, title, description, category_id, location_id, date_occurred, color, brand, tags) VALUES
  (2, 'lost',  'Black Laptop Bag',
   'Lost a black laptop bag with a Dell laptop inside near the library entrance. Has a blue keychain.',
   4, 1, CURRENT_DATE - 2, 'Black', 'Wildcraft', 'laptop,bag,black,wildcraft'),
  (3, 'found', 'Dell Laptop in Black Bag',
   'Found a black backpack with Dell laptop near main library steps. Laptop has stickers on the lid.',
   4, 1, CURRENT_DATE - 2, 'Black', 'Dell', 'laptop,dell,black,bag'),
  (2, 'lost',  'Silver iPhone 14',
   'Lost silver iPhone 14 with a clear case. Has a crack on the bottom-left corner.',
   1, 5, CURRENT_DATE - 1, 'Silver', 'Apple', 'iphone,phone,silver,apple'),
  (4, 'found', 'Student ID Card',
   'Found a student ID card near the cafeteria. Name on card appears to be Aarav.',
   6, 5, CURRENT_DATE - 1, NULL, NULL, 'id,card,student'),
  (3, 'lost',  'Blue Water Bottle',
   'Lost a blue Nalgene water bottle with stickers from science block area.',
   10, 2, CURRENT_DATE,    'Blue', 'Nalgene', 'bottle,water,blue,nalgene')
ON CONFLICT DO NOTHING;

