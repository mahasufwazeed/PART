import {
  Profile,
  Task,
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
  College,
  UserCollegeMembership,
} from '../types';
import { CHENNAI_COLLEGES } from '../constants/colleges';

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
  savedAddresses: Map<string, any> = new Map();
  workerLocations: Map<string, any> = new Map();
  colleges: Map<string, College> = new Map();
  collegeMemberships: Map<string, UserCollegeMembership> = new Map();

  currentUserId: string | null = null;

  constructor() {
    this.reset();
  }

  /**
   * Reset all in-memory collections and seed default colleges
   */
  reset() {
    this.profiles.clear();
    this.tasks.clear();
    this.locations.clear();
    this.applications.clear();
    this.assignments.clear();
    this.conversations.clear();
    this.messages.clear();
    this.payments.clear();
    this.reviews.clear();
    this.disputes.clear();
    this.reports.clear();
    this.notifications.clear();
    this.savedAddresses.clear();
    this.workerLocations.clear();
    this.colleges.clear();
    this.collegeMemberships.clear();
    this.currentUserId = null;

    // Seed initial Chennai colleges
    CHENNAI_COLLEGES.forEach((c) => {
      this.colleges.set(c.id, {
        id: c.id,
        name: c.name,
        short_name: c.short_name,
        city: c.city,
        locality: c.locality,
        domains: c.domains,
        popular_spots: c.popular_spots,
        accent_color: c.accent_color,
        badge_bg: c.badge_bg,
        emoji: c.emoji,
        is_verified: true,
        created_at: new Date().toISOString(),
      });
    });
  }
}

export const mockStore = new LocalMarketplaceStore();
