-- THE LAST PROTOCOL - database changes (run once on an existing database)
-- psql: sudo -u postgres psql -d hackathon -f migrations_manual.sql
-- (uvicorn also does step 1 automatically at startup via migrate_legacy())

BEGIN;

-- 1) The phone number is no longer collected at registration.
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- 2) Optional: refresh the welcome announcement so it matches the new dates / place.
--    (uncomment if you want it)
-- INSERT INTO announcements (text) VALUES
--   ('THE LAST PROTOCOL: 15-17 December 2026 at the Central Library, Tlemcen. 14 December is organiser preparation only.');

COMMIT;

-- Check:
-- \d users
