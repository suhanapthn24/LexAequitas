-- LexAequitas baseline schema (PostgreSQL)
-- Derived from JPA entities in new_folder/backend-java/src/main/java/com/lexaequitas/model

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS cases (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    case_number VARCHAR(255),
    case_type VARCHAR(100),
    client_name VARCHAR(255),
    opposing_party VARCHAR(255),
    court_name VARCHAR(255),
    judge_name VARCHAR(255),
    next_hearing_date DATE,
    description TEXT,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    event_type VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    date TIMESTAMP,
    location VARCHAR(255),
    case_number VARCHAR(255),
    client_name VARCHAR(255),
    case_id BIGINT,
    notes TEXT,
    notify_email VARCHAR(255),
    remind_days INTEGER DEFAULT 1,
    reminded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional index suggestions
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);

