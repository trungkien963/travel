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
  deleteTrip: (id: string) => Promise<void>;
  
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
      deleteTrip: async (id) => {
        // If it's a cloud trip (not starting with 't'), attempt to delete from Cloud first
        if (id && !String(id).startsWith('t')) {
          const { error } = await supabase.from('trips').delete().eq('id', id);
          if (error) {
             console.error("Failed to delete from supabase:", error);
             throw new Error("Unable to delete trip from cloud. Check your permissions.");
          }
        }
        
        // If cloud delete succeeds, or it was a local unsynced trip, remove locally
        set((state) => ({
          trips: state.trips.filter(t => t.id !== id),
          expenses: state.expenses.filter(e => e.tripId !== id),
          posts: state.posts.filter(p => p.tripId !== id)
        }));
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
             
             // CRITICAL: Upsert to public.users to satisfy trips_owner_id_fkey foreign key
             try {
               await supabase.from('users').upsert({
                 id: authData.user.id,
                 email: authData.user.email,
                 full_name: meta?.full_name || meta?.name || authData.user.email?.split('@')[0],
                 avatar_url: meta?.avatar_url || meta?.picture || null
               }, { onConflict: 'id' });
             } catch (err) {
               console.log("Failed to sync auth.user to public.users", err);
             }
          }

          const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*');
          if (!tripsError && tripsData && tripsData.length > 0) {
            // Transform snake_case from DB back to camelCase for UI
            const formattedTrips = tripsData.map(t => {
              return {
                id: t.id,
                title: t.title,
                locationName: t.location_name,
                locationCity: t.location_city,
                coverImage: t.cover_image,
                startDate: t.start_date,
                endDate: t.end_date,
                ownerId: t.owner_id || get().currentUserId,
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
          const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
          if (!tripsError && tripsData) {
            const formattedTrips = tripsData.map(t => {
              return {
                id: t.id,
                title: t.title,
                locationName: t.location_name,
                locationCity: t.location_city,
                coverImage: t.cover_image,
                startDate: t.start_date,
                endDate: t.end_date,
                ownerId: t.owner_id || get().currentUserId,
                isPrivate: t.is_private,
                members: t.members && Array.isArray(t.members) && t.members.length > 0 ? t.members : MOCK_MEMBERS, // Now reads from DB JSONB
              };
            });
            
            const { data: postsData, error: postsError } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
          let formattedPosts = [] as any[];
          
          if (!postsError && postsData) {
            formattedPosts = postsData.map(p => ({
              id: p.id,
              tripId: p.trip_id,
              authorId: p.user_id,
              authorName: 'Traveler', // Replaces with MOCK_MEMBERS or user DB details in useSocial if needed, for now just placeholder to not crash UI
              authorAvatar: undefined,
              content: p.content || '',
              images: p.image_urls || [],
              isDual: p.is_dual_camera || false,
              timestamp: p.created_at || new Date().toISOString(),
              date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              likes: p.likes || 0,
              hasLiked: false,
              comments: p.comments && Array.isArray(p.comments) ? p.comments : []
            }));
          }

          // Fetch Expenses
          const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*');
          let formattedExpenses = [] as any[];
          if (!expensesError && expensesData) {
            formattedExpenses = expensesData.map(e => ({
              id: e.id,
              tripId: e.trip_id,
              amount: e.amount,
              desc: e.description || '',
              date: e.created_at ? e.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              payerId: e.payer_id || 'Traveler',
              category: e.category || 'OTHER',
              splits: e.splits || {} // Now reads from DB JSONB
            }));
          }

          set((state) => {
            // Trips
            const localUnsyncedTrips = state.trips.filter(t => t.id && String(t.id).startsWith('t'));
            const cloudTripTitles = new Set(formattedTrips.map(ct => ct.title));
            const uniqueLocalTrips = localUnsyncedTrips.filter(t => !cloudTripTitles.has(t.title));
            
            // Posts
            const localUnsyncedPosts = state.posts.filter(p => p.id && String(p.id).startsWith('p'));
            const cloudPostContent = new Set(formattedPosts.map(cp => cp.content));
            const uniqueLocalPosts = localUnsyncedPosts.filter(p => !cloudPostContent.has(p.content));
            
            const localUnsyncedExpenses = state.expenses.filter(e => e.id && String(e.id).startsWith('e'));
            const cloudExpenseDescs = new Set(formattedExpenses.map(ce => ce.desc));
            const uniqueLocalExpenses = localUnsyncedExpenses.filter(e => !cloudExpenseDescs.has(e.desc));

            return { 
               trips: [...formattedTrips, ...uniqueLocalTrips],
               posts: [...formattedPosts, ...uniqueLocalPosts],
               expenses: [...formattedExpenses, ...uniqueLocalExpenses]
            };
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
             is_private: trip.isPrivate,
             owner_id: trip.ownerId || get().currentUserId || null
           }).select().single();
           
           if (error) {
             console.log("Failed to push trip details", error);
             return;
           }
           
           // CRITICAL: Update the local temporary ID with the real Cloud UUID!
           set((state) => ({
             trips: state.trips.map(t => t.id === trip.id ? { ...t, id: data.id } : t),
             expenses: state.expenses.map(e => e.tripId === trip.id ? { ...e, tripId: data.id } : e),
             posts: state.posts.map(p => p.tripId === trip.id ? { ...p, tripId: data.id } : p)
           }));
           
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
