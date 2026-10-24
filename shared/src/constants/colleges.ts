/**
 * PART – People At Right Time
 * Campus Community Constants & Universities
 */

export interface CollegeDef {
  id: string;
  name: string;
  short_name: string;
  city: string;
  locality: string;
  domains: string[];
  popular_spots: string[];
  accent_color: string;
  badge_bg: string;
  emoji: string;
}

export const CHENNAI_COLLEGES: CollegeDef[] = [
  {
    id: 'vels-university',
    name: 'VELS Institute of Science, Technology & Advanced Studies (VISTAS)',
    short_name: 'VELS University',
    city: 'Chennai',
    locality: 'Pallavaram',
    domains: ['velsuniv.ac.in', 'vels.ac.in'],
    popular_spots: [
      'Main Canteen',
      'Central Library',
      'Engineering Block',
      'Pharmacy Block',
      'Hostel Block 1',
      'Auditorium',
    ],
    accent_color: '#15803D',
    badge_bg: '#DCFCE7',
    emoji: '🎓',
  },
  {
    id: 'anna-university',
    name: 'Anna University (CEG, ACTech, SAP Campus)',
    short_name: 'Anna University',
    city: 'Chennai',
    locality: 'Guindy',
    domains: ['annauniv.edu', 'ceg.annauniv.edu'],
    popular_spots: [
      'CEG Red Building',
      'Central Library',
      'Main Canteen',
      'Knowledge Park',
      'Snack Shack',
      'Alagappa Tech Block',
    ],
    accent_color: '#B45309',
    badge_bg: '#FEF3C7',
    emoji: '🏛️',
  },
  {
    id: 'srm-university',
    name: 'SRM Institute of Science and Technology',
    short_name: 'SRM University',
    city: 'Chennai',
    locality: 'Kattankulathur',
    domains: ['srmist.edu.in', 'srmuniv.ac.in'],
    popular_spots: [
      'Tech Park',
      'University Building (UB)',
      'Java Canteen',
      'Central Library',
      'Clock Tower',
      'Hostel Gate',
    ],
    accent_color: '#0369A1',
    badge_bg: '#E0F2FE',
    emoji: '🚀',
  },
  {
    id: 'sathyabama-university',
    name: 'Sathyabama Institute of Science and Technology',
    short_name: 'Sathyabama University',
    city: 'Chennai',
    locality: 'Jeppiaar Nagar, OMR',
    domains: ['sathyabama.ac.in'],
    popular_spots: [
      'Central Library',
      'Student Mess Hall',
      'Dental College Block',
      'Aero Lab',
      'Main Gate Point',
    ],
    accent_color: '#7C3AED',
    badge_bg: '#EDE9FE',
    emoji: '📘',
  },
  {
    id: 'hindustan-university',
    name: 'Hindustan Institute of Technology and Science (HITS)',
    short_name: 'Hindustan University',
    city: 'Chennai',
    locality: 'Padur, OMR',
    domains: ['hindustanuniv.ac.in'],
    popular_spots: [
      'Aviation Hangar',
      'Founders Block Canteen',
      'Main Library',
      'Mechanical Bay',
    ],
    accent_color: '#BE123C',
    badge_bg: '#FFE4E6',
    emoji: '✈️',
  },
  {
    id: 'loyola-college',
    name: 'Loyola College (Autonomous)',
    short_name: 'Loyola College',
    city: 'Chennai',
    locality: 'Nungambakkam',
    domains: ['loyolacollege.edu'],
    popular_spots: [
      'Main Quadrangle',
      'Jubilee Building',
      'College Canteen',
      'Bertram Hall',
    ],
    accent_color: '#C2410C',
    badge_bg: '#FFEDD5',
    emoji: '📚',
  },
  {
    id: 'mcc-college',
    name: 'Madras Christian College (MCC)',
    short_name: 'Madras Christian College',
    city: 'Chennai',
    locality: 'Tambaram',
    domains: ['mcc.edu.in'],
    popular_spots: [
      'Anderson Hall',
      'The Gutters Pavilion',
      'College Cafeteria',
      'Heber Hall',
    ],
    accent_color: '#0F766E',
    badge_bg: '#CCFBF1',
    emoji: '🌿',
  },
];

export interface CampusCategoryDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  suggested_rates: string;
}

export const CAMPUS_TASK_CATEGORIES: CampusCategoryDef[] = [
  {
    id: 'ppt_design',
    name: 'PPT & Poster Design',
    icon: 'Presentation',
    description: 'Presentation slide formatting, Canva posters, college fest banners',
    suggested_rates: '₹150 – ₹400',
  },
  {
    id: 'notes_printing',
    name: 'Notes & Document Printing',
    icon: 'Printer',
    description: 'Xerox / printout delivery, syllabus notes pickup, binding',
    suggested_rates: '₹50 – ₹150',
  },
  {
    id: 'tutoring_coding',
    name: 'Peer Tutoring & Lab Help',
    icon: 'Code',
    description: 'Concept clarification, Java/Python doubt clearing, exam prep tips',
    suggested_rates: '₹200 – ₹500',
  },
  {
    id: 'event_help',
    name: 'Campus Event Assistance',
    icon: 'Calendar',
    description: 'Symposium coordination, registration desk, sound check, logistics',
    suggested_rates: '₹300 – ₹800',
  },
  {
    id: 'materials_errands',
    name: 'Materials & Campus Errands',
    icon: 'Package',
    description: 'Hardware store component pickup, lab chart paper, canteen parcel',
    suggested_rates: '₹100 – ₹250',
  },
  {
    id: 'study_group',
    name: 'Study Group & Revision',
    icon: 'Users',
    description: 'Collaborative revision sessions, library seat booking, group study',
    suggested_rates: '₹100 – ₹250',
  },
];
