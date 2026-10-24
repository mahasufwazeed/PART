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
} from '../types';

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

  currentUserId: string | null = null;

  constructor() {
    this.reset();
  }

  /**
   * Reset all in-memory collections to empty production state
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
    this.currentUserId = null;
  }
}

export const mockStore = new LocalMarketplaceStore();
