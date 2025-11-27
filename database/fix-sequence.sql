-- Fix PostgreSQL sequence for users table
-- This script resets the sequence to the correct value after failed seeding

-- Reset users sequence to max id + 1
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Reset schools sequence
SELECT setval('schools_id_seq', COALESCE((SELECT MAX(id) FROM schools), 0) + 1, false);

-- Reset caterings sequence
SELECT setval('caterings_id_seq', COALESCE((SELECT MAX(id) FROM caterings), 0) + 1, false);

-- Reset deliveries sequence
SELECT setval('deliveries_id_seq', COALESCE((SELECT MAX(id) FROM deliveries), 0) + 1, false);

-- Reset escrow_transactions sequence
SELECT setval('escrow_transactions_id_seq', COALESCE((SELECT MAX(id) FROM escrow_transactions), 0) + 1, false);

-- Reset verifications sequence
SELECT setval('verifications_id_seq', COALESCE((SELECT MAX(id) FROM verifications), 0) + 1, false);

-- Reset issues sequence
SELECT setval('issues_id_seq', COALESCE((SELECT MAX(id) FROM issues), 0) + 1, false);

-- Verify sequences
SELECT 'users_id_seq' AS sequence_name, last_value FROM users_id_seq
UNION ALL
SELECT 'schools_id_seq', last_value FROM schools_id_seq
UNION ALL
SELECT 'caterings_id_seq', last_value FROM caterings_id_seq
UNION ALL
SELECT 'deliveries_id_seq', last_value FROM deliveries_id_seq
UNION ALL
SELECT 'escrow_transactions_id_seq', last_value FROM escrow_transactions_id_seq
UNION ALL
SELECT 'verifications_id_seq', last_value FROM verifications_id_seq
UNION ALL
SELECT 'issues_id_seq', last_value FROM issues_id_seq;
