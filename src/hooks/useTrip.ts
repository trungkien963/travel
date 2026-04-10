import { useState, useMemo } from 'react';
import { Trip } from '../types/trip';
import { MOCK_MEMBERS } from '../constants/mockData';

// Giả lập ID của người dùng đang đăng nhập (Bạn là ai)
const CURRENT_USER_ID = 'm1';

export function useTrip(tripId: string) {
  // Setup data ảo cho chuyến đi
  const [trip, setTrip] = useState<Trip | null>({
    id: tripId,
    title: 'Summer in Bali',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop',
    startDate: 'Apr 9',
    endDate: 'Apr 10',
    ownerId: 'm1', // Đổi cái này thành 'm2' nếu muốn đóng vai thành viên thường (mất quyền Owner)
    members: MOCK_MEMBERS,
    isPrivate: true,
  });

  const isOwner = useMemo(() => {
    return trip?.ownerId === CURRENT_USER_ID;
  }, [trip]);

  const removeMember = (memberId: string) => {
    setTrip(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev);
  };

  const addMember = (member: Member) => {
    setTrip(prev => prev ? { ...prev, members: [...prev.members, member] } : prev);
  };

  const editMember = (member: Member) => {
    setTrip(prev => prev ? { ...prev, members: prev.members.map(m => m.id === member.id ? member : m) } : prev);
  };

  return { trip, isOwner, currentUserId: CURRENT_USER_ID, removeMember, addMember, editMember };
}
