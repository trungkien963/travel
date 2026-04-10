import { Member } from './expense';

export interface Trip {
  id: string;
  title: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  members: Member[];
  isPrivate: boolean;
}
