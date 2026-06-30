-- =========================================================================
-- ResolveAI — Demo Seed Data
-- =========================================================================
-- Run this script AFTER schema.sql and migration.sql to populate the database
-- with realistic demo data for hackathon judging / evaluation purposes.
--
-- Demo Account:
--   Email: demo@resolveai.com
--   OTP:   123456  (in mock mode, any 6-digit code works)
--   Role:  admin
-- =========================================================================

-- ─── 1. DEMO USER PROFILES ──────────────────────────────────────────────────
-- NOTE: The demo user must first be created in Supabase Auth (auth.users).
-- In mock/local mode, the frontend handles this automatically.
-- For production Supabase, manually create an auth user via dashboard/API, 
-- then run this seed. The UUIDs below are deterministic for reproducibility.

-- Insert demo admin profile (Arjun Mehta)
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, reputation_score, bio, location, created_at)
VALUES (
  '00000000-demo-0001-0000-000000000001',
  'demo@resolveai.com',
  'Arjun Mehta',
  NULL,
  'admin',
  2450,
  'Community lead & civic technology advocate. Helping make Indian cities smarter and safer through data-driven issue resolution.',
  'New Delhi, India',
  NOW() - INTERVAL '180 days'
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  reputation_score = EXCLUDED.reputation_score,
  bio = EXCLUDED.bio;

-- Insert community citizen profiles (for comments, verifications, variety)
INSERT INTO public.profiles (id, email, full_name, role, reputation_score, location, created_at)
VALUES
  ('00000000-demo-0002-0000-000000000002', 'priya.sharma@example.com', 'Priya Sharma', 'citizen', 980, 'South Delhi, India', NOW() - INTERVAL '120 days'),
  ('00000000-demo-0003-0000-000000000003', 'rahul.verma@example.com', 'Rahul Verma', 'citizen', 650, 'Gurgaon, India', NOW() - INTERVAL '90 days'),
  ('00000000-demo-0004-0000-000000000004', 'sneha.patil@example.com', 'Sneha Patil', 'moderator', 1820, 'Pune, India', NOW() - INTERVAL '150 days'),
  ('00000000-demo-0005-0000-000000000005', 'amit.kumar@example.com', 'Amit Kumar', 'citizen', 430, 'Mumbai, India', NOW() - INTERVAL '60 days'),
  ('00000000-demo-0006-0000-000000000006', 'kavita.reddy@example.com', 'Kavita Reddy', 'citizen', 720, 'Bengaluru, India', NOW() - INTERVAL '100 days'),
  ('00000000-demo-0007-0000-000000000007', 'vikram.singh@example.com', 'Vikram Singh', 'citizen', 310, 'North Delhi, India', NOW() - INTERVAL '45 days'),
  ('00000000-demo-0008-0000-000000000008', 'ananya.joshi@example.com', 'Ananya Joshi', 'citizen', 560, 'Chennai, India', NOW() - INTERVAL '75 days')
ON CONFLICT (id) DO NOTHING;


-- ─── 2. CIVIC ISSUES (20 realistic reports) ─────────────────────────────────

INSERT INTO public.issues (id, title, description, category, status, risk_level, priority, location, latitude, longitude, user_id, upvotes, comments_count, resolved_at, created_at)
VALUES
-- Delhi issues
('10000000-0000-0000-0000-000000000001', 'Critical pothole on NH-48 near Gurgaon Toll',
 'Large pothole approximately 2 feet deep on the main carriageway of NH-48. Multiple vehicles have sustained tire damage. The pothole extends across the left lane and is especially dangerous at night due to poor lighting in this stretch.',
 'pothole', 'in_progress', 'critical', 94,
 'NH-48, Sector 31, Gurgaon', 28.4595, 77.0266,
 '00000000-demo-0001-0000-000000000001', 47, 5, NULL, NOW() - INTERVAL '2 days'),

('10000000-0000-0000-0000-000000000002', 'Sewage overflow at Saket Metro Station exit',
 'Sewage water has been flooding the south exit of Saket Metro Station for 3 days. The overflow is contaminating the pedestrian pathway and creating a health hazard. Municipal team was called but has not responded yet.',
 'water_leakage', 'prioritized', 'high', 89,
 'Saket District Centre, New Delhi', 28.5244, 77.2066,
 '00000000-demo-0002-0000-000000000002', 38, 4, NULL, NOW() - INTERVAL '4 days'),

('10000000-0000-0000-0000-000000000003', 'Water main burst near Connaught Place',
 'Underground water main has burst creating a growing sinkhole near Block A. Water pressure in surrounding buildings has dropped significantly. The area has been partially cordoned off by locals using makeshift barriers.',
 'water_leakage', 'reported', 'critical', 91,
 'Block A, Connaught Place, New Delhi', 28.6315, 77.2167,
 '00000000-demo-0001-0000-000000000001', 56, 7, NULL, NOW() - INTERVAL '12 hours'),

('10000000-0000-0000-0000-000000000004', 'Garbage dump overflowing at Chandni Chowk',
 'The community garbage collection point near Chandni Chowk market has not been cleared for over a week. Garbage is spilling onto the road and attracting stray animals. Strong odor affecting nearby shops and residents.',
 'garbage', 'in_progress', 'high', 73,
 'Chandni Chowk, Old Delhi', 28.6507, 77.2334,
 '00000000-demo-0007-0000-000000000007', 29, 3, NULL, NOW() - INTERVAL '3 days'),

('10000000-0000-0000-0000-000000000005', 'Open manhole cover missing at Sadar Bazaar',
 'Manhole cover is completely missing on the main pedestrian walkway near Sadar Bazaar market. Extremely dangerous for pedestrians, especially during evening hours. A child nearly fell in yesterday. Temporary barricade placed by shopkeepers.',
 'open_manhole', 'in_progress', 'critical', 92,
 'Sadar Bazaar, Delhi Cantonment', 28.6430, 77.1930,
 '00000000-demo-0003-0000-000000000003', 44, 6, NULL, NOW() - INTERVAL '36 hours'),

('10000000-0000-0000-0000-000000000006', 'Broken streetlights on Janpath Road',
 'Multiple streetlights non-functional on a 500-meter stretch of Janpath Road between Janpath Hotel and Connaught Place. The area becomes very dark after sunset, creating safety concerns for pedestrians and cyclists.',
 'broken_streetlight', 'assigned', 'medium', 65,
 'Janpath, New Delhi', 28.6266, 77.2182,
 '00000000-demo-0002-0000-000000000002', 22, 2, NULL, NOW() - INTERVAL '6 days'),

('10000000-0000-0000-0000-000000000007', 'Pothole cluster at Karol Bagh intersection',
 'Series of interconnected potholes near the main Karol Bagh market intersection. Two-wheelers are particularly affected. Several minor accidents reported in the past week.',
 'pothole', 'verified', 'high', 67,
 'Karol Bagh, New Delhi', 28.6514, 77.1907,
 '00000000-demo-0007-0000-000000000007', 27, 3, NULL, NOW() - INTERVAL '3 days'),

('10000000-0000-0000-0000-000000000008', 'Waterlogging at Minto Bridge underpass',
 'Chronic waterlogging at Minto Bridge underpass makes it completely impassable during monsoon season. Even light rain causes 2-3 feet of water accumulation. Traffic has to be diverted regularly.',
 'water_leakage', 'resolved', 'high', 38,
 'Minto Bridge, New Delhi', 28.6304, 77.2177,
 '00000000-demo-0001-0000-000000000001', 71, 9, NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days'),

('10000000-0000-0000-0000-000000000009', 'Illegal garbage dumping near Yamuna Bank',
 'Large-scale illegal dumping of construction debris and household waste near the Yamuna floodplains. Environmental hazard and potential groundwater contamination risk.',
 'garbage', 'assigned', 'high', 71,
 'Yamuna Bank, East Delhi', 28.6200, 77.2700,
 '00000000-demo-0003-0000-000000000003', 34, 4, NULL, NOW() - INTERVAL '7 days'),

('10000000-0000-0000-0000-000000000010', 'Broken park bench at Lodhi Garden',
 'Cast iron bench near the main walking path has broken, leaving sharp metal edges exposed. Risk of injury to visitors, especially children playing in the area.',
 'public_infrastructure_damage', 'reported', 'low', 28,
 'Lodhi Garden, New Delhi', 28.5916, 77.2193,
 '00000000-demo-0002-0000-000000000002', 9, 1, NULL, NOW() - INTERVAL '8 days'),

-- Mumbai issues
('10000000-0000-0000-0000-000000000011', 'Collapsed pavement near Juhu Beach Road',
 'Section of pavement on Juhu Tara Road has collapsed due to recent rains. Multiple vehicles have been damaged. The collapse extends about 3 meters across the road surface.',
 'road_damage', 'verified', 'high', 82,
 'Juhu Tara Road, Mumbai', 19.0988, 72.8267,
 '00000000-demo-0005-0000-000000000005', 31, 4, NULL, NOW() - INTERVAL '1 day'),

('10000000-0000-0000-0000-000000000012', 'Large pothole cluster at Andheri flyover',
 'Multiple deep potholes on the descent of Andheri flyover. Caused two minor accidents this week. BEST bus service has been rerouting around the area.',
 'pothole', 'resolved', 'high', 45,
 'Andheri Flyover, Mumbai', 19.1136, 72.8697,
 '00000000-demo-0005-0000-000000000005', 63, 8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 days'),

('10000000-0000-0000-0000-000000000013', 'Streetlight flickering on Marine Drive',
 'Heritage lamp posts along Marine Drive promenade are flickering intermittently. Several are completely non-functional. Affects the iconic nighttime experience and pedestrian safety.',
 'broken_streetlight', 'resolved', 'low', 32,
 'Marine Drive, Mumbai', 18.9440, 72.8233,
 '00000000-demo-0005-0000-000000000005', 18, 2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '21 days'),

('10000000-0000-0000-0000-000000000014', 'Road cave-in near Bandra-Worli Sea Link approach',
 'A section of the approach road to the Bandra-Worli Sea Link has caved in following heavy monsoon rains. The collapse is approximately 4 feet deep and 6 feet wide, forcing traffic into a single lane.',
 'road_damage', 'in_progress', 'critical', 86,
 'Bandra-Worli, Mumbai', 19.0330, 72.8166,
 '00000000-demo-0005-0000-000000000005', 52, 6, NULL, NOW() - INTERVAL '2 days'),

-- Pune issues
('10000000-0000-0000-0000-000000000015', 'Footpath tiles broken near FC Road',
 'Broken tiles on the pedestrian footpath along Fergusson College Road. Multiple sections are uneven, creating tripping hazards. Rain makes the area especially slippery and dangerous.',
 'public_infrastructure_damage', 'verified', 'medium', 58,
 'Fergusson College Road, Pune', 18.5233, 73.8412,
 '00000000-demo-0004-0000-000000000004', 15, 2, NULL, NOW() - INTERVAL '5 days'),

('10000000-0000-0000-0000-000000000016', 'Garbage overflow at Huda Market',
 'The municipal garbage bins at Huda City Centre market have been overflowing for the past 4 days. The waste is attracting rodents and creating unsanitary conditions near food stalls.',
 'garbage', 'prioritized', 'medium', 62,
 'Huda City Centre, Gurgaon', 28.4596, 77.0725,
 '00000000-demo-0003-0000-000000000003', 19, 2, NULL, NOW() - INTERVAL '4 days'),

('10000000-0000-0000-0000-000000000017', 'Damaged bus shelter at Kothrud Depot',
 'The bus shelter at Kothrud Depot has a collapsed roof panel. Commuters are exposed to rain and sun while waiting for buses. The glass panels are cracked and could shatter.',
 'public_infrastructure_damage', 'assigned', 'medium', 51,
 'Kothrud Depot, Pune', 18.5074, 73.8077,
 '00000000-demo-0004-0000-000000000004', 12, 1, NULL, NOW() - INTERVAL '9 days'),

-- Bengaluru issues
('10000000-0000-0000-0000-000000000018', 'Open manhole on Residency Road',
 'Manhole cover is missing near the intersection of Residency Road and Brigade Road. The opening is partially hidden by accumulated leaves and debris, making it extremely hazardous.',
 'open_manhole', 'prioritized', 'critical', 88,
 'Residency Road, Bengaluru', 12.9716, 77.5946,
 '00000000-demo-0006-0000-000000000006', 41, 5, NULL, NOW() - INTERVAL '1 day'),

('10000000-0000-0000-0000-000000000019', 'Road cave-in at Koramangala 4th Block',
 'Major road section has collapsed in Koramangala 4th Block following a pipeline burst. Water continues to seep from underground, worsening the damage. Traffic completely blocked in the area.',
 'road_damage', 'in_progress', 'critical', 86,
 '4th Block, Koramangala, Bengaluru', 12.9352, 77.6244,
 '00000000-demo-0006-0000-000000000006', 52, 7, NULL, NOW() - INTERVAL '2 days'),

('10000000-0000-0000-0000-000000000020', 'Garbage pile near Indiranagar 12th Main',
 'Municipal garbage collection has been inconsistent for the past week in Indiranagar. Large pile of mixed waste accumulating near the 12th Main junction. Strong odor affecting nearby apartments.',
 'garbage', 'assigned', 'medium', 64,
 'Indiranagar, Bengaluru', 12.9784, 77.6408,
 '00000000-demo-0006-0000-000000000006', 34, 3, NULL, NOW() - INTERVAL '7 days')

ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  upvotes = EXCLUDED.upvotes;


-- ─── 3. AI INSIGHTS (for each issue) ────────────────────────────────────────

INSERT INTO public.ai_insights (issue_id, category, severity, confidence, summary, impact, suggested_resolution, recommended_authority, recommended_action, estimated_urgency, mitigation_suggestions)
VALUES
('10000000-0000-0000-0000-000000000001', 'pothole', 88, 95.5, 'Deep pothole on major highway causing vehicle damage.', 'High traffic volume area, risk of accidents.', 'Emergency road repair with asphalt patching.', 'NHAI / PWD Gurgaon', 'Deploy emergency repair team within 24 hours.', 'Immediate', 'Place warning cones and temporary barricade until repair.'),
('10000000-0000-0000-0000-000000000002', 'water_leakage', 82, 92.0, 'Sewage overflow at public transit hub.', 'Health hazard for 15,000+ daily commuters.', 'Repair sewer line and install backflow prevention.', 'Delhi Jal Board', 'Deploy sewage emergency response team.', 'Urgent', 'Sanitize affected area and post health advisory.'),
('10000000-0000-0000-0000-000000000003', 'water_leakage', 90, 97.0, 'Underground water main burst creating sinkhole.', 'Water supply disruption to multiple blocks. Structural risk.', 'Emergency pipe replacement and road restoration.', 'Delhi Jal Board / NDMC', 'Shut off water main, deploy emergency repair.', 'Immediate', 'Cordon off area, arrange tanker water supply for affected buildings.'),
('10000000-0000-0000-0000-000000000005', 'open_manhole', 95, 98.0, 'Missing manhole cover in high-footfall market area.', 'Extreme pedestrian safety hazard, near-miss incident reported.', 'Replace manhole cover immediately.', 'MCD Delhi', 'Emergency replacement within 6 hours.', 'Immediate', 'Station a guard or place barricade until cover is installed.'),
('10000000-0000-0000-0000-000000000011', 'road_damage', 78, 91.5, 'Pavement collapse on main arterial road.', 'Vehicle damage, traffic bottleneck.', 'Excavate and rebuild road section.', 'BMC Mumbai', 'Deploy repair crew with heavy machinery.', 'Urgent', 'Divert traffic through alternate route.'),
('10000000-0000-0000-0000-000000000014', 'road_damage', 85, 94.0, 'Major road cave-in near critical infrastructure link.', 'Single-lane traffic causing massive congestion.', 'Full excavation and road reconstruction required.', 'BMC / MSRDC', 'Priority road reconstruction project.', 'Immediate', 'Implement contraflow traffic management.'),
('10000000-0000-0000-0000-000000000018', 'open_manhole', 92, 96.5, 'Missing manhole cover hidden by debris.', 'Extreme hazard, potential for serious injury.', 'Immediate cover replacement and debris clearing.', 'BBMP Bengaluru', 'Emergency cover placement within 4 hours.', 'Immediate', 'Clear surrounding debris, install reflective markers.'),
('10000000-0000-0000-0000-000000000019', 'road_damage', 87, 93.0, 'Road collapse from underground pipeline failure.', 'Complete traffic blockage, ongoing structural damage.', 'Pipeline repair followed by road reconstruction.', 'BWSSB / BBMP', 'Emergency pipeline and road repair.', 'Immediate', 'Establish alternate traffic route, monitor for further subsidence.')
ON CONFLICT DO NOTHING;


-- ─── 4. COMMENTS (realistic community discussions) ──────────────────────────

INSERT INTO public.comments (issue_id, user_id, content, upvotes, created_at)
VALUES
-- Comments on the NH-48 pothole
('10000000-0000-0000-0000-000000000001', '00000000-demo-0002-0000-000000000002', 'I drive through here daily. This pothole has been getting worse every week. My car''s alignment is already messed up because of this.', 8, NOW() - INTERVAL '1 day 6 hours'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0003-0000-000000000003', 'Saw an auto-rickshaw nearly flip over here yesterday. This is extremely dangerous during rush hour.', 12, NOW() - INTERVAL '1 day 2 hours'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0004-0000-000000000004', 'PWD team visited today morning. They said repair work will begin tomorrow. Fingers crossed! 🤞', 15, NOW() - INTERVAL '8 hours'),

-- Comments on Saket sewage overflow
('10000000-0000-0000-0000-000000000002', '00000000-demo-0001-0000-000000000001', 'This is a public health emergency. The smell is unbearable and people are getting sick. Delhi Jal Board needs to act NOW.', 14, NOW() - INTERVAL '3 days'),
('10000000-0000-0000-0000-000000000002', '00000000-demo-0007-0000-000000000007', 'I''ve filed a complaint with the municipal helpline as well. Reference number: DJB-2024-87432. Let''s follow up together.', 6, NOW() - INTERVAL '2 days'),

-- Comments on water main burst
('10000000-0000-0000-0000-000000000003', '00000000-demo-0002-0000-000000000002', 'Water supply has been disrupted to our entire building since this morning. Over 200 families affected!', 18, NOW() - INTERVAL '10 hours'),
('10000000-0000-0000-0000-000000000003', '00000000-demo-0003-0000-000000000003', 'The sinkhole is getting bigger. Someone needs to cordon this off properly before a vehicle falls in.', 22, NOW() - INTERVAL '8 hours'),
('10000000-0000-0000-0000-000000000003', '00000000-demo-0004-0000-000000000004', 'Municipal tanker has arrived for temporary water supply. DJB team expected by evening.', 9, NOW() - INTERVAL '4 hours'),

-- Comments on open manhole
('10000000-0000-0000-0000-000000000005', '00000000-demo-0001-0000-000000000001', 'A child almost fell into this yesterday evening. This is absolutely unacceptable! 😡', 25, NOW() - INTERVAL '30 hours'),
('10000000-0000-0000-0000-000000000005', '00000000-demo-0002-0000-000000000002', 'Shopkeepers have placed a temporary wooden board over it. But it''s not secure enough.', 11, NOW() - INTERVAL '24 hours'),
('10000000-0000-0000-0000-000000000005', '00000000-demo-0007-0000-000000000007', 'I''ve seen 3 different manholes uncovered in this area in the past month. There''s clearly a systemic maintenance issue.', 7, NOW() - INTERVAL '18 hours'),

-- Comments on Bandra-Worli road cave-in
('10000000-0000-0000-0000-000000000014', '00000000-demo-0005-0000-000000000005', 'Traffic is completely jammed because of this. My commute has gone from 30 mins to 2 hours.', 16, NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000014', '00000000-demo-0008-0000-000000000008', 'BMC has started repair work but it looks like it will take at least a week given the extent of damage.', 9, NOW() - INTERVAL '12 hours'),

-- Comments on Koramangala road cave-in
('10000000-0000-0000-0000-000000000019', '00000000-demo-0006-0000-000000000006', 'Water is still gushing out. BWSSB needs to fix the pipeline FIRST before any road repair can happen.', 20, NOW() - INTERVAL '1 day 8 hours'),
('10000000-0000-0000-0000-000000000019', '00000000-demo-0008-0000-000000000008', 'BBMP has put up diversion signs. Use 5th Block route as alternative for now.', 13, NOW() - INTERVAL '16 hours'),

-- Comments on resolved issues
('10000000-0000-0000-0000-000000000008', '00000000-demo-0001-0000-000000000001', 'Finally resolved after 3 years of complaints! The new drainage system looks solid. Let''s see how it holds during monsoon. 🎉', 32, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000012', '00000000-demo-0005-0000-000000000005', 'Road has been properly repaired with quality asphalt. Great response from BMC this time! 👏', 19, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;


-- ─── 5. ISSUE VERIFICATIONS (community verification actions) ─────────────────

INSERT INTO public.issue_verifications (issue_id, user_id, type, created_at)
VALUES
-- Verifications for high-priority issues
('10000000-0000-0000-0000-000000000001', '00000000-demo-0002-0000-000000000002', 'verify', NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0003-0000-000000000003', 'support', NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0006-0000-000000000006', 'support', NOW() - INTERVAL '18 hours'),
('10000000-0000-0000-0000-000000000003', '00000000-demo-0002-0000-000000000002', 'verify', NOW() - INTERVAL '10 hours'),
('10000000-0000-0000-0000-000000000003', '00000000-demo-0007-0000-000000000007', 'support', NOW() - INTERVAL '8 hours'),
('10000000-0000-0000-0000-000000000005', '00000000-demo-0001-0000-000000000001', 'verify', NOW() - INTERVAL '30 hours'),
('10000000-0000-0000-0000-000000000005', '00000000-demo-0002-0000-000000000002', 'support', NOW() - INTERVAL '24 hours'),
('10000000-0000-0000-0000-000000000005', '00000000-demo-0007-0000-000000000007', 'verify', NOW() - INTERVAL '20 hours'),
('10000000-0000-0000-0000-000000000014', '00000000-demo-0005-0000-000000000005', 'verify', NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000014', '00000000-demo-0008-0000-000000000008', 'support', NOW() - INTERVAL '12 hours'),
('10000000-0000-0000-0000-000000000018', '00000000-demo-0006-0000-000000000006', 'verify', NOW() - INTERVAL '20 hours'),
('10000000-0000-0000-0000-000000000019', '00000000-demo-0006-0000-000000000006', 'verify', NOW() - INTERVAL '1 day'),
('10000000-0000-0000-0000-000000000019', '00000000-demo-0008-0000-000000000008', 'support', NOW() - INTERVAL '16 hours')
ON CONFLICT DO NOTHING;


-- ─── 6. NOTIFICATIONS (for demo user) ───────────────────────────────────────

INSERT INTO public.notifications (user_id, issue_id, type, title, message, is_read, created_at)
VALUES
('00000000-demo-0001-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'issue_verified', 'Issue Verified', 'Your reported issue ''Critical pothole on NH-48'' has been verified by the community.', true, NOW() - INTERVAL '1 day'),
('00000000-demo-0001-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'issue_support', 'Issue Supported', 'Your reported issue ''Water main burst near Connaught Place'' received community support.', false, NOW() - INTERVAL '8 hours'),
('00000000-demo-0001-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'status_updated', 'Issue Resolved! 🎉', 'Great news! ''Waterlogging at Minto Bridge underpass'' has been marked as resolved.', true, NOW() - INTERVAL '5 days'),
('00000000-demo-0001-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'issue_verified', 'Nearby Issue Verified', 'An issue near your area ''Open manhole cover missing at Sadar Bazaar'' was verified by 3 citizens.', false, NOW() - INTERVAL '20 hours'),
('00000000-demo-0001-0000-000000000001', '10000000-0000-0000-0000-000000000014', 'issue_created', 'New Issue Reported Nearby', 'A new critical issue ''Road cave-in near Bandra-Worli Sea Link'' has been submitted in Mumbai.', false, NOW() - INTERVAL '2 days'),
('00000000-demo-0001-0000-000000000001', NULL, 'system', 'Weekly Community Report', 'This week: 24 new issues reported, 18 resolved, 6 verified. Community health score: 78/100.', true, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;


-- ─── 7. ACTIVITY LOGS (issue lifecycle transitions) ──────────────────────────

INSERT INTO public.activity_logs (issue_id, user_id, action, old_value, new_value, created_at)
VALUES
('10000000-0000-0000-0000-000000000001', '00000000-demo-0001-0000-000000000001', 'created', NULL, '{"status": "reported"}'::jsonb, NOW() - INTERVAL '2 days'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "reported"}'::jsonb, '{"status": "verified"}'::jsonb, NOW() - INTERVAL '1 day 18 hours'),
('10000000-0000-0000-0000-000000000001', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "verified"}'::jsonb, '{"status": "in_progress"}'::jsonb, NOW() - INTERVAL '1 day'),

('10000000-0000-0000-0000-000000000008', '00000000-demo-0001-0000-000000000001', 'created', NULL, '{"status": "reported"}'::jsonb, NOW() - INTERVAL '30 days'),
('10000000-0000-0000-0000-000000000008', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "reported"}'::jsonb, '{"status": "verified"}'::jsonb, NOW() - INTERVAL '28 days'),
('10000000-0000-0000-0000-000000000008', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "verified"}'::jsonb, '{"status": "prioritized"}'::jsonb, NOW() - INTERVAL '25 days'),
('10000000-0000-0000-0000-000000000008', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "prioritized"}'::jsonb, '{"status": "in_progress"}'::jsonb, NOW() - INTERVAL '15 days'),
('10000000-0000-0000-0000-000000000008', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "in_progress"}'::jsonb, '{"status": "resolved"}'::jsonb, NOW() - INTERVAL '5 days'),

('10000000-0000-0000-0000-000000000012', '00000000-demo-0005-0000-000000000005', 'created', NULL, '{"status": "reported"}'::jsonb, NOW() - INTERVAL '14 days'),
('10000000-0000-0000-0000-000000000012', '00000000-demo-0004-0000-000000000004', 'status_change', '{"status": "in_progress"}'::jsonb, '{"status": "resolved"}'::jsonb, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;


-- ─── 8. UPDATE COMMENT COUNTS ───────────────────────────────────────────────
-- Recalculate comments_count for all issues based on actual comment rows

UPDATE public.issues SET comments_count = (
  SELECT COUNT(*) FROM public.comments WHERE comments.issue_id = issues.id
);

-- =========================================================================
-- SEED COMPLETE
-- =========================================================================
-- Demo credentials:
--   Email: demo@resolveai.com
--   OTP:   123456 (any 6-digit code in mock mode)
--   Role:  admin (full access to dashboard, admin panel, moderation tools)
-- =========================================================================
