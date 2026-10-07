CREATE TABLE customers (
 id SERIAL PRIMARY KEY, code VARCHAR(20) UNIQUE NOT NULL,
 name VARCHAR(120) NOT NULL, phone VARCHAR(15) UNIQUE NOT NULL,
 email VARCHAR(150), address VARCHAR(250), notes TEXT
);
CREATE TABLE pets (
 id SERIAL PRIMARY KEY, code VARCHAR(20) UNIQUE NOT NULL,
 customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
 name VARCHAR(100) NOT NULL, species VARCHAR(40) NOT NULL, breed VARCHAR(100),
 birth_date DATE, weight NUMERIC(8,2) CHECK(weight >= 0), notes TEXT
);
CREATE TABLE services (
 id SERIAL PRIMARY KEY, code VARCHAR(20) UNIQUE NOT NULL,
 name VARCHAR(120) NOT NULL, price NUMERIC(12,0) NOT NULL CHECK(price >= 0),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 5 AND 480), description TEXT
);
CREATE TABLE appointments (
 id SERIAL PRIMARY KEY, code VARCHAR(20) UNIQUE NOT NULL,
 pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
 service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 price NUMERIC(12,0) NOT NULL CHECK(price >= 0),
 status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
 notes TEXT, CHECK(ends_at > starts_at)
);
CREATE INDEX appointments_pet_time ON appointments(pet_id, starts_at);
CREATE INDEX pets_customer ON pets(customer_id);
