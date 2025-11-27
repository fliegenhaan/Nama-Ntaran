-- =============================================================================
-- SEEDING DATA FOR ADMIN PAGES: ANOMALIES, ESCROW, MANUAL REVIEW
-- =============================================================================
-- Created: 2025-11-27
-- Purpose: Populate data for government admin dashboard features
-- Tables: anomaly_alerts, critical_anomalies, escrow_transactions,
--         ai_food_analyses, verifications, and related dependencies
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: PREREQUISITE DATA (Users, Schools, Caterings, Allocations)
-- =============================================================================

-- Insert Admin Users (Government Officials)
INSERT INTO users (id, email, role, password_hash, full_name, is_active, created_at, updated_at)
VALUES
  (1001, 'admin.pusat@kemdikbud.go.id', 'admin', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Dr. Budi Santoso', true, NOW(), NOW()),
  (1002, 'admin.jawa@kemdikbud.go.id', 'admin', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Siti Nurhaliza, S.Pd', true, NOW(), NOW()),
  (1003, 'auditor.nasional@kemdikbud.go.id', 'admin', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Ahmad Wijaya, M.M', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Admin Profiles
INSERT INTO admin_profiles (id, user_id, full_name, nip, level, position, department, region_name, province, city, phone, office_phone, is_active, created_at, updated_at)
VALUES
  (1, 1001, 'Dr. Budi Santoso', '196805121990031001', 'national', 'Direktur Program Makan Bergizi Gratis', 'Direktorat Pembinaan SD', 'Nasional', 'DKI Jakarta', 'Jakarta Pusat', '+62812-3456-7890', '021-5703303', true, NOW(), NOW()),
  (2, 1002, 'Siti Nurhaliza, S.Pd', '197203151995122001', 'provincial', 'Koordinator Provinsi Jawa Barat', 'Dinas Pendidikan Provinsi', 'Jawa Barat', 'Jawa Barat', 'Bandung', '+62813-4567-8901', '022-4264813', true, NOW(), NOW()),
  (3, 1003, 'Ahmad Wijaya, M.M', '198109232006041002', 'national', 'Kepala Audit & Pengawasan', 'Inspektorat Jenderal', 'Nasional', 'DKI Jakarta', 'Jakarta Pusat', '+62814-5678-9012', '021-5736365', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Schools
INSERT INTO schools (id, npsn, name, address, kelurahan, district, city, province, jenjang, status, latitude, longitude, priority_score, created_at, updated_at)
VALUES
  (2001, '20100001', 'SDN Sukamaju 01', 'Jl. Pendidikan No. 123', 'Sukamaju', 'Bogor Utara', 'Bogor', 'Jawa Barat', 'SD', 'active', -6.5971, 106.8060, 85.5, NOW(), NOW()),
  (2002, '20100002', 'SDN Cimanggis 02', 'Jl. Raya Cimanggis No. 45', 'Cimanggis', 'Depok', 'Depok', 'Jawa Barat', 'SD', 'active', -6.3621, 106.8453, 78.2, NOW(), NOW()),
  (2003, '20100003', 'SDN Cibinong 03', 'Jl. Tegar Beriman No. 67', 'Cibinong', 'Cibinong', 'Bogor', 'Jawa Barat', 'SD', 'active', -6.4817, 106.8539, 92.1, NOW(), NOW()),
  (2004, '20100004', 'SDN Bekasi Timur 01', 'Jl. Cut Mutia No. 89', 'Margahayu', 'Bekasi Timur', 'Bekasi', 'Jawa Barat', 'SD', 'active', -6.2607, 107.0046, 68.9, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Caterings
INSERT INTO caterings (id, name, company_name, email, phone, address, wallet_address, rating, total_deliveries, max_daily_portions, risk_level, is_suspended, created_at, updated_at)
VALUES
  (3001, 'Katering Sehat Bersama', 'PT Sehat Bersama Indonesia', 'info@sehatbersama.co.id', '+62821-1111-2222', 'Jl. Industri No. 10, Bogor', '0x1234567890abcdef1234567890abcdef12345678', 4.2, 150, 2000, 'low', false, NOW(), NOW()),
  (3002, 'Katering Bergizi Nusantara', 'CV Bergizi Nusantara', 'contact@bergizi.co.id', '+62822-3333-4444', 'Jl. Makanan Sehat No. 25, Depok', '0xabcdef1234567890abcdef1234567890abcdef12', 3.8, 89, 1500, 'medium', false, NOW(), NOW()),
  (3003, 'Katering Sumber Gizi', 'PT Sumber Gizi Mandiri', 'admin@sumbergizi.co.id', '+62823-5555-6666', 'Jl. Nutrisi No. 15, Bekasi', '0x7890abcdef1234567890abcdef1234567890abcd', 3.2, 45, 1000, 'high', false, NOW(), NOW()),
  (3004, 'Katering Problematic Foods', 'CV Problematik', 'support@problematic.co.id', '+62824-7777-8888', 'Jl. Bermasalah No. 99, Cibinong', '0xdef1234567890abcdef1234567890abcdef12345', 2.5, 120, 800, 'high', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Budget Allocations
INSERT INTO budget_allocations (id, fiscal_year, fiscal_quarter, province, city, total_budget, allocated_amount, disbursed_amount, remaining_amount, target_schools, target_students, target_portions, status, approved_by, approved_at, created_at, updated_at)
VALUES
  (4001, 2025, 1, 'Jawa Barat', 'Bogor', 5000000000, 4500000000, 3200000000, 1300000000, 50, 15000, 900000, 'active', 1001, NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days', NOW()),
  (4002, 2025, 1, 'Jawa Barat', 'Depok', 3500000000, 3200000000, 2100000000, 1100000000, 35, 10500, 630000, 'active', 1001, NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Allocations
INSERT INTO allocations (id, allocation_id, school_id, catering_id, budget_id, amount, currency, status, locked_at, released_at, tx_hash_lock, tx_hash_release, blockchain_confirmed, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  -- Locked allocations for escrow
  (5001, 'ALLOC-2025-Q1-001', 2001, 3001, 4001, 45000000, 'IDR', 'LOCKED', NOW() - INTERVAL '15 days', NULL, '0xabc123def456...lock001', NULL, true, 1001, 1001, NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days'),
  (5002, 'ALLOC-2025-Q1-002', 2002, 3002, 4002, 38000000, 'IDR', 'LOCKED', NOW() - INTERVAL '12 days', NULL, '0xabc123def456...lock002', NULL, true, 1001, 1001, NOW() - INTERVAL '18 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '12 days'),
  (5003, 'ALLOC-2025-Q1-003', 2003, 3003, 4001, 52000000, 'IDR', 'LOCKED', NOW() - INTERVAL '8 days', NULL, '0xabc123def456...lock003', NULL, true, 1002, 1001, NOW() - INTERVAL '12 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days'),

  -- Released allocations
  (5004, 'ALLOC-2025-Q1-004', 2004, 3001, 4002, 41000000, 'IDR', 'RELEASED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', '0xabc123def456...lock004', '0xdef789ghi012...release004', true, 1001, 1001, NOW() - INTERVAL '35 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '5 days'),

  -- Pending allocation (mapped to PLANNED status)
  (5005, 'ALLOC-2025-Q1-005', 2001, 3004, 4001, 35000000, 'IDR', 'PLANNED', NULL, NULL, NULL, NULL, false, 1002, NULL, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Deliveries
INSERT INTO deliveries (id, allocation_id, school_id, catering_id, delivery_date, portions, amount, status, delivered_at, driver_name, driver_phone, vehicle_number, notes, created_at, updated_at)
VALUES
  -- For manual review (recent deliveries)
  (6001, 5001, 2001, 3001, CURRENT_DATE - INTERVAL '2 days', 450, 6750000, 'delivered', NOW() - INTERVAL '2 days', 'Joko Susanto', '+62856-1111-2222', 'B 1234 XYZ', 'Pengiriman tepat waktu', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  (6002, 5002, 2002, 3002, CURRENT_DATE - INTERVAL '1 day', 380, 5700000, 'delivered', NOW() - INTERVAL '1 day', 'Rudi Hermawan', '+62857-3333-4444', 'B 5678 ABC', 'Ada keterlambatan 15 menit', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  (6003, 5003, 2003, 3003, CURRENT_DATE, 520, 7800000, 'delivered', NOW() - INTERVAL '3 hours', 'Andi Wijaya', '+62858-5555-6666', 'B 9012 DEF', 'Kualitas makanan dipertanyakan', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours'),
  (6004, 5004, 2004, 3001, CURRENT_DATE - INTERVAL '10 days', 410, 6150000, 'verified', NOW() - INTERVAL '10 days', 'Bambang Setiawan', '+62859-7777-8888', 'B 3456 GHI', 'Pengiriman sukses dan sudah diverifikasi', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days'),
  (6005, 5001, 2001, 3001, CURRENT_DATE - INTERVAL '3 days', 450, 6750000, 'delivered', NOW() - INTERVAL '3 days', 'Joko Susanto', '+62856-1111-2222', 'B 1234 XYZ', 'Porsi kurang dari yang dijanjikan', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 2: ANOMALIES PAGE DATA
-- =============================================================================

-- Insert Anomaly Alerts
INSERT INTO anomaly_alerts (id, type, severity, title, description, catering_id, school_id, confidence_score, detected_at, status, suspicious_patterns, data_points, recommendation, investigated_by, investigated_at, resolution_notes, created_at)
VALUES
  -- Critical anomalies
  (7001, 'quality_fraud', 'critical', 'Pola Kualitas Makanan Mencurigakan',
   'Katering Sumber Gizi memiliki pola penurunan kualitas drastis setelah kontrak disetujui. Rating turun dari 4.5 ke 2.8 dalam 2 minggu.',
   3003, NULL, 0.89, NOW() - INTERVAL '2 days', 'investigating',
   ARRAY['sudden_quality_drop', 'pattern_after_contract', 'multiple_complaints'],
   '{"avg_quality_before": 4.5, "avg_quality_after": 2.8, "complaints_count": 12, "delivery_count": 15}'::jsonb,
   'immediate_audit', 1003, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '2 days'),

  (7002, 'delivery_fraud', 'critical', 'Manipulasi Porsi Pengiriman',
   'Katering Problematic Foods melaporkan pengiriman 800 porsi tetapi verifikasi sekolah hanya menerima 650 porsi (81% dari laporan).',
   3004, 2001, 0.92, NOW() - INTERVAL '5 hours', 'new',
   ARRAY['portion_mismatch', 'systematic_underdelivery', 'photo_evidence_conflict'],
   '{"reported_portions": 800, "verified_portions": 650, "discrepancy_rate": 0.19, "financial_impact": 2250000}'::jsonb,
   'suspend_payment', NULL, NULL, NULL, NOW() - INTERVAL '5 hours'),

  (7003, 'financial_anomaly', 'high', 'Keterlambatan Pencairan Dana Berulang',
   'Alokasi ALLOC-2025-Q1-003 terkunci lebih dari 30 hari tanpa pencairan. Pola serupa terdeteksi pada 3 alokasi lainnya untuk catering yang sama.',
   3003, 2003, 0.76, NOW() - INTERVAL '1 day', 'investigating',
   ARRAY['prolonged_lock', 'payment_delay_pattern', 'delivery_completion_verified'],
   '{"locked_days": 35, "expected_release_days": 7, "similar_cases": 3, "total_locked_amount": 156000000}'::jsonb,
   'review_contract', 1003, NOW() - INTERVAL '6 hours', 'Sedang dikaji oleh tim legal', NOW() - INTERVAL '1 day'),

  -- Medium severity anomalies
  (7004, 'quality_trend', 'medium', 'Tren Penurunan Kualitas Bertahap',
   'Katering Bergizi Nusantara menunjukkan tren penurunan rating kualitas makanan secara konsisten dari 4.2 ke 3.8 dalam 3 bulan terakhir.',
   3002, NULL, 0.68, NOW() - INTERVAL '3 days', 'resolved',
   ARRAY['gradual_decline', 'seasonal_pattern', 'ingredient_quality'],
   '{"month_1_rating": 4.2, "month_2_rating": 4.0, "month_3_rating": 3.8, "trend_slope": -0.2}'::jsonb,
   'quality_audit', 1002, NOW() - INTERVAL '2 days', 'Katering telah melakukan perbaikan supply chain. Kualitas kembali membaik ke rating 4.1.', NOW() - INTERVAL '3 days'),

  (7005, 'hygiene_violation', 'high', 'Pelanggaran Standar Kebersihan',
   'Foto verifikasi dari 3 pengiriman terakhir menunjukkan kemasan makanan yang tidak higienis dan tidak sesuai standar BPOM.',
   3004, 2002, 0.84, NOW() - INTERVAL '12 hours', 'investigating',
   ARRAY['hygiene_standard_breach', 'packaging_violation', 'multiple_occurrences'],
   '{"violation_count": 3, "affected_deliveries": [6002, 6003, 6005], "health_risk_level": "medium"}'::jsonb,
   'immediate_inspection', 1002, NOW() - INTERVAL '2 hours', NULL, NOW() - INTERVAL '12 hours'),

  -- Low severity anomalies
  (7006, 'delivery_delay', 'low', 'Keterlambatan Pengiriman Minor',
   'Katering Sehat Bersama mengalami keterlambatan pengiriman 10-20 menit pada 5 dari 10 pengiriman terakhir.',
   3001, NULL, 0.55, NOW() - INTERVAL '6 days', 'resolved',
   ARRAY['minor_delay', 'traffic_related', 'consistent_pattern'],
   '{"avg_delay_minutes": 15, "delayed_deliveries": 5, "total_deliveries": 10, "delay_rate": 0.5}'::jsonb,
   'route_optimization', 1002, NOW() - INTERVAL '5 days', 'Katering telah menyesuaikan jadwal keberangkatan lebih pagi. Masalah teratasi.', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Critical Anomalies (subset of most critical alerts)
-- Note: id is auto-increment, so we don't specify it
INSERT INTO critical_anomalies (catering_id, school_id, type, severity, title, description, confidence_score, suspicious_patterns, data_points, recommendation, status, detected_at, investigated_by, investigated_at, resolution_notes, created_at)
VALUES
  (3003, NULL, 'quality_fraud', 'critical', 'Pola Kualitas Makanan Mencurigakan',
   'Katering Sumber Gizi memiliki pola penurunan kualitas drastis setelah kontrak disetujui. Rating turun dari 4.5 ke 2.8 dalam 2 minggu.',
   0.89, ARRAY['sudden_quality_drop', 'pattern_after_contract', 'multiple_complaints'],
   '{"avg_quality_before": 4.5, "avg_quality_after": 2.8, "complaints_count": 12, "delivery_count": 15}'::jsonb,
   'immediate_audit', 'investigating', NOW() - INTERVAL '2 days', 1003, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '2 days'),

  (3004, 2001, 'delivery_fraud', 'critical', 'Manipulasi Porsi Pengiriman',
   'Katering Problematic Foods melaporkan pengiriman 800 porsi tetapi verifikasi sekolah hanya menerima 650 porsi (81% dari laporan).',
   0.92, ARRAY['portion_mismatch', 'systematic_underdelivery', 'photo_evidence_conflict'],
   '{"reported_portions": 800, "verified_portions": 650, "discrepancy_rate": 0.19, "financial_impact": 2250000}'::jsonb,
   'suspend_payment', 'new', NOW() - INTERVAL '5 hours', NULL, NULL, NULL, NOW() - INTERVAL '5 hours'),

  (3004, 2002, 'hygiene_violation', 'high', 'Pelanggaran Standar Kebersihan',
   'Foto verifikasi dari 3 pengiriman terakhir menunjukkan kemasan makanan yang tidak higienis dan tidak sesuai standar BPOM.',
   0.84, ARRAY['hygiene_standard_breach', 'packaging_violation', 'multiple_occurrences'],
   '{"violation_count": 3, "affected_deliveries": [6002, 6003, 6005], "health_risk_level": "medium"}'::jsonb,
   'immediate_inspection', 'investigating', NOW() - INTERVAL '12 hours', 1002, NOW() - INTERVAL '2 hours', NULL, NOW() - INTERVAL '12 hours');

-- =============================================================================
-- SECTION 3: ESCROW PAGE DATA
-- =============================================================================

-- Insert Escrow Transactions
INSERT INTO escrow_transactions (id, allocation_id, transaction_type, amount, currency, status, blockchain_tx_hash, blockchain_block_number, blockchain_confirmed, from_address, to_address, smart_contract_address, gas_used, gas_price_gwei, executed_at, confirmed_at, retry_count, metadata, created_at, error_message)
VALUES
  -- Lock transactions (funds locked in escrow)
  (8001, 5001, 'LOCK', 45000000, 'IDR', 'CONFIRMED',
   '0x7a8f3e9d1c5b4a6e2f8d9c3b5a7e1f4d6c8b2a9e5d7c3f1a4b6e8d2c5a7e9f1b',
   18234567, true,
   '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   145000, 25.5,
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 0,
   '{"allocation_id": "ALLOC-2025-Q1-001", "school_npsn": "20100001", "catering_name": "Katering Sehat Bersama"}'::jsonb,
   NOW() - INTERVAL '15 days', NULL),

  (8002, 5002, 'LOCK', 38000000, 'IDR', 'CONFIRMED',
   '0x2b9e4f0a3d6c5b7e9f1a4c6d8e0b2f5a7c9e1d3b5a7e9f2c4a6b8d0e2f4a6c8',
   18256789, true,
   '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   142000, 23.8,
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 0,
   '{"allocation_id": "ALLOC-2025-Q1-002", "school_npsn": "20100002", "catering_name": "Katering Bergizi Nusantara"}'::jsonb,
   NOW() - INTERVAL '12 days', NULL),

  (8003, 5003, 'LOCK', 52000000, 'IDR', 'CONFIRMED',
   '0x3c0f5a1e4d7c6b8e0f2a5c7d9e1b3f6a8c0e2d4b6a8e0f3c5a7b9d1e3f5a7c9',
   18278901, true,
   '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   148000, 27.2,
   NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 0,
   '{"allocation_id": "ALLOC-2025-Q1-003", "school_npsn": "20100003", "catering_name": "Katering Sumber Gizi", "anomaly_flag": true}'::jsonb,
   NOW() - INTERVAL '8 days', NULL),

  -- Release transaction (funds released to catering)
  (8004, 5004, 'RELEASE', 41000000, 'IDR', 'CONFIRMED',
   '0x4d1f6a2e5d8c7b9e1f3a6c8d0e2b4f7a9c1e3d5b7a9e1f4c6a8b0d2e4f6a8c0',
   18312345, true,
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0x1234567890abcdef1234567890abcdef12345678',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   98000, 22.1,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 0,
   '{"allocation_id": "ALLOC-2025-Q1-004", "school_npsn": "20100004", "catering_name": "Katering Sehat Bersama", "verified": true}'::jsonb,
   NOW() - INTERVAL '5 days', NULL),

  -- Pending transaction (waiting for confirmation)
  (8005, 5001, 'LOCK', 45000000, 'IDR', 'PENDING',
   '0x5e2f7a3e6d9c8b0e2f4a7c9d1e3b5f8a0c2e4d6b8a0e2f5c7a9b1d3e5f7a9c1',
   18334567, false,
   '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   NULL, 26.3,
   NOW() - INTERVAL '2 hours', NULL, 0,
   '{"allocation_id": "ALLOC-2025-Q1-001-B", "school_npsn": "20100001", "catering_name": "Katering Sehat Bersama", "status": "awaiting_confirmation"}'::jsonb,
   NOW() - INTERVAL '2 hours', NULL),

  -- Failed transaction (requires retry)
  (8006, 5005, 'LOCK', 35000000, 'IDR', 'FAILED',
   '0x6e3f8a4e7d0c9b1e3f5a8c0d2e4b6f9a1c3e5d7b9a1e3f6c8a0b2d4e6f8a0c2',
   18345678, false,
   '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0xCONTRACT1234567890abcdef1234567890abcdef',
   0, 24.7,
   NOW() - INTERVAL '1 hour', NULL, 2,
   '{"allocation_id": "ALLOC-2025-Q1-005", "school_npsn": "20100001", "catering_name": "Katering Problematic Foods"}'::jsonb,
   NOW() - INTERVAL '1 hour',
   'Gas estimation failed')
ON CONFLICT (id) DO NOTHING;

-- Insert Blockchain Transaction History (for tracking purposes)
INSERT INTO blockchain_transaction_history (id, tx_hash, network, from_address, to_address, value_wei, value_idr, contract_address, tx_status, gas_used, gas_price_gwei, total_fee_wei, total_fee_idr, block_number, block_timestamp, transaction_index, nonce, logs_count, metadata, created_at)
VALUES
  (9001, '0x7a8f3e9d1c5b4a6e2f8d9c3b5a7e1f4d6c8b2a9e5d7c3f1a4b6e8d2c5a7e9f1b',
   'ethereum-mainnet', '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
   '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0', 45000000, '0xCONTRACT1234567890abcdef1234567890abcdef',
   'success', 145000, 25.5, '3697500000000000', 58.95, 18234567,
   NOW() - INTERVAL '15 days', 42, 128, 3,
   '{"allocation_reference": "ALLOC-2025-Q1-001", "event_type": "AllocationLocked"}'::jsonb,
   NOW() - INTERVAL '15 days'),

  (9002, '0x4d1f6a2e5d8c7b9e1f3a6c8d0e2b4f7a9c1e3d5b7a9e1f4c6a8b0d2e4f6a8c0',
   'ethereum-mainnet', '0xSMARTCONTRACT1234567890abcdef1234567890',
   '0x1234567890abcdef1234567890abcdef12345678',
   '0', 41000000, '0xCONTRACT1234567890abcdef1234567890abcdef',
   'success', 98000, 22.1, '2165800000000000', 43.52, 18312345,
   NOW() - INTERVAL '5 days', 89, 245, 2,
   '{"allocation_reference": "ALLOC-2025-Q1-004", "event_type": "AllocationReleased"}'::jsonb,
   NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 4: MANUAL REVIEW PAGE DATA
-- =============================================================================

-- Insert AI Food Analyses (requiring manual review)
INSERT INTO ai_food_analyses (id, delivery_id, verification_id, menu_match, quality_score, freshness_score, presentation_score, hygiene_score, estimated_calories, estimated_protein, estimated_carbs, detected_items, reasoning, issues, warnings, recommendations, portion_estimate, portion_confidence, portion_match, quality_acceptable, has_vegetables, meets_bgn_standards, confidence, needs_manual_review, manual_review_status, analyzed_at, reviewed_by, reviewed_at, created_at)
VALUES
  -- NEEDS REVIEW: Quality concerns
  (10001, 6003, NULL, true, 62, 55, 60, 58, 520, 18, 68,
   ARRAY['nasi putih', 'ayam goreng', 'sayur sop', 'tempe goreng', 'buah pisang'],
   'Makanan terdeteksi lengkap sesuai menu standar BGN, namun ada kekhawatiran pada aspek kesegaran. Sayur terlihat sedikit layu dan kemasan kurang rapi. Porsi protein mencukupi tetapi presentasi kurang menarik.',
   ARRAY['freshness_concern', 'presentation_poor', 'packaging_issue'],
   ARRAY['Sayur terlihat tidak fresh', 'Kemasan tidak rapi', 'Hygiene score dibawah standar (58/100)'],
   ARRAY['Tingkatkan quality control', 'Gunakan kemasan yang lebih baik', 'Pastikan sayuran fresh setiap hari'],
   520, 0.78, true, false, true, false, 0.78, true, 'pending',
   NOW() - INTERVAL '3 hours', NULL, NULL, NOW() - INTERVAL '3 hours'),

  -- NEEDS REVIEW: Portion mismatch
  (10002, 6002, NULL, true, 72, 75, 70, 68, 480, 16, 62,
   ARRAY['nasi putih', 'ikan goreng', 'sayur bayam', 'tahu goreng', 'buah jeruk'],
   'Menu lengkap namun AI mendeteksi kemungkinan porsi lebih kecil dari standar. Estimasi porsi 380 namun seharusnya 450 berdasarkan kontrak.',
   ARRAY['portion_size_concern', 'quantity_mismatch'],
   ARRAY['Porsi terlihat kurang dari standar', 'Discrepancy antara laporan (380) dan kontrak (450)'],
   ARRAY['Verifikasi ulang jumlah porsi', 'Timbang sample porsi', 'Cek kepatuhan kontrak'],
   380, 0.82, false, true, true, true, 0.82, true, 'pending',
   NOW() - INTERVAL '25 hours', NULL, NULL, NOW() - INTERVAL '25 hours'),

  -- NEEDS REVIEW: Missing vegetables
  (10003, 6005, NULL, false, 58, 70, 65, 55, 550, 22, 75,
   ARRAY['nasi putih', 'ayam goreng', 'tempe goreng', 'sambal', 'kerupuk'],
   'Makanan tidak sesuai menu standar BGN. Sayuran tidak terdeteksi dalam foto. Porsi protein berlebih namun tidak ada komponen sayur yang merupakan bagian wajib menu BGN.',
   ARRAY['missing_vegetables', 'menu_non_compliance', 'bgn_standard_violation'],
   ARRAY['Tidak ada sayuran', 'Menu tidak sesuai standar BGN', 'Hygiene score rendah'],
   ARRAY['Segera tambahkan komponen sayuran', 'Review menu dengan panduan BGN', 'Tingkatkan kebersihan'],
   450, 0.85, true, false, false, false, 0.85, true, 'pending',
   NOW() - INTERVAL '3 days', NULL, NULL, NOW() - INTERVAL '3 days'),

  -- REVIEWED & APPROVED
  (10004, 6001, NULL, true, 88, 90, 85, 87, 510, 20, 65,
   ARRAY['nasi putih', 'ikan bakar', 'sayur asem', 'tempe mendoan', 'buah pepaya'],
   'Makanan sesuai standar BGN dengan kualitas sangat baik. Semua komponen gizi terpenuhi. Presentasi menarik dan kemasan higienis.',
   ARRAY[]::text[],
   ARRAY[]::text[],
   ARRAY['Pertahankan kualitas ini'],
   450, 0.95, true, true, true, true, 0.95, false, 'approved',
   NOW() - INTERVAL '2 days', 1002, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),

  -- REVIEWED & REJECTED
  (10005, 6004, NULL, true, 45, 40, 50, 38, 420, 12, 58,
   ARRAY['nasi putih', 'nugget ayam', 'sayur kol', 'kerupuk'],
   'Kualitas makanan sangat buruk. Sayur terlihat tidak fresh, kemasan kotor, dan presentasi sangat kurang. Tidak memenuhi standar minimum BGN.',
   ARRAY['severe_quality_issue', 'hygiene_violation', 'freshness_critical'],
   ARRAY['Makanan tidak layak konsumsi', 'Kemasan tidak higienis', 'Sayur sudah layu'],
   ARRAY['Tolak pengiriman', 'Audit katering', 'Pertimbangkan suspend kontrak'],
   410, 0.88, true, false, true, false, 0.88, true, 'rejected',
   NOW() - INTERVAL '10 days', 1003, NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days'),

  -- NEEDS REVIEW: Borderline case
  (10006, 6001, NULL, true, 68, 72, 65, 70, 500, 19, 67,
   ARRAY['nasi merah', 'ayam bumbu kuning', 'sayur kangkung', 'tempe bacem', 'buah apel'],
   'Makanan cukup memenuhi standar namun ada beberapa area yang perlu improvement. Quality score borderline (68/100). Perlu verifikasi manual untuk memastikan kelayakan.',
   ARRAY['borderline_quality', 'needs_verification'],
   ARRAY['Quality score mendekati batas minimum (70)', 'Presentasi bisa ditingkatkan'],
   ARRAY['Review manual diperlukan', 'Berikan feedback ke katering', 'Monitor trend kualitas'],
   450, 0.80, true, true, true, true, 0.80, true, 'pending',
   NOW() - INTERVAL '12 hours', NULL, NULL, NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert Verifications (linked to deliveries and AI analyses)
INSERT INTO verifications (id, delivery_id, school_id, verified_by, ai_analysis_id, portions_received, quality_rating, photo_url, notes, status, verified_at, created_at, updated_at)
VALUES
  (11001, 6001, 2001, NULL, 10004, 450, 4,
   'https://storage.example.com/verifications/del6001_img1.jpg',
   'Makanan diterima dalam kondisi baik, porsi sesuai, kualitas memuaskan.',
   'verified', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

  (11002, 6002, 2002, NULL, 10002, 380, 3,
   'https://storage.example.com/verifications/del6002_img1.jpg',
   'Porsi lebih sedikit dari yang dijanjikan. Kualitas cukup baik tetapi kuantitas tidak sesuai kontrak.',
   'pending', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  (11003, 6003, 2003, NULL, 10001, 520, 2,
   'https://storage.example.com/verifications/del6003_img1.jpg',
   'Kualitas makanan mengkhawatirkan. Sayur tidak fresh, kemasan kurang rapi. Perlu tindak lanjut.',
   'pending', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  (11004, 6004, 2004, NULL, 10005, 410, 2,
   'https://storage.example.com/verifications/del6004_img1.jpg',
   'Makanan tidak memenuhi standar. Tidak higienis dan kualitas sangat buruk.',
   'rejected', NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),

  (11005, 6005, 2001, NULL, 10003, 450, 2,
   'https://storage.example.com/verifications/del6005_img1.jpg',
   'Sayuran tidak ada sama sekali. Menu tidak sesuai standar BGN. Complaint diajukan.',
   'pending', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  (11006, 6001, 2001, NULL, 10006, 450, 3,
   'https://storage.example.com/verifications/del6001_img2.jpg',
   'Kualitas borderline, perlu review lebih detail oleh admin.',
   'pending', NULL, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 5: SUPPORTING DATA (Activity Logs, Notifications)
-- =============================================================================

-- Insert Admin Activity Logs
INSERT INTO admin_activity_log (id, admin_id, admin_name, admin_role, action_type, action_description, target_type, target_id, status, metadata, performed_at, created_at, user_agent, ip_address)
VALUES
  (12001, 1003, 'Ahmad Wijaya, M.M', 'national', 'anomaly_investigation',
   'Memulai investigasi anomali kualitas makanan pada Katering Sumber Gizi',
   'anomaly_alert', 7001, 'success',
   '{"severity": "critical", "catering_id": 3003, "confidence_score": 0.89}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '10.20.30.40'),

  (12002, 1002, 'Siti Nurhaliza, S.Pd', 'provincial', 'manual_review_complete',
   'Menyelesaikan review manual AI analysis untuk delivery #6001',
   'ai_food_analysis', 10004, 'success',
   '{"decision": "approved", "quality_score": 88, "delivery_id": 6001}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '10.20.30.41'),

  (12003, 1002, 'Siti Nurhaliza, S.Pd', 'provincial', 'hygiene_investigation',
   'Memulai investigasi pelanggaran kebersihan pada Katering Problematic Foods',
   'anomaly_alert', 7005, 'success',
   '{"severity": "high", "catering_id": 3004, "affected_deliveries": 3}'::jsonb,
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '10.20.30.41'),

  (12004, 1003, 'Ahmad Wijaya, M.M', 'national', 'manual_review_reject',
   'Menolak delivery #6004 karena tidak memenuhi standar kualitas dan kebersihan',
   'ai_food_analysis', 10005, 'success',
   '{"decision": "rejected", "quality_score": 45, "delivery_id": 6004, "reason": "severe_quality_issue"}'::jsonb,
   NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '10.20.30.40'),

  (12005, 1001, 'Dr. Budi Santoso', 'national', 'escrow_review',
   'Mereview status escrow transaction untuk allocation ALLOC-2025-Q1-003',
   'escrow_transaction', 8003, 'success',
   '{"amount": 52000000, "status": "confirmed", "locked_days": 35}'::jsonb,
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '10.20.30.42')
ON CONFLICT (id) DO NOTHING;

-- Insert Government Notifications
-- Note: severity constraint allows only: 'info', 'warning', 'error', 'critical'
INSERT INTO government_notifications (id, recipient_id, recipient_role, notification_type, title, message, severity, related_type, related_id, related_url, action_required, action_label, action_url, is_read, read_at, is_archived, archived_at, metadata, created_at, expires_at)
VALUES
  (13001, 1003, 'admin', 'anomaly_alert',
   'URGENT: Anomali Kritis Terdeteksi',
   'Sistem mendeteksi manipulasi porsi pengiriman pada Katering Problematic Foods. Discrepancy 19% dengan dampak finansial Rp 2.250.000. Tindakan segera diperlukan.',
   'critical', 'anomaly_alert', 7002, '/admin/anomalies/7002',
   true, 'Investigate Now', '/admin/anomalies/7002/investigate',
   false, NULL, false, NULL,
   '{"catering_id": 3004, "confidence_score": 0.92, "financial_impact": 2250000, "priority": "high"}'::jsonb,
   NOW() - INTERVAL '5 hours', NOW() + INTERVAL '7 days'),

  (13002, 1002, 'admin', 'manual_review_required',
   'Review Manual Diperlukan: 3 Deliveries',
   'Ada 3 delivery yang memerlukan review manual karena AI confidence score borderline atau terdeteksi isu kualitas.',
   'warning', 'ai_food_analysis', NULL, '/admin/manual-review',
   true, 'Review Now', '/admin/manual-review',
   false, NULL, false, NULL,
   '{"pending_reviews": 3, "oldest_pending": "3 days ago", "priority": "medium"}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days'),

  (13003, 1001, 'admin', 'escrow_alert',
   'Dana Escrow Tertahan > 30 Hari',
   'Alokasi ALLOC-2025-Q1-003 senilai Rp 52.000.000 tertahan di escrow lebih dari 30 hari. Review dan pencairan diperlukan.',
   'warning', 'escrow_transaction', 8003, '/admin/escrow/8003',
   true, 'Review Escrow', '/admin/escrow',
   true, NOW() - INTERVAL '4 hours', false, NULL,
   '{"allocation_id": "ALLOC-2025-Q1-003", "locked_days": 35, "amount": 52000000, "priority": "medium"}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days'),

  (13004, 1002, 'admin', 'anomaly_resolved',
   'Anomali Berhasil Diselesaikan',
   'Tren penurunan kualitas pada Katering Bergizi Nusantara telah ditangani. Rating kembali meningkat ke 4.1.',
   'info', 'anomaly_alert', 7004, '/admin/anomalies/7004',
   false, NULL, NULL,
   true, NOW() - INTERVAL '1 day', false, NULL,
   '{"catering_id": 3002, "resolution": "quality_improved", "new_rating": 4.1, "priority": "low"}'::jsonb,
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '30 days'),

  (13005, 1003, 'admin', 'hygiene_violation',
   'Pelanggaran Kebersihan Terdeteksi',
   'Katering Problematic Foods melanggar standar kebersihan pada 3 pengiriman terakhir. Inspeksi segera diperlukan.',
   'error', 'anomaly_alert', 7005, '/admin/anomalies/7005',
   true, 'Schedule Inspection', '/admin/anomalies/7005/investigate',
   false, NULL, false, NULL,
   '{"catering_id": 3004, "violation_count": 3, "health_risk": "medium", "priority": "high"}'::jsonb,
   NOW() - INTERVAL '12 hours', NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 6: UPDATE SEQUENCE VALUES
-- =============================================================================

-- Update sequences to prevent ID conflicts
SELECT setval('users_id_seq', 1100, true);
SELECT setval('admin_profiles_id_seq', 10, true);
SELECT setval('schools_id_seq', 2100, true);
SELECT setval('caterings_id_seq', 3100, true);
SELECT setval('budget_allocations_id_seq', 4100, true);
SELECT setval('allocations_id_seq', 5100, true);
SELECT setval('deliveries_id_seq', 6100, true);
SELECT setval('anomaly_alerts_id_seq', 7100, true);
-- Note: critical_anomalies uses auto-increment ID, sequence will be set automatically
SELECT setval('escrow_transactions_id_seq', 8100, true);
SELECT setval('blockchain_transaction_history_id_seq', 9100, true);
SELECT setval('ai_food_analyses_id_seq', 10100, true);
SELECT setval('verifications_id_seq', 11100, true);
SELECT setval('admin_activity_log_id_seq', 12100, true);
SELECT setval('government_notifications_id_seq', 13100, true);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify anomaly alerts
-- SELECT type, severity, title, status, catering_id FROM anomaly_alerts ORDER BY created_at DESC;

-- Verify escrow transactions
-- SELECT transaction_type, amount, status, blockchain_confirmed FROM escrow_transactions ORDER BY created_at DESC;

-- Verify AI analyses needing review
-- SELECT delivery_id, quality_score, needs_manual_review, manual_review_status FROM ai_food_analyses WHERE needs_manual_review = true ORDER BY created_at DESC;

-- =============================================================================
-- END OF SEEDING SCRIPT
-- =============================================================================
