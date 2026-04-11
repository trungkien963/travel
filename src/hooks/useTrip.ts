import { useMemo } from 'react';
import { Trip } from '../types/trip';
import { Member } from '../types/expense';
import { useTravelStore } from '../store/useTravelStore';
import { supabase } from '../lib/supabase';

export function useTrip(tripId: string) {
  const { trips, currentUserId, updateTrip: updateStoreTrip } = useTravelStore();

  const trip = useMemo(() => {
    return trips.find(t => t.id === tripId) || null;
  }, [trips, tripId]);

  const isOwner = useMemo(() => {
    if (!trip) return false;
    if (trip.ownerId === currentUserId) return true;
    if (trip.ownerId === 'm1') return true;
    if (String(trip.id).startsWith('t')) return true; // Offline trips can always be deleted by creator
    if (trip.members && trip.members.length === 1) return true; // Solo trips are owned
    return false;
  }, [trip, currentUserId]);

  const removeMember = async (memberId: string) => {
    if (!trip) return;
    await updateTrip({ members: trip.members.filter(m => m.id !== memberId) });
  };

  const addMember = async (member: Member) => {
    if (!trip) return;
    await updateTrip({ members: [...trip.members, member] });
  };

  const editMember = async (member: Member) => {
    if (!trip) return;
    await updateTrip({ members: trip.members.map(m => m.id === member.id ? member : m) });
  };

  const updateTrip = async (updatedData: Partial<Trip>) => {
    if (!trip) return;
    updateStoreTrip(trip.id, updatedData);
    if (!trip.id.startsWith('t')) {
       const updatePayload: any = {
         title: updatedData.title,
         start_date: updatedData.startDate,
         end_date: updatedData.endDate,
         cover_image: updatedData.coverImage,
         location_name: updatedData.locationName,
         location_city: updatedData.locationCity,
         is_private: updatedData.isPrivate
       };
       if (updatedData.members) {
         updatePayload.members = updatedData.members;
       }
       await supabase.from('trips').update(updatePayload).eq('id', trip.id);
    }
  };

  return { trip, isOwner, currentUserId, removeMember, addMember, editMember, updateTrip };
}
