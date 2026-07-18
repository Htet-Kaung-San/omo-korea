-- Enrich facility table for map / building detail UI
ALTER TABLE facility
  ADD COLUMN IF NOT EXISTS subtitle VARCHAR(150),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Update existing facilities
UPDATE facility SET
  subtitle = 'Study rooms, Books',
  phone = '051-510-1800',
  website = 'https://lib.pusan.ac.kr',
  image_url = 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80',
  departments = '[
    {"name": "General Reading Rooms", "floor": "1F"},
    {"name": "Book Stacks & Reference", "floor": "2F"},
    {"name": "Silent Study Desks", "floor": "3F"}
  ]'::jsonb,
  amenities = '[
    {"name": "Study Rooms", "floor": "1F-3F"},
    {"name": "Computers", "floor": "3F"},
    {"name": "Copy Center", "floor": "1F"}
  ]'::jsonb
WHERE name LIKE '%Main Library%';

UPDATE facility SET
  subtitle = 'Food & Drinks',
  phone = '051-510-1200',
  website = 'https://www.pusan.ac.kr',
  image_url = 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80',
  departments = '[
    {"name": "Student Cafeteria", "floor": "1F"},
    {"name": "Convenience Store & Cafe", "floor": "2F"}
  ]'::jsonb,
  amenities = '[
    {"name": "Korean Set Meals", "floor": "1F"},
    {"name": "Seating Lounge", "floor": "1F"}
  ]'::jsonb
WHERE name LIKE '%Geumjeong%';

UPDATE facility SET
  subtitle = 'Food & Drinks',
  phone = '051-510-1210',
  website = 'https://www.pusan.ac.kr',
  image_url = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
  departments = '[
    {"name": "International Buffet", "floor": "1F"},
    {"name": "Student Lounge", "floor": "2F"}
  ]'::jsonb,
  amenities = '[
    {"name": "Western Corner", "floor": "1F"},
    {"name": "Copy Center", "floor": "2F"}
  ]'::jsonb
WHERE name LIKE '%Moonchang%';

UPDATE facility SET
  subtitle = 'Admin & Student Services',
  phone = '051-510-1000',
  website = 'https://www.pusan.ac.kr',
  image_url = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  departments = '[
    {"name": "Student Service Center", "floor": "1F"},
    {"name": "Office of International Affairs", "floor": "2F"},
    {"name": "President''s Office", "floor": "3F"}
  ]'::jsonb,
  amenities = '[
    {"name": "Visa & ARC Desk", "floor": "2F"},
    {"name": "Information Desk", "floor": "1F"}
  ]'::jsonb
WHERE name LIKE '%Headquarters%';

UPDATE facility SET
  subtitle = 'International Housing',
  phone = '051-510-3500',
  website = 'https://dorm.pusan.ac.kr',
  image_url = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
  departments = '[
    {"name": "Lobby & Security", "floor": "1F"},
    {"name": "Student Rooms", "floor": "2F-8F"}
  ]'::jsonb,
  amenities = '[
    {"name": "Gym", "floor": "B1"},
    {"name": "Laundry", "floor": "B1"},
    {"name": "Kitchen", "floor": "B1"}
  ]'::jsonb
WHERE name LIKE '%Woongbee%';

-- Demo buildings matching map mockup
INSERT INTO facility (
  name, type, latitude, longitude, hours, details, floors,
  subtitle, phone, website, image_url, departments, amenities
) VALUES
(
  'Engineering Building 3',
  'Academic',
  35.2330, 129.0805,
  '08:00 AM - 10:00 PM',
  'Home of Computer Science and multimedia labs.',
  '2F: Seminar Room; 3F: CS Dept & Labs',
  'Computer Science Dept.',
  '051-510-2200',
  'https://cse.pusan.ac.kr',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
  '[
    {"name": "Computer Science Department", "floor": "3F"},
    {"name": "Multimedia Lab", "floor": "3F"},
    {"name": "Lecture Rooms 301-308", "floor": "3F"},
    {"name": "Seminar Room", "floor": "2F"}
  ]'::jsonb,
  '[
    {"name": "Computer Labs", "floor": "3F"},
    {"name": "Seminar Room", "floor": "2F"},
    {"name": "Student Lounge", "floor": "1F"}
  ]'::jsonb
),
(
  'IT Building',
  'Academic',
  35.2342, 129.0810,
  '08:00 AM - 09:00 PM',
  'Information technology classrooms and labs.',
  '1F-4F: IT classrooms and labs',
  'IT & Computing',
  '051-510-2210',
  'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  '[
    {"name": "IT Help Desk", "floor": "1F"},
    {"name": "Programming Labs", "floor": "2F-3F"}
  ]'::jsonb,
  '[
    {"name": "Public Computers", "floor": "1F"},
    {"name": "Printer Room", "floor": "1F"}
  ]'::jsonb
),
(
  'Main Hall',
  'Administrative',
  35.2325, 129.0788,
  '09:00 AM - 06:00 PM',
  'Central campus hall for events and ceremonies.',
  '1F: Lobby; 2F: Auditorium',
  'Events & Ceremonies',
  '051-510-1100',
  'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80',
  '[
    {"name": "Main Auditorium", "floor": "2F"},
    {"name": "Reception", "floor": "1F"}
  ]'::jsonb,
  '[
    {"name": "Event Hall", "floor": "2F"},
    {"name": "Cloakroom", "floor": "1F"}
  ]'::jsonb
),
(
  'Student Center',
  'Student Life',
  35.2320, 129.0798,
  '08:00 AM - 10:00 PM',
  'Clubs, student council, and campus activities hub.',
  '1F-3F: Club rooms and offices',
  'Clubs & Activities',
  '051-510-1300',
  'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  '[
    {"name": "Student Council", "floor": "2F"},
    {"name": "Club Offices", "floor": "1F-3F"}
  ]'::jsonb,
  '[
    {"name": "Meeting Rooms", "floor": "2F"},
    {"name": "Lounge", "floor": "1F"}
  ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  subtitle = EXCLUDED.subtitle,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  image_url = EXCLUDED.image_url,
  departments = EXCLUDED.departments,
  amenities = EXCLUDED.amenities,
  hours = EXCLUDED.hours,
  details = EXCLUDED.details,
  floors = EXCLUDED.floors,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  type = EXCLUDED.type;
