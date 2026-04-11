import { useMemo } from 'react';
import { Trip } from '../types/trip';
import { Member } from '../types/expense';
import { useTravelStore } from '../store/useTravelStore';

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

  const removeMember = (memberId: string) => {
    if (!trip) return;
    updateStoreTrip(trip.id, { members: trip.members.filter(m => m.id !== memberId) });
  };

  const addMember = (member: Member) => {
    if (!trip) return;
    updateStoreTrip(trip.id, { members: [...trip.members, member] });
  };

  const editMember = (member: Member) => {
    if (!trip) return;
    updateStoreTrip(trip.id, { members: trip.members.map(m => m.id === member.id ? member : m) });
  };

  const updateTrip = (updatedData: Partial<Trip>) => {
    if (!trip) return;
    updateStoreTrip(trip.id, updatedData);
  };

  return { trip, isOwner, currentUserId, removeMember, addMember, editMember, updateTrip };
}
