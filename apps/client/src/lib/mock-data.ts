export type MockUser = {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
};

export type MockMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export type MockPost = {
  _id: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type MockNotification = {
  _id: string;
  fromUserId: string;
  type: 'new_post';
  message: string;
  read: boolean;
  createdAt: string;
};

// Current logged-in user (pretend we're "Alice")
export const currentUser: MockUser = {
  _id: 'u1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  avatar: 'AJ',
  isOnline: true,
};

// All users in the system
export const allUsers: MockUser[] = [
  currentUser,
  { _id: 'u2', name: 'Bob Smith', email: 'bob@example.com', avatar: 'BS', isOnline: true },
  { _id: 'u3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'CB', isOnline: false },
  { _id: 'u4', name: 'Diana Ross', email: 'diana@example.com', avatar: 'DR', isOnline: true },
  { _id: 'u5', name: 'Eve Martinez', email: 'eve@example.com', avatar: 'EM', isOnline: false },
  { _id: 'u6', name: 'Frank Ocean', email: 'frank@example.com', avatar: 'FO', isOnline: false },
  { _id: 'u7', name: 'Grace Lee', email: 'grace@example.com', avatar: 'GL', isOnline: true },
  { _id: 'u8', name: 'Hank Williams', email: 'hank@example.com', avatar: 'HW', isOnline: false },
];

// Alice is subscribed to Bob, Charlie, Diana, Eve (NOT Frank, Grace, Hank)
// This is the KEY rule: sidebar only shows subscribed users
export const subscribedUserIds: string[] = ['u2', 'u3', 'u4', 'u5'];

export const subscribedUsers: MockUser[] = allUsers.filter((u) =>
  subscribedUserIds.includes(u._id)
);

// Mock messages between Alice and Bob
export const mockMessages: MockMessage[] = [
  { _id: 'm1', senderId: 'u2', receiverId: 'u1', content: 'Hey Alice! How are you?', createdAt: '2025-02-13T10:00:00Z' },
  { _id: 'm2', senderId: 'u1', receiverId: 'u2', content: "Hi Bob! I'm good, working on a project.", createdAt: '2025-02-13T10:01:00Z' },
  { _id: 'm3', senderId: 'u2', receiverId: 'u1', content: 'Nice! What tech stack?', createdAt: '2025-02-13T10:02:00Z' },
  { _id: 'm4', senderId: 'u1', receiverId: 'u2', content: 'Next.js + NestJS + Socket.IO 🔥', createdAt: '2025-02-13T10:03:00Z' },
  { _id: 'm5', senderId: 'u2', receiverId: 'u1', content: 'That sounds awesome! Let me know if you need help.', createdAt: '2025-02-13T10:04:00Z' },
];

// Mock posts
export const mockPosts: MockPost[] = [
  { _id: 'p1', authorId: 'u2', content: 'Just deployed my first NestJS app! 🚀', createdAt: '2025-02-13T09:00:00Z' },
  { _id: 'p2', authorId: 'u4', content: 'WebSockets are so much fun once you get the hang of it.', createdAt: '2025-02-13T08:30:00Z' },
  { _id: 'p3', authorId: 'u1', content: 'Building a real-time chat app. Excited!', createdAt: '2025-02-13T08:00:00Z' },
  { _id: 'p4', authorId: 'u3', content: 'Anyone else learning Socket.IO?', createdAt: '2025-02-12T20:00:00Z' },
  { _id: 'p5', authorId: 'u5', content: 'MongoDB + Mongoose is a solid combo for rapid prototyping.', createdAt: '2025-02-12T18:00:00Z' },
];

// Mock notifications (from subscribed users who posted)
export const mockNotifications: MockNotification[] = [
  { _id: 'n1', fromUserId: 'u2', type: 'new_post', message: 'Bob Smith made a new post.', read: false, createdAt: '2025-02-13T09:00:00Z' },
  { _id: 'n2', fromUserId: 'u4', type: 'new_post', message: 'Diana Ross made a new post.', read: false, createdAt: '2025-02-13T08:30:00Z' },
  { _id: 'n3', fromUserId: 'u3', type: 'new_post', message: 'Charlie Brown made a new post.', read: true, createdAt: '2025-02-12T20:00:00Z' },
];

// Helper to get user by ID
export const getUserById = (id: string): MockUser | undefined =>
  allUsers.find((u) => u._id === id);