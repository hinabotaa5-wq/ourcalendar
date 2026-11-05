-- Fixed-URL + password login: store a PBKDF2 password per invite row.
-- Existing sessions, cookies, and invite URLs keep working; no logout.
ALTER TABLE invites ADD COLUMN password_hash TEXT;
ALTER TABLE invites ADD COLUMN password_salt TEXT;
ALTER TABLE invites ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invites ADD COLUMN locked_until TEXT;
