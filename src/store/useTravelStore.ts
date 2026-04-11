import { create } from 'zustand';
import { Trip } from '../types/trip';
import { Expense } from '../types/expense';
import { Post } from '../types/social';
import { AppNotification } from '../types/notification';

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
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
  setupRealtimeNotifications: () => void;
}

export const useTravelStore = create<TravelState>()(
    (set, get) => ({
      currentUserId: '', 
      currentUserProfile: undefined,
      isGlobalLoading: false,
      setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
      setCurrentUserId: (id) => set({ currentUserId: id }),
      trips: [] as Trip[],
      expenses: [] as Expense[],
      posts: [] as Post[],
      notifications: [],
      
      setTrips: (trips) => set({ trips }),
      addTrip: (trip) => {
        set((state) => ({ trips: [trip, ...state.trips] }));
      },
      updateTrip: (id, data) => set((state) => ({
        trips: state.trips.map(t => t.id === id ? { ...t, ...data } : t)
      })),
      deleteTrip: async (id) => {
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
      markNotificationAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
        }));
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch (err) {
          console.error("Failed to mark notification as read", err);
        }
      },

      setupRealtimeNotifications: () => {
        const currentUserId = get().currentUserId;
        if (!currentUserId) return;

        // Fetch initial notifications
        supabase.from('notifications')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(30)
          .then(({ data, error }) => {
            if (!error && data) {
              const formattedList = data.map((n: any) => ({
                id: n.id,
                type: n.type,
                actorName: n.actor_name,
                actorAvatar: n.actor_avatar,
                message: n.message,
                tripId: n.trip_id,
                postId: n.post_id,
                expenseId: n.expense_id,
                createdAt: n.created_at,
                isRead: n.is_read
              }));
              set({ notifications: formattedList });
            }
          });

        // Setup realtime subscription
        const channel = supabase.channel('public:notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUserId}`
            },
            (payload) => {
              const newNotif = payload.new;
              const formattedNotif: AppNotification = {
                id: newNotif.id,
                type: newNotif.type,
                actorName: newNotif.actor_name,
                actorAvatar: newNotif.actor_avatar,
                message: newNotif.message,
                tripId: newNotif.trip_id,
                postId: newNotif.post_id,
                expenseId: newNotif.expense_id,
                createdAt: newNotif.created_at,
                isRead: newNotif.is_read
              };
              set((state) => ({ notifications: [formattedNotif, ...state.notifications] }));
            }
          )
          .subscribe();
      },

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
             get().setupRealtimeNotifications();
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
                members: [],
              };
            });
            
            set({ trips: formattedTrips });
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
                members: t.members && Array.isArray(t.members) ? t.members : [], // Now reads from DB JSONB
              };
            });
            
            const { data: postsData, error: postsError } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
          let formattedPosts = [] as any[];
          
          if (!postsError && postsData) {
            formattedPosts = postsData.map(p => ({
              id: p.id,
              tripId: p.trip_id,
              authorId: p.user_id,
              authorName: formattedTrips.find(trip => trip.id === p.trip_id)?.members?.find((m: any) => m.id === p.user_id)?.name || 'Traveler',
              authorAvatar: formattedTrips.find(trip => trip.id === p.trip_id)?.members?.find((m: any) => m.id === p.user_id)?.avatar || undefined,
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

          set({ trips: formattedTrips, posts: formattedPosts, expenses: formattedExpenses });
          }
        } catch (err) {
          console.error("Refresh failed", err);
        }
      },

    })
);
