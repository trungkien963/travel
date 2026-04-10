import { Member } from '../types/expense';
import { AppNotification } from '../types/notification';

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: 'You (Edric)', isMe: true },
  { id: 'm2', name: 'Khoi Nguyen' },
  { id: 'm3', name: 'Jane Doe' },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'TRIP_INVITE',
    actorName: 'Khoi Nguyen',
    actorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    message: 'added you to trip "Summer Breeze"',
    tripId: '1',
    createdAt: '2026-04-10T09:00:00Z',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'EXPENSE_ADDED',
    actorName: 'Jane Doe',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    message: 'split an expense "Dinner at Sea" with you ($25.00)',
    tripId: '1',
    expenseId: 'e1',
    createdAt: '2026-04-09T20:15:00Z',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'POST_COMMENT',
    actorName: 'Khoi Nguyen',
    actorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    message: 'commented on your post: "Looks amazing!"',
    tripId: '1',
    postId: 'p1',
    createdAt: '2026-04-09T18:30:00Z',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'POST_LIKE',
    actorName: 'Jane Doe',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    message: 'liked your post in "Poolside Sips"',
    tripId: '2',
    postId: 'p2',
    createdAt: '2026-04-08T14:20:00Z',
    isRead: true,
  },
];

export const MOCK_TRIPS = [
  { id: '1', title: 'Summer in Bali', startDate: '2026-04-09', endDate: '2026-04-10' },
  { id: '2', title: 'Demo Trip', startDate: '2026-05-01', endDate: '2026-05-05' },
];
