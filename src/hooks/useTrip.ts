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
    return trip?.ownerId === currentUserId;
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
