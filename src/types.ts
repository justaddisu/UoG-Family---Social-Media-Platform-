export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'LECTURER' | 'STAFF' | 'CLUB_ADMIN' | 'MODERATOR' | 'SUPER_ADMIN' | 'GONDAR_COMMUNITY';
  isVerified: boolean;
  createdAt: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  department?: string;
  college?: string;
  graduationYear?: number;
  bio?: string;
  skills?: string;
  interests?: string;
  contactInfo?: string;
  privacySettings: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  avatarUrl?: string;
  coverUrl?: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  visibility: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  repostOfId?: string;
  repostOf?: Post;
  createdAt: string;
  updatedAt: string;
  media: PostMedia[];
  comments: Comment[];
  reactions: Reaction[];
  bookmarks?: Bookmark[];
  hashtags?: PostHashtag[];
}

export interface PostMedia {
  id: string;
  postId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies: CommentReply[];
  reactions: Reaction[];
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: 'LIKE' | 'LOVE' | 'CELEBRATE' | 'SUPPORT' | 'INSIGHTFUL' | 'FUNNY';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  sender?: User;
  type: 'FOLLOW' | 'COMMENT' | 'REPLY' | 'REACTION' | 'MESSAGE' | 'ANNOUNCEMENT' | 'SYSTEM';
  message: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: string;
  messages?: Message[];
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  user?: User;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'FILE';
  isRead: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'CLUB' | 'DEPARTMENT' | 'FACULTY' | 'ALUMNI_GROUP' | 'STUDENT_ORG';
  coverUrl?: string;
  avatarUrl?: string;
  createdById: string;
  createdAt: string;
  membersCount?: number;
  isJoined?: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  coverUrl?: string;
  organId: string;
  creatorRole: string;
  createdAt: string;
  registrationsCount?: number;
  isRegistered?: boolean;
  userRsvp?: 'YES' | 'MAYBE' | 'NO';
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  rsvp: 'YES' | 'MAYBE' | 'NO';
  registeredAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned: boolean;
  scope: 'GENERAL' | 'DEPARTMENT' | 'CLUB' | 'FACULTY';
  scopeId?: string;
  createdBy: string;
  createdAt: string;
}

export interface PostHashtag {
  postId: string;
  hashtagName: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter?: User;
  reportedUserId?: string;
  reportedUser?: User;
  postId?: string;
  post?: Post;
  commentId?: string;
  comment?: Comment;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  moderatorId: string;
  action: string;
  targetId: string;
  targetType: string;
  reason: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  userGrowth: { date: string; count: number }[];
  activeUsersCount: number;
  engagementRate: number;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
  groupGrowth: { type: string; count: number }[];
  mostActiveDepartments: { department: string; postsCount: number }[];
  moderationCount: { pendingReports: number; resolvedReports: number };
}
