import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../types/trip';
import { Expense } from '../types/expense';
import { Post } from '../types/social';
import { AppNotification } from '../types/notification';
import { MOCK_MEMBERS } from '../constants/mockData';
import { supabase } from '../lib/supabase';

interface TravelState {
  currentUserId: string;
  currentUserProfile?: { name: string; avatar?: string };
  setCurrentUserId: (id: string) => void;
  trips: Trip[];
  expenses: Expense[];
  posts: Post[];
  notifications: AppNotification[];
  
  // Actions
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updatedData: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updatedData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addPost: (post: Post) => void;
  updatePost: (id: string, updatedData: Partial<Post>) => void;
  deletePost: (id: string) => void;
  
  addNotification: (notification: AppNotification) => void;
  markNotificationAsRead: (id: string) => void;

  // Supabase Sync
  isSyncing: boolean;
  initSupabase: () => Promise<void>;
  refreshData: () => Promise<void>;
  pushTripToCloud: (trip: Trip) => Promise<void>;
}

export const useTravelStore = create<TravelState>()(
  persist(
    (set, get) => ({
      currentUserId: '', // Will be updated on auth
      currentUserProfile: undefined,
      setCurrentUserId: (id) => set({ currentUserId: id }),
      trips: [] as Trip[],
      expenses: [] as Expense[],
      posts: [] as Post[],
      notifications: [],
      
      setTrips: (trips) => set({ trips }),
      addTrip: (trip) => {
        set((state) => ({ trips: [trip, ...state.trips] }));
        get().pushTripToCloud(trip);
      },
      updateTrip: (id, data) => set((state) => ({
        trips: state.trips.map(t => t.id === id ? { ...t, ...data } : t)
      })),
      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter(t => t.id !== id),
          expenses: state.expenses.filter(e => e.tripId !== id),
          posts: state.posts.filter(p => p.tripId !== id)
        }));
        // Supabase Sync (Silent push)
        supabase.from('trips').delete().eq('id', id).then(({error}) => {
          if (error) console.log("Failed to delete from supabase:", error);
        });
      },

      addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
      updateExpense: (id, data) => set((state) => ({
        expenses: state.expenses.map(e => e.id === id ? { ...e, ...data } : e)
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),

      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      updatePost: (id, data) => set((state) => ({
        posts: state.posts.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deletePost: (id) => set((state) => ({
        posts: state.posts.filter(p => p.id !== id)
      })),
      
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      })),

      isSyncing: false,
      initSupabase: async () => {
        set({ isSyncing: true });
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
             const meta = authData.user.user_metadata;
             set({ 
               currentUserId: authData.user.id,
               currentUserProfile: {
                 name: meta?.full_name || meta?.name || 'Traveler',
                 avatar: meta?.avatar_url || meta?.picture || undefined
               }
             });
          }

          const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*, trip_members(user_id, role)');
          if (!tripsError && tripsData && tripsData.length > 0) {
            // Transform snake_case from DB back to camelCase for UI
            const formattedTrips = tripsData.map(t => {
              const adminMember = t.trip_members?.find((m: any) => m.role === 'admin');
              return {
                id: t.id,
                title: t.title,
                locationName: t.location_name,
                locationCity: t.location_city,
                coverImage: t.cover_image,
                startDate: t.start_date,
                endDate: t.end_date,
                ownerId: adminMember?.user_id || get().currentUserId, // Use proper owner or fallback to current
                isPrivate: t.is_private,
                members: MOCK_MEMBERS, // Temporarily still use mock members
              };
            });
            
            // Merge with local trips (avoiding duplicates by ID)
            set((state) => {
              const localTripIds = new Set(state.trips.map(x => x.id));
              const newCloudTrips = formattedTrips.filter(t => !localTripIds.has(t.id));
              return { trips: [...newCloudTrips, ...state.trips] };
            });
          }
        } catch (err) {
          console.error("Supabase sync failed", err);
        } finally {
          set({ isSyncing: false });
        }
      },

      refreshData: async () => {
        try {
          const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*, trip_members(user_id, role)').order('created_at', { ascending: false });
          if (!tripsError && tripsData) {
            const formattedTrips = tripsData.map(t => {
              const adminMember = t.trip_members?.find((m: any) => m.role === 'admin');
              return {
                id: t.id,
                title: t.title,
                locationName: t.location_name,
                locationCity: t.location_city,
                coverImage: t.cover_image,
                startDate: t.start_date,
                endDate: t.end_date,
                ownerId: adminMember?.user_id || get().currentUserId,
                isPrivate: t.is_private,
                members: MOCK_MEMBERS, // Still use mock for now
              };
            });
            
            set((state) => {
              // Keep local unsynced trips (assuming they start with 't')
              const localUnsyncedTrips = state.trips.filter(t => t.id && String(t.id).startsWith('t'));
              
              // To prevent duplicate UI representation for the machine that creates it,
              // we probably should just do a naive replace if we don't care, but let's 
              // keep local trips that don't match title to avoid immediate duplicate visually?
              // Actually, simplest is to just overwrite with cloud + local unsynced 
              // that don't match any cloud title (basic heuristic).
              const cloudTitles = new Set(formattedTrips.map(ct => ct.title));
              const uniqueLocalUnsynced = localUnsyncedTrips.filter(t => !cloudTitles.has(t.title));

              return { trips: [...formattedTrips, ...uniqueLocalUnsynced] };
            });
          }
        } catch (err) {
          console.error("Refresh failed", err);
        }
      },

      pushTripToCloud: async (trip) => {
         try {
           const { data, error } = await supabase.from('trips').insert({
             title: trip.title,
             cover_image: trip.coverImage,
             location_name: trip.locationName || null,
             location_city: trip.locationCity || null,
             start_date: trip.startDate,
             end_date: trip.endDate,
             is_private: trip.isPrivate
           }).select().single();
           
           if (error) {
             console.log("Failed to push trip details", error);
             return;
           }

           // Link the current user as the admin logic
           if (get().currentUserId) {
             await supabase.from('trip_members').insert({
               trip_id: data.id,
               user_id: get().currentUserId,
               role: 'admin'
             });
           }
         } catch(err) {
           console.log("Failed to push to cloud", err);
         }
      }
    }),
    {
      name: 'travel-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
