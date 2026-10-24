import {
  Profile,
  Task,
  TaskCategory,
  TaskLocation,
  TaskApplication,
  TaskAssignment,
  Conversation,
  Message,
  Payment,
  Review,
  Dispute,
  Report,
  Notification,
} from '../types';
import { TASK_CATEGORIES } from '../constants/categories';

export class LocalMarketplaceStore {
  profiles: Map<string, Profile> = new Map();
  tasks: Map<string, Task> = new Map();
  locations: Map<string, TaskLocation> = new Map();
  applications: Map<string, TaskApplication> = new Map();
  assignments: Map<string, TaskAssignment> = new Map();
  conversations: Map<string, Conversation> = new Map();
  messages: Map<string, Message> = new Map();
  payments: Map<string, Payment> = new Map();
  reviews: Map<string, Review> = new Map();
  disputes: Map<string, Dispute> = new Map();
  reports: Map<string, Report> = new Map();
  notifications: Map<string, Notification> = new Map();

  currentUserId: string = 'a1111111-1111-4111-8111-111111111111'; // Default to Karthik

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed Profiles
    const karthik: Profile = {
      id: 'a1111111-1111-4111-8111-111111111111',
      full_name: 'Karthik Subramanian',
      phone: '+919840123456',
      avatar_url: null,
      bio: 'Resident in Anna Nagar, tech worker needing reliable neighborhood help.',
      preferred_language: 'en',
      city: 'Chennai',
      general_location: 'Anna Nagar, Chennai',
      is_admin: false,
      is_worker_available: true,
      verification_status: 'verified',
      rating_as_worker: 5.0,
      total_reviews_as_worker: 2,
      completed_tasks_as_worker: 2,
      rating_as_requester: 4.9,
      total_reviews_as_requester: 14,
      completed_tasks_as_requester: 16,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ananya: Profile = {
      id: 'b2222222-2222-4222-8222-222222222222',
      full_name: 'Ananya Ramaswamy',
      phone: '+919840987654',
      avatar_url: null,
      bio: 'Velachery resident & college graduate. Punctual, verified delivery & errand assistant.',
      preferred_language: 'ta',
      city: 'Chennai',
      general_location: 'Velachery, Chennai',
      is_admin: false,
      is_worker_available: true,
      verification_status: 'verified',
      rating_as_worker: 4.95,
      total_reviews_as_worker: 28,
      completed_tasks_as_worker: 30,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 4,
      completed_tasks_as_requester: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const arunAdmin: Profile = {
      id: 'c3333333-3333-4333-8333-333333333333',
      full_name: 'Arun Kumar (Platform Admin)',
      phone: '+919840000001',
      avatar_url: null,
      bio: 'PART System Supervisor & Community Trust Lead.',
      preferred_language: 'en',
      city: 'Chennai',
      general_location: 'T. Nagar, Chennai',
      is_admin: true,
      is_worker_available: false,
      verification_status: 'verified',
      rating_as_worker: 5.0,
      total_reviews_as_worker: 0,
      completed_tasks_as_worker: 0,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 0,
      completed_tasks_as_requester: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.set(karthik.id, karthik);
    this.profiles.set(ananya.id, ananya);
    this.profiles.set(arunAdmin.id, arunAdmin);

    // Seed Initial Tasks in Chennai
    const task1: Task = {
      id: 'fa000000-0000-4000-8000-000000000001',
      requester_id: karthik.id,
      category_id: TASK_CATEGORIES[0].id,
      title: 'Pick up medicine parcel from Apollo Pharmacy',
      description:
        'Need someone to pick up paid prescription medicines from Apollo Pharmacy (Roundtana) and deliver to 4th Avenue, Anna Nagar. Parcel is prepaid with invoice.',
      budget_inr: 200,
      estimated_duration_minutes: 30,
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time_window: 'Morning 10:00 AM - 12:00 PM',
      required_workers_count: 1,
      assigned_workers_count: 0,
      required_skills: ['Two-wheeler', 'Reliable delivery'],
      special_instructions: 'Handle medicine packet carefully.',
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const loc1: TaskLocation = {
      id: 'loc-1',
      task_id: task1.id,
      city: 'Chennai',
      locality: 'Anna Nagar',
      address_approximate: 'Near Anna Nagar Roundtana, 2nd Avenue',
      address_exact: 'Flat 3B, Sunshine Apartments, 4th Avenue, Anna Nagar East',
      latitude: 13.085,
      longitude: 80.2101,
      postal_code: '600040',
      created_at: new Date().toISOString(),
    };

    const task2: Task = {
      id: 'fa000000-0000-4000-8000-000000000002',
      requester_id: karthik.id,
      category_id: TASK_CATEGORIES[1].id,
      title: 'Help move 2 study desks & assemble chair',
      description:
        'Moving two wooden study tables from ground floor to 1st floor and assembling one ergonomic chair. Tools provided at spot.',
      budget_inr: 450,
      estimated_duration_minutes: 60,
      preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      preferred_time_window: 'Evening 4:00 PM - 6:00 PM',
      required_workers_count: 1,
      assigned_workers_count: 0,
      required_skills: ['Furniture lifting', 'Tool handling'],
      special_instructions: 'No heavy appliances, only 2 wooden desks.',
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const loc2: TaskLocation = {
      id: 'loc-2',
      task_id: task2.id,
      city: 'Chennai',
      locality: 'Velachery',
      address_approximate: 'Near Phoenix Marketcity Mall, Velachery',
      address_exact: 'Door 14, 5th Cross Street, Dhandeeswaram Nagar, Velachery',
      latitude: 12.9815,
      longitude: 80.218,
      postal_code: '600042',
      created_at: new Date().toISOString(),
    };

    const task3: Task = {
      id: 'fa000000-0000-4000-8000-000000000003',
      requester_id: karthik.id,
      category_id: TASK_CATEGORIES[3].id,
      title: 'Setup Wi-Fi mesh router and network printer',
      description:
        'Need help configuring an Airtel fiber mesh router extender and connecting an HP wireless laser printer for home office.',
      budget_inr: 350,
      estimated_duration_minutes: 45,
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time_window: 'Afternoon 2:00 PM - 4:00 PM',
      required_workers_count: 1,
      assigned_workers_count: 0,
      required_skills: ['Wi-Fi troubleshooting', 'Printer setup'],
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const loc3: TaskLocation = {
      id: 'loc-3',
      task_id: task3.id,
      city: 'Chennai',
      locality: 'OMR - Thoraipakkam',
      address_approximate: 'Near ASV Suntech Park, OMR',
      address_exact: 'Tower 4, 8th Floor, Hiranandani Parks, Thoraipakkam',
      latitude: 12.9368,
      longitude: 80.2289,
      postal_code: '600097',
      created_at: new Date().toISOString(),
    };

    this.tasks.set(task1.id, task1);
    this.locations.set(task1.id, loc1);

    this.tasks.set(task2.id, task2);
    this.locations.set(task2.id, loc2);

    this.tasks.set(task3.id, task3);
    this.locations.set(task3.id, loc3);
  }
}

export const mockStore = new LocalMarketplaceStore();
