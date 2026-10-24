-- ============================================================================
-- PART – People At Right Time
-- Seed Data: System Configuration & Official Task Categories (Production)
-- No fake profiles, no fake tasks, no simulated dummy records.
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

-- 2. Official Task Categories (7 Core Categories with Bilingual Descriptions)
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
