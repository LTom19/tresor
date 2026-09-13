-- Trésor Finance — schéma multi-utilisateur PostgreSQL
-- Exécuter une fois : psql -U tresor -d tresor -f migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  compte_courant NUMERIC(14, 2) NOT NULL DEFAULT 0,
  livret_economies NUMERIC(14, 2) NOT NULL DEFAULT 0,
  livret_poche NUMERIC(14, 2) NOT NULL DEFAULT 0,
  alert_days_before INT NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS monthly_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  duration_type VARCHAR(20) NOT NULL DEFAULT 'indefinite',
  duration_value INT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS annual_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  charge_date DATE NOT NULL,
  start_date DATE NOT NULL,
  duration_type VARCHAR(20) NOT NULL DEFAULT 'indefinite',
  duration_value INT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type VARCHAR(20) NOT NULL,
  label VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  details TEXT,
  motif TEXT
);

CREATE TABLE IF NOT EXISTS processed_auto_events (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_monthly_subs_user ON monthly_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_subs_user ON annual_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_operations_user_ts ON operations(user_id, timestamp DESC);
