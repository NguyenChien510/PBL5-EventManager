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
SELECT 'Âm nhạc', 'music_note', 'bg-pink-500'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Âm nhạc');

INSERT INTO categories (name, icon, color) 
SELECT 'Công nghệ', 'computer', 'bg-cyan-500'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Công nghệ');

INSERT INTO categories (name, icon, color) 
SELECT 'Nghệ thuật', 'palette', 'bg-purple-500'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Nghệ thuật');

INSERT INTO categories (name, icon, color) 
SELECT 'Thể thao', 'sports_soccer', 'bg-orange-500'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Thể thao');

INSERT INTO categories (name, icon, color) 
SELECT 'Ẩm thực', 'restaurant', 'bg-yellow-500'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ẩm thực');
