-- Insert default roles if they don't exist
INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'USER', 'Regular user' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'USER');

INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'ORGANIZER', 'Event organizer'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ORGANIZER');

INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'ADMIN', 'Administrator with full access' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');

-- Insert default categories if they don't exist
INSERT INTO categories (name, icon, color) 
SELECT 'Âm nhạc', 'music_note', '#ec4899'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Âm nhạc');


INSERT INTO categories (name, icon, color) 
SELECT 'Công nghệ', 'computer', '#06b6d4'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Công nghệ');


INSERT INTO categories (name, icon, color) 
SELECT 'Nghệ thuật', 'palette', '#a855f7'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Nghệ thuật');


INSERT INTO categories (name, icon, color) 
SELECT 'Thể thao', 'sports_soccer', '#f97316'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Thể thao');


INSERT INTO categories (name, icon, color) 
SELECT 'Ẩm thực', 'restaurant', '#eab308'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ẩm thực');


ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE seats DROP CONSTRAINT IF EXISTS seats_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Drop constraints that might cause conflicts with new schema
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
