import type { User, UserType } from "@/modules/auth/types";

export const mockGuestUser: User = {
  id: "user-1",
  name: "Test Guest",
  type: "guest" as UserType,
  createdAt: "2025-11-28T12:00:00Z",
};

export const mockFullUser: User = {
  id: "user-2",
  name: "Test User",
  email: "test@example.com",
  type: "full" as UserType,
  photoUrl: "https://example.com/photo.jpg",
  createdAt: "2025-11-28T12:00:00Z",
};

export const mockClaimedUser: User = {
  id: "user-3",
  name: "Claimed User",
  email: "claimed@example.com",
  type: "claimed" as UserType,
  createdAt: "2025-11-28T12:00:00Z",
};

export const mockUsers: User[] = [mockGuestUser, mockFullUser, mockClaimedUser];
