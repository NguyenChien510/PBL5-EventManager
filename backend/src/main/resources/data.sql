-- Insert default roles if they don't exist
INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'USER', 'Regular user' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'USER');

INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'ADMIN', 'Administrator with full access' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');



mvn clean compile