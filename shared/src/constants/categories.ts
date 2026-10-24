export interface CategoryDef {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  description_en: string;
  description_ta: string;
  icon: string;
  subcategories: string[];
  safety_guidelines: string[];
}

export const TASK_CATEGORIES: CategoryDef[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'delivery-pickup',
    name_en: 'Delivery & Pickup',
    name_ta: 'டெலிவரி & பிக்கப்',
    description_en: 'Parcel pickup, grocery runs, documents, and errands across town.',
    description_ta: 'பார்சல் மற்றும் மளிகை பொருட்கள் டெலிவரி தேவைகள்.',
    icon: 'Package',
    subcategories: [
      'Parcel pickup',
      'Grocery pickup',
      'Document delivery',
      'Local errands',
    ],
    safety_guidelines: [
      'Never transport hazardous, sealed unknown containers, or illegal contraband.',
      'Inspect package seal before accepting delivery tasks.',
      'Take a photo of delivery receipt upon drop-off.',
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'home-assistance',
    name_en: 'Home Assistance',
    name_ta: 'வீட்டு உதவிகள்',
    description_en: 'Moving small items, basic cleaning, furniture assembly, and organizing.',
    description_ta: 'வீட்டு உபயோக பொருட்கள் மாற்றுதல் மற்றும் சுத்தம் செய்தல்.',
    icon: 'Home',
    subcategories: [
      'Moving small items',
      'Basic cleaning',
      'Furniture assembly',
      'Household organization',
    ],
    safety_guidelines: [
      'Ensure someone else is present at the location for residential tasks.',
      'Confirm scope of heavy lifting beforehand to prevent injury.',
      'Never handle exposed high-voltage electrical or dangerous plumbing work without professional license.',
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'college-student-tasks',
    name_en: 'College & Student Tasks',
    name_ta: 'கல்லூரி & மாணவர் பணிகள்',
    description_en: 'Event assistance, campus errands, document printing, and tutoring.',
    description_ta: 'கல்லூரி நிகழ்வுகள், பிரின்டிங் மற்றும் பாடக் கற்பித்தல் பணிகள்.',
    icon: 'GraduationCap',
    subcategories: [
      'Event assistance',
      'Campus errands',
      'Printing & document collection',
      'Project setup assistance',
      'Tutoring',
    ],
    safety_guidelines: [
      'Academic integrity policy: No surrogate exam-taking or unethical assignment writing.',
      'Public campus meetup spots recommended.',
    ],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'technology',
    name_en: 'Technology & IT',
    name_ta: 'தொழில்நுட்பம்',
    description_en: 'Computer setup, Wi-Fi troubleshooting, software installation, website help.',
    description_ta: 'கணினி அமைவு, மென்பொருள் நிறுவுதல் மற்றும் தொழில்நுட்ப உதவி.',
    icon: 'Cpu',
    subcategories: [
      'Computer setup',
      'Basic troubleshooting',
      'Software installation',
      'Website assistance',
    ],
    safety_guidelines: [
      'Never share root passwords or banking credentials.',
      'Backup critical data before starting hardware or OS operations.',
    ],
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'events',
    name_en: 'Events & Functions',
    name_ta: 'நிகழ்வுகள்',
    description_en: 'Photography assistance, event setup, registration desk, and coordination.',
    description_ta: 'நிகழ்ச்சி ஒருங்கிணைப்பு, புகைப்படம் எடுத்தல் உதவி.',
    icon: 'Calendar',
    subcategories: [
      'Photography assistance',
      'Event setup',
      'Registration desk assistance',
      'Event coordination',
    ],
    safety_guidelines: [
      'Verify event venue and contact organizer beforehand.',
      'Ensure clear agreement on event work duration and rest breaks.',
    ],
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    slug: 'business-assistance',
    name_en: 'Business Assistance',
    name_ta: 'வணிக உதவிகள்',
    description_en: 'Inventory counting, store assistance, data entry, and local surveys.',
    description_ta: 'சரக்கு கணக்கெடுப்பு, கடை உதவி மற்றும் தரவு உள்ளீடு.',
    icon: 'Briefcase',
    subcategories: [
      'Inventory counting',
      'Store assistance',
      'Data entry',
      'Local survey assistance',
    ],
    safety_guidelines: [
      'Confirm business credentials and commercial workspace legitimacy.',
      'Respect confidentiality and non-disclosure requirements.',
    ],
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    slug: 'other-tasks',
    name_en: 'Other Tasks',
    name_ta: 'இதர பணிகள்',
    description_en: 'Custom errands and assistance requiring moderation.',
    description_ta: 'இதர அனுமதிக்கப்பட்ட உடனடி தேவைகள்.',
    icon: 'MoreHorizontal',
    subcategories: ['Custom errand', 'Line waiting', 'Pet walking assistance'],
    safety_guidelines: [
      'All custom tasks are subject to automated safety moderation.',
      'Strictly prohibits medical procedures, weapons, illegal transport, or personal privacy violations.',
    ],
  },
];
