import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebaseClient';
import { Profile } from '../types';
import { mockStore } from '../supabase/mockStore';

export const firebaseAuthService = {
  isConfigured(): boolean {
    return isFirebaseConfigured() && Boolean(auth) && Boolean(db);
  },

  /**
   * Listen to Firebase Auth state changes and load profile from Firestore
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null, profile: Profile | null) => void): () => void {
    if (!this.isConfigured() || !auth) {
      // In offline/mock mode, return no-op unlistener
      return () => {};
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null, null);
        return;
      }

      let profile: Profile | null = null;
      if (db) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (profileDoc.exists()) {
            profile = profileDoc.data() as Profile;
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile:', err);
        }
      }

      callback(user, profile);
    });
  },

  /**
   * Google Sign-In with Firebase Authentication
   */
  async signInWithGoogle(): Promise<{ profile?: Profile; error?: string }> {
    if (!this.isConfigured() || !auth || !googleProvider) {
      return {
        error:
          'Firebase Authentication is not yet configured. Please set your Firebase keys in .env.local to enable live Google Sign-In.',
      };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let profile: Profile | null = null;
      if (db) {
        const ref = doc(db, 'profiles', user.uid);
        const existing = await getDoc(ref);

        if (existing.exists()) {
          profile = existing.data() as Profile;
        } else {
          profile = {
            id: user.uid,
            full_name: user.displayName || 'Google Student',
            email: user.email || '',
            phone: user.phoneNumber || null,
            avatar_url: user.photoURL || null,
            bio: null,
            default_role: 'poster',
            preferred_language: 'en',
            city: 'Chennai',
            general_location: 'Campus Hub',
            is_admin: false,
            verification_status: 'unverified',
            is_worker_available: true,
            rating_as_worker: 5.0,
            total_reviews_as_worker: 0,
            completed_tasks_as_worker: 0,
            rating_as_requester: 5.0,
            total_reviews_as_requester: 0,
            completed_tasks_as_requester: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await setDoc(ref, profile);
        }
      }

      if (profile) {
        mockStore.profiles.set(profile.id, profile);
        mockStore.currentUserId = profile.id;
      }

      return { profile: profile || undefined };
    } catch (err: any) {
      return { error: err.message || 'Google sign-in failed via Firebase.' };
    }
  },

  /**
   * Email/Password Login with Firebase
   */
  async loginWithEmail(
    email: string,
    pass: string
  ): Promise<{ profile?: Profile; error?: string }> {
    if (!this.isConfigured() || !auth) {
      return {
        error:
          'Firebase is not configured. Add your Firebase keys in .env.local or use 1-Click Demo Login.',
      };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      let profile: Profile | null = null;

      if (db) {
        const ref = doc(db, 'profiles', cred.user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          profile = snap.data() as Profile;
        }
      }

      if (!profile) {
        profile = {
          id: cred.user.uid,
          full_name: cred.user.displayName || email.split('@')[0],
          email,
          phone: null,
          avatar_url: null,
          bio: null,
          default_role: 'poster',
          preferred_language: 'en',
          city: 'Chennai',
          general_location: 'Campus Hub',
          is_admin: false,
          verification_status: 'unverified',
          is_worker_available: true,
          rating_as_worker: 5.0,
          total_reviews_as_worker: 0,
          completed_tasks_as_worker: 0,
          rating_as_requester: 5.0,
          total_reviews_as_requester: 0,
          completed_tasks_as_requester: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (db) {
          await setDoc(doc(db, 'profiles', cred.user.uid), profile);
        }
      }

      mockStore.profiles.set(profile.id, profile);
      mockStore.currentUserId = profile.id;

      return { profile };
    } catch (err: any) {
      return { error: err.message || 'Firebase login failed.' };
    }
  },

  /**
   * Email/Password Signup with Firebase & Firestore Profile
   */
  async registerWithEmail(
    email: string,
    pass: string,
    fullName: string,
    phone?: string,
    language: 'en' | 'ta' = 'en'
  ): Promise<{ profile?: Profile; error?: string }> {
    if (!this.isConfigured() || !auth) {
      return {
        error:
          'Firebase is not configured. Add your Firebase keys in .env.local to enable live registration.',
      };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      try {
        await updateFirebaseProfile(cred.user, { displayName: fullName });
      } catch {}

      const newProfile: Profile = {
        id: cred.user.uid,
        full_name: fullName.trim(),
        email,
        phone: phone || null,
        avatar_url: null,
        bio: null,
        default_role: 'poster',
        preferred_language: language,
        city: 'Chennai',
        general_location: 'Campus Hub',
        is_admin: false,
        verification_status: 'unverified', // Critical: do not automatically verify students
        is_worker_available: true,
        rating_as_worker: 5.0,
        total_reviews_as_worker: 0,
        completed_tasks_as_worker: 0,
        rating_as_requester: 5.0,
        total_reviews_as_requester: 0,
        completed_tasks_as_requester: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (db) {
        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
      }

      mockStore.profiles.set(newProfile.id, newProfile);
      mockStore.currentUserId = newProfile.id;

      return { profile: newProfile };
    } catch (err: any) {
      return { error: err.message || 'Firebase signup failed.' };
    }
  },

  /**
   * Password Reset Email with Firebase
   */
  async sendPasswordReset(email: string): Promise<{ error?: string }> {
    if (!this.isConfigured() || !auth) {
      return {
        error: 'Firebase is not configured. Check your environment settings.',
      };
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to send password reset email.' };
    }
  },

  /**
   * Sign out with Firebase
   */
  async logout(): Promise<void> {
    if (this.isConfigured() && auth) {
      await signOut(auth);
    }
    mockStore.currentUserId = null;
  },

  /**
   * Update Student University Onboarding in Firestore
   */
  async updateStudentOnboarding(
    userId: string,
    data: {
      userType: 'student' | 'individual' | 'organization';
      collegeId?: string;
      collegeName?: string;
      department?: string;
      yearOfStudy?: string;
      skills?: string[];
      bio?: string;
      profilePicture?: string;
    }
  ): Promise<{ profile?: Profile; error?: string }> {
    const existing = mockStore.profiles.get(userId);
    if (!existing) {
      return { error: 'User profile not found.' };
    }

    const updatedProfile: Profile = {
      ...existing,
      college_id: data.collegeId || existing.college_id,
      department: data.department || (existing as any).department,
      skills: data.skills || existing.skills || [],
      bio: data.bio || existing.bio,
      avatar_url: data.profilePicture || existing.avatar_url,
      verification_status: 'pending', // Critical: verification status stays pending until reviewed
      updated_at: new Date().toISOString(),
    };

    if (this.isConfigured() && db) {
      try {
        const ref = doc(db, 'profiles', userId);
        await updateDoc(ref, {
          user_type: data.userType,
          college_id: data.collegeId || null,
          college_name: data.collegeName || null,
          department: data.department || null,
          year_of_study: data.yearOfStudy || null,
          skills: data.skills || [],
          bio: data.bio || null,
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('Firestore profile update warning:', err);
      }
    }

    mockStore.profiles.set(userId, updatedProfile);
    return { profile: updatedProfile };
  },
};
