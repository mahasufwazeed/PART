import { supabase, isLiveSupabaseConfigured, isTestEnv } from './client';
import { SavedAddress, WorkerLiveLocation, Task } from '../types';
import { mockStore } from './mockStore';
import { taskService } from './taskService';

// Default starter addresses for Chennai
const DEFAULT_CHENNAI_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-default-home',
    label: 'Home',
    title: 'Home (Apartment)',
    address_line: 'No. 14, 2nd Main Road, Vijaya Nagar',
    locality: 'Velachery, Chennai',
    latitude: 12.9815,
    longitude: 80.218,
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'addr-default-work',
    label: 'Work',
    title: 'Office / Tech Park',
    address_line: 'Ascendas IT Park, Taramani Road',
    locality: 'Taramani, Chennai',
    latitude: 12.9863,
    longitude: 80.2432,
    is_default: false,
    created_at: new Date().toISOString(),
  },
];

export const locationService = {
  /**
   * Retrieve saved addresses for a user
   */
  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        const { data, error } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as SavedAddress[];
        }
      } catch (err) {
        console.warn('Supabase saved_addresses fallback to local store:', err);
      }
    }

    // In-memory / mock store fallback
    const userAddrs = Array.from(mockStore.savedAddresses.values()).filter(
      (a: SavedAddress) => !a.user_id || a.user_id === userId
    );

    if (userAddrs.length === 0) {
      // Seed default addresses for immediate Blinkit UX
      DEFAULT_CHENNAI_ADDRESSES.forEach((a) => {
        mockStore.savedAddresses.set(a.id, { ...a, user_id: userId });
      });
      return DEFAULT_CHENNAI_ADDRESSES.map((a) => ({ ...a, user_id: userId }));
    }

    return userAddrs;
  },

  /**
   * Save a new address (with PostGIS Point calculation)
   */
  async saveAddress(
    userId: string,
    address: Omit<SavedAddress, 'id' | 'created_at'>
  ): Promise<{ address: SavedAddress | null; error: string | null }> {
    const id = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAddr: SavedAddress = {
      ...address,
      id,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        const { data, error } = await supabase
          .from('saved_addresses')
          .insert({
            id: newAddr.id,
            user_id: userId,
            label: newAddr.label,
            title: newAddr.title,
            address_line: newAddr.address_line,
            locality: newAddr.locality,
            latitude: newAddr.latitude,
            longitude: newAddr.longitude,
            is_default: !!newAddr.is_default,
          })
          .select()
          .single();

        if (error) {
          console.warn('Supabase saveAddress error, saving locally:', error.message);
        } else if (data) {
          mockStore.savedAddresses.set(data.id, data as SavedAddress);
          return { address: data as SavedAddress, error: null };
        }
      } catch (err: any) {
        console.warn('Supabase saveAddress exception:', err);
      }
    }

    mockStore.savedAddresses.set(newAddr.id, newAddr);
    return { address: newAddr, error: null };
  },

  /**
   * Delete a saved address
   */
  async deleteSavedAddress(
    userId: string,
    addressId: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        const { error } = await supabase
          .from('saved_addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase deleteSavedAddress error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase deleteSavedAddress exception:', err);
      }
    }

    mockStore.savedAddresses.delete(addressId);
    return { success: true, error: null };
  },

  /**
   * Update worker's live location for an active task
   * Realtime broadcast + database sync
   */
  async updateWorkerLocation(
    taskId: string,
    workerId: string,
    coords: {
      latitude: number;
      longitude: number;
      heading?: number | null;
      speed?: number | null;
      accuracy?: number | null;
    }
  ): Promise<{ success: boolean; error: string | null }> {
    const loc: WorkerLiveLocation = {
      task_id: taskId,
      worker_id: workerId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
      accuracy: coords.accuracy ?? null,
      updated_at: new Date().toISOString(),
    };

    // Update in-memory store
    mockStore.workerLocations.set(`${taskId}_${workerId}`, loc);

    // Broadcast over Supabase Realtime channel
    try {
      const channel = supabase.channel(`task-tracking:${taskId}`);
      channel.send({
        type: 'broadcast',
        event: 'worker_location_update',
        payload: loc,
      });
    } catch (broadcastErr) {
      // non-fatal
    }

    // Persist to Postgres if configured
    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        await supabase.from('task_worker_locations').upsert(
          {
            task_id: taskId,
            worker_id: workerId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: coords.heading,
            speed: coords.speed,
            accuracy: coords.accuracy,
            updated_at: loc.updated_at,
          },
          { onConflict: 'task_id,worker_id' }
        );
      } catch (err) {
        // non-fatal
      }
    }

    return { success: true, error: null };
  },

  /**
   * Get latest live location of assigned worker for a task
   */
  async getWorkerLocation(taskId: string): Promise<WorkerLiveLocation | null> {
    // Check in-memory store first
    for (const [key, val] of mockStore.workerLocations.entries()) {
      if (key.startsWith(`${taskId}_`)) {
        return val as WorkerLiveLocation;
      }
    }

    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        const { data, error } = await supabase
          .from('task_worker_locations')
          .select('*')
          .eq('task_id', taskId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return data as WorkerLiveLocation;
        }
      } catch {
        // ignore
      }
    }

    return null;
  },

  /**
   * Subscribe to live worker location updates for a task
   */
  subscribeWorkerLocation(
    taskId: string,
    onUpdate: (loc: WorkerLiveLocation) => void
  ): () => void {
    const channelName = `task-tracking:${taskId}`;
    const channel = supabase.channel(channelName);

    // Listen to broadcast events (instant low-latency peer-to-peer delivery)
    channel.on(
      'broadcast',
      { event: 'worker_location_update' },
      ({ payload }) => {
        if (payload && payload.task_id === taskId) {
          onUpdate(payload as WorkerLiveLocation);
        }
      }
    );

    // Also listen to database postgres_changes if table exists
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_worker_locations',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        if (payload.new && (payload.new as any).task_id === taskId) {
          onUpdate(payload.new as WorkerLiveLocation);
        }
      }
    );

    channel.subscribe();

    // Return cleanup function to unsubscribe
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Discover nearby tasks using PostGIS RPC or resilient Haversine fallback
   * Supports distance filters: 1, 3, 5, 10 km
   */
  async getNearbyTasks(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Task[]> {
    if (isLiveSupabaseConfigured && !isTestEnv) {
      try {
        // Try calling PostGIS procedure get_nearby_tasks_within_radius
        const { data, error } = await supabase.rpc('get_nearby_tasks_within_radius', {
          p_lat: latitude,
          p_lng: longitude,
          p_radius_km: radiusKm,
        });

        if (!error && data && Array.isArray(data)) {
          return data as Task[];
        }
      } catch (rpcErr) {
        // fallback
      }
    }

    // Resilient fallback to taskService.getNearbyTasks
    return taskService.getNearbyTasks({
      latitude,
      longitude,
      radiusKm,
    });
  },
};

