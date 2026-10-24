-- ============================================================================
-- PART – People At Right Time
-- Seed Data: Chennai Localities, Default Settings, Categories & Realistic Tasks
-- ============================================================================

-- 1. Platform Settings
INSERT INTO public.platform_settings (
    platform_fee_percent,
    currency,
    support_phone,
    support_email,
    min_task_budget_inr,
    max_task_budget_inr
) VALUES (
    10.00,
    'INR',
    '+91 44 2827 0000',
    'support@part-app.in',
    50.00,
    50000.00
) ON CONFLICT DO NOTHING;

-- 2. Task Categories (7 Core Categories with Bilingual Descriptions)
INSERT INTO public.task_categories (id, slug, name_en, name_ta, description_en, description_ta, icon, display_order, safety_guidelines)
VALUES
(
    '11111111-1111-4111-8111-111111111111',
    'delivery-pickup',
    'Delivery & Pickup',
    'டெலிவரி & பிக்கப்',
    'Parcel pickup, grocery runs, documents, and errands across town.',
    'பார்சல் மற்றும் மளிகை பொருட்கள் டெலிவரி தேவைகள்.',
    'Package',
    1,
    '["Never transport hazardous, sealed unknown containers, or illegal contraband.", "Inspect package seal before accepting delivery tasks.", "Take a photo of delivery receipt upon drop-off."]'::jsonb
),
(
    '22222222-2222-4222-8222-222222222222',
    'home-assistance',
    'Home Assistance',
    'வீட்டு உதவிகள்',
    'Moving small items, basic cleaning, furniture assembly, and organizing.',
    'வீட்டு உபயோக பொருட்கள் மாற்றுதல் மற்றும் சுத்தம் செய்தல்.',
    'Home',
    2,
    '["Ensure someone else is present at the location for residential tasks.", "Confirm scope of heavy lifting beforehand to prevent injury."]'::jsonb
),
(
    '33333333-3333-4333-8333-333333333333',
    'college-student-tasks',
    'College & Student Tasks',
    'கல்லூரி & மாணவர் பணிகள்',
    'Event assistance, campus errands, document printing, and tutoring.',
    'கல்லூரி நிகழ்வுகள், பிரின்டிங் மற்றும் பாடக் கற்பித்தல் பணிகள்.',
    'GraduationCap',
    3,
    '["Academic integrity policy: No surrogate exam-taking or unethical assignment writing.", "Public campus meetup spots recommended."]'::jsonb
),
(
    '44444444-4444-4444-8444-444444444444',
    'technology',
    'Technology & IT',
    'தொழில்நுட்பம்',
    'Computer setup, Wi-Fi troubleshooting, software installation, website help.',
    'கணினி அமைவு, மென்பொருள் நிறுவுதல் மற்றும் தொழில்நுட்ப உதவி.',
    'Cpu',
    4,
    '["Never share root passwords or banking credentials.", "Backup critical data before starting hardware or OS operations."]'::jsonb
),
(
    '55555555-5555-4555-8555-555555555555',
    'events',
    'Events & Functions',
    'நிகழ்வுகள்',
    'Photography assistance, event setup, registration desk, and coordination.',
    'நிகழ்ச்சி ஒருங்கிணைப்பு, புகைப்படம் எடுத்தல் உதவி.',
    'Calendar',
    5,
    '["Verify event venue and contact organizer beforehand.", "Ensure clear agreement on event work duration and rest breaks."]'::jsonb
),
(
    '66666666-6666-4666-8666-666666666666',
    'business-assistance',
    'Business Assistance',
    'வணிக உதவிகள்',
    'Inventory counting, store assistance, data entry, and local surveys.',
    'சரக்கு கணக்கெடுப்பு, கடை உதவி மற்றும் தரவு உள்ளீடு.',
    'Briefcase',
    6,
    '["Confirm business credentials and commercial workspace legitimacy.", "Respect confidentiality and non-disclosure requirements."]'::jsonb
),
(
    '77777777-7777-4777-8777-777777777777',
    'other-tasks',
    'Other Tasks',
    'இதர பணிகள்',
    'Custom errands and assistance requiring moderation.',
    'இதர அனுமதிக்கப்பட்ட உடனடி தேவைகள்.',
    'MoreHorizontal',
    7,
    '["All custom tasks are subject to automated safety moderation.", "Strictly prohibits illegal goods, drugs, or hazardous materials."]'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET
    name_en = EXCLUDED.name_en,
    name_ta = EXCLUDED.name_ta,
    description_en = EXCLUDED.description_en,
    description_ta = EXCLUDED.description_ta,
    icon = EXCLUDED.icon;

-- 3. Mock User Profiles for Local Testing & Demos
-- Profile 1: Requester (Karthik S - Anna Nagar)
INSERT INTO public.profiles (
    id, full_name, phone, preferred_language, city, general_location,
    is_admin, is_worker_available, verification_status, rating_as_requester, total_reviews_as_requester
) VALUES (
    'a1111111-1111-4111-8111-111111111111',
    'Karthik Subramanian',
    '+919840123456',
    'en',
    'Chennai',
    'Anna Nagar, Chennai',
    false,
    true,
    'verified',
    4.90,
    14
) ON CONFLICT (id) DO NOTHING;

-- Profile 2: Worker (Ananya R - Velachery)
INSERT INTO public.profiles (
    id, full_name, phone, preferred_language, city, general_location,
    is_admin, is_worker_available, verification_status, rating_as_worker, total_reviews_as_worker, completed_tasks_as_worker
) VALUES (
    'b2222222-2222-4222-8222-222222222222',
    'Ananya Ramaswamy',
    '+919840987654',
    'ta',
    'Chennai',
    'Velachery, Chennai',
    false,
    true,
    'verified',
    4.95,
    28,
    30
) ON CONFLICT (id) DO NOTHING;

-- Profile 3: Platform Admin (Arun Kumar)
INSERT INTO public.profiles (
    id, full_name, phone, preferred_language, city, general_location,
    is_admin, is_worker_available, verification_status
) VALUES (
    'c3333333-3333-4333-8333-333333333333',
    'Arun Kumar (CTO / Admin)',
    '+919840000001',
    'en',
    'Chennai',
    'T. Nagar, Chennai',
    true,
    false,
    'verified'
) ON CONFLICT (id) DO NOTHING;

-- 4. Initial Sample Tasks in Chennai
-- Task A: Parcel Pickup in Anna Nagar
INSERT INTO public.tasks (
    id, requester_id, category_id, title, description, budget_inr,
    estimated_duration_minutes, preferred_date, preferred_time_window,
    required_workers_count, assigned_workers_count, required_skills, status
) VALUES (
    'fa000000-0000-4000-8000-000000000001',
    'a1111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Pick up medicine parcel from Apollo Pharmacy',
    'Need someone to pick up paid prescription medicines from Apollo Pharmacy (Roundtana) and deliver to 4th Avenue, Anna Nagar. Parcel is prepaid with invoice.',
    200.00,
    30,
    CURRENT_DATE,
    'Morning 10:00 AM - 12:00 PM',
    1,
    0,
    '["Two-wheeler", "Reliable delivery"]'::jsonb,
    'OPEN'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_locations (
    task_id, city, locality, address_approximate, address_exact, latitude, longitude, postal_code
) VALUES (
    'fa000000-0000-4000-8000-000000000001',
    'Chennai',
    'Anna Nagar',
    'Near Anna Nagar Roundtana, 2nd Avenue',
    'Flat 3B, Sunshine Apartments, 4th Avenue, Anna Nagar East',
    13.0850,
    80.2101,
    '600040'
) ON CONFLICT (task_id) DO NOTHING;

-- Task B: Moving Study Furniture in Velachery
INSERT INTO public.tasks (
    id, requester_id, category_id, title, description, budget_inr,
    estimated_duration_minutes, preferred_date, preferred_time_window,
    required_workers_count, assigned_workers_count, required_skills, status
) VALUES (
    'fa000000-0000-4000-8000-000000000002',
    'a1111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Help move 2 study desks & assemble chair',
    'Moving two wooden study tables from ground floor to 1st floor and assembling one ergonomic chair. Tools provided at spot.',
    450.00,
    60,
    CURRENT_DATE + 1,
    'Evening 4:00 PM - 6:00 PM',
    1,
    0,
    '["Furniture lifting", "Tool handling"]'::jsonb,
    'OPEN'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_locations (
    task_id, city, locality, address_approximate, address_exact, latitude, longitude, postal_code
) VALUES (
    'fa000000-0000-4000-8000-000000000002',
    'Chennai',
    'Velachery',
    'Near Phoenix Marketcity Mall',
    'Door 14, 5th Cross Street, Dhandeeswaram Nagar, Velachery',
    12.9815,
    80.2180,
    '600042'
) ON CONFLICT (task_id) DO NOTHING;

-- Task C: Wi-Fi & Printer Network Troubleshooting in OMR
INSERT INTO public.tasks (
    id, requester_id, category_id, title, description, budget_inr,
    estimated_duration_minutes, preferred_date, preferred_time_window,
    required_workers_count, assigned_workers_count, required_skills, status
) VALUES (
    'fa000000-0000-4000-8000-000000000003',
    'a1111111-1111-4111-8111-111111111111',
    '44444444-4444-4444-8444-444444444444',
    'Setup Wi-Fi mesh router and network printer',
    'Need help configuring an Airtel fiber mesh router extender and connecting an HP wireless laser printer for home office.',
    350.00,
    45,
    CURRENT_DATE,
    'Afternoon 2:00 PM - 4:00 PM',
    1,
    0,
    '["Wi-Fi troubleshooting", "Printer setup"]'::jsonb,
    'OPEN'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_locations (
    task_id, city, locality, address_approximate, address_exact, latitude, longitude, postal_code
) VALUES (
    'fa000000-0000-4000-8000-000000000003',
    'Chennai',
    'OMR - Thoraipakkam',
    'Near ASV Suntech Park, OMR',
    'Tower 4, 8th Floor, Hiranandani Parks, Thoraipakkam',
    12.9368,
    80.2289,
    '600097'
) ON CONFLICT (task_id) DO NOTHING;
