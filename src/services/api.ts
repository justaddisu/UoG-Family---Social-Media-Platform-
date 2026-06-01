import axios from 'axios';
import { User, Profile, Post, Comment, CommentReply, Group, Event as UoGEvent, Announcement, Notification, Conversation, Message, Report, AnalyticsSummary, AuditLog } from '../types';

// Detect or fallback base API URL
const API_URL = ''; // Relative path because Express services exist on the same port 3000!

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sync JWT authorization header automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('uog_access_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Transparent token refresh on 401 or 403 authorization boundary
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('uog_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, user } = res.data;
          
          localStorage.setItem('uog_access_token', accessToken);
          localStorage.setItem('uog_user', JSON.stringify(user));
          
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Both tokens invalid, purge cache and force sign in redirect
          localStorage.removeItem('uog_access_token');
          localStorage.removeItem('uog_refresh_token');
          localStorage.removeItem('uog_user');
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/login', credentials);
    localStorage.setItem('uog_access_token', res.data.accessToken);
    localStorage.setItem('uog_refresh_token', res.data.refreshToken);
    localStorage.setItem('uog_user', JSON.stringify(res.data.user));
    return res.data;
  },

  async register(data: any) {
    const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/register', data);
    localStorage.setItem('uog_access_token', res.data.accessToken);
    localStorage.setItem('uog_refresh_token', res.data.refreshToken);
    localStorage.setItem('uog_user', JSON.stringify(res.data.user));
    return res.data;
  },

  logout() {
    localStorage.removeItem('uog_access_token');
    localStorage.removeItem('uog_refresh_token');
    localStorage.removeItem('uog_user');
    window.dispatchEvent(new Event('auth_logout'));
  },

  async getMe() {
    const res = await apiClient.get<{ user: User }>('/api/auth/me');
    localStorage.setItem('uog_user', JSON.stringify(res.data.user));
    return res.data.user;
  },

  getCurrentUser(): User | null {
    const cached = localStorage.getItem('uog_user');
    if (!cached) return null;
    try {
      return JSON.parse(cached) as User;
    } catch {
      return null;
    }
  }
};

export const userService = {
  async getProfile(userId: string) {
    return (await apiClient.get<User & { isFollowing: boolean; stats: { posts: number; following: number; followers: number } }>(`/api/users/${userId}/profile`)).data;
  },

  async updateProfile(profileData: Partial<Profile>) {
    return (await apiClient.put<Profile>('/api/users/profile', profileData)).data;
  },

  async toggleFollow(userId: string) {
    return (await apiClient.post<{ isFollowing: boolean }>(`/api/users/${userId}/follow`)).data;
  },

  async getSuggestions() {
    return (await apiClient.get<User[]>('/api/users/suggestions')).data;
  },

  async getFollowers(userId: string) {
    return (await apiClient.get<User[]>(`/api/users/${userId}/followers`)).data;
  },

  async getFollowing(userId: string) {
    return (await apiClient.get<User[]>(`/api/users/${userId}/following`)).data;
  }
};

export const postService = {
  async createPost(content: string, visibility = 'PUBLIC', mediaUrls?: string[], repostOfId?: string) {
    return (await apiClient.post<Post>('/api/posts', { content, visibility, mediaUrls, repostOfId })).data;
  },

  async getPosts(feedType: 'latest' | 'following' | 'trending' = 'latest') {
    return (await apiClient.get<Post[]>(`/api/posts?feedType=${feedType}`)).data;
  },

  async getPostDetails(postId: string) {
    return (await apiClient.get<Post>(`/api/posts/${postId}`)).data;
  },

  async deletePost(postId: string) {
    return (await apiClient.delete<{ success: boolean }>(`/api/posts/${postId}`)).data;
  },

  async reactToPost(postId: string, type: string) {
    return (await apiClient.post<{ success: boolean; action: 'REMOVED' | 'UPDATED' | 'CREATED'; reaction?: any }>(`/api/posts/${postId}/react`, { type })).data;
  },

  async addComment(postId: string, content: string) {
    return (await apiClient.post<Comment>(`/api/posts/${postId}/comments`, { content })).data;
  },

  async addCommentReply(commentId: string, content: string) {
    return (await apiClient.post<CommentReply>(`/api/comments/${commentId}/replies`, { content })).data;
  },

  async deleteComment(commentId: string) {
    return (await apiClient.delete<{ success: boolean }>(`/api/comments/${commentId}`)).data;
  },

  async toggleBookmark(postId: string) {
    return (await apiClient.post<{ isBookmarked: boolean }>(`/api/posts/${postId}/bookmark`)).data;
  },

  async getBookmarks() {
    return (await apiClient.get<Post[]>('/api/bookmarks')).data;
  }
};

export const chatService = {
  async getConversations() {
    return (await apiClient.get<Conversation[]>('/api/chats')).data;
  },

  async getMessages(conversationId: string) {
    return (await apiClient.get<Message[]>(`/api/chats/${conversationId}/messages`)).data;
  },

  async createConversation(recipientId?: string, isGroup = false, name?: string, memberIds?: string[]) {
    return (await apiClient.post<Conversation>('/api/chats', { recipientId, isGroup, name, memberIds })).data;
  },

  async sendMessage(conversationId: string, content: string) {
    return (await apiClient.post<Message>(`/api/chats/${conversationId}/messages`, { content })).data;
  }
};

export const communityService = {
  async getGroups() {
    return (await apiClient.get<Group[]>('/api/communities')).data;
  },

  async toggleJoinGroup(groupId: string) {
    return (await apiClient.post<{ isJoined: boolean }>(`/api/communities/${groupId}/join`)).data;
  },

  async createGroup(data: { name: string; description?: string; type: string; coverUrl?: string; avatarUrl?: string }) {
    return (await apiClient.post<Group>('/api/communities', data)).data;
  }
};

export const eventService = {
  async getEvents() {
    return (await apiClient.get<UoGEvent[]>('/api/events')).data;
  },

  async registerRsvp(eventId: string, rsvp: 'YES' | 'MAYBE' | 'NO' | 'NONE') {
    return (await apiClient.post<{ isRegistered: boolean; rsvp?: string }>(`/api/events/${eventId}/rsvp`, { rsvp })).data;
  },

  async createEvent(data: { title: string; description: string; location: string; startDate: string; endDate: string; coverUrl?: string; organId?: string }) {
    return (await apiClient.post<UoGEvent>('/api/events', data)).data;
  }
};

export const announcementService = {
  async getAnnouncements() {
    return (await apiClient.get<Announcement[]>('/api/announcements')).data;
  },

  async createAnnouncement(data: { title: string; content: string; priority: 'NORMAL' | 'HIGH' | 'URGENT'; isPinned: boolean; scope?: string; scopeId?: string }) {
    return (await apiClient.post<Announcement>('/api/announcements', data)).data;
  }
};

export const notificationService = {
  async getNotifications() {
    return (await apiClient.get<Notification[]>('/api/notifications')).data;
  },

  async markNotificationsRead() {
    return (await apiClient.post<{ success: boolean }>('/api/notifications/read')).data;
  }
};

export const searchService = {
  async search(query: string, type: 'posts' | 'users' | 'groups' | 'events' = 'posts') {
    return (await apiClient.get<any[]>(`/api/search?q=${encodeURIComponent(query)}&type=${type}`)).data;
  }
};

export const mediaService = {
  async uploadMedia(filename: string, base64: string) {
    return (await apiClient.post<{ url: string }>('/api/media/upload', { filename, base64 })).data;
  }
};

export const reportService = {
  async fileReport(data: { targetType: 'POST' | 'COMMENT' | 'USER'; targetId: string; reason: string; description?: string }) {
    return (await apiClient.post<Report>('/api/reports', data)).data;
  },

  async listReports() {
    return (await apiClient.get<Report[]>('/api/reports')).data;
  },

  async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED', actionTaken: 'BAN' | 'WARNING' | 'DELETE' | 'NONE') {
    return (await apiClient.post<Report>(`/api/reports/${reportId}/resolve`, { status, actionTaken })).data;
  }
};

export const adminService = {
  async getAnalytics() {
    return (await apiClient.get<AnalyticsSummary>('/api/admin/analytics')).data;
  },

  async getAuditLogs() {
    return (await apiClient.get<AuditLog[]>('/api/admin/audit-logs')).data;
  },

  async getRoster() {
    return (await apiClient.get<User[]>('/api/admin/roles')).data;
  },

  async changeUserRole(userId: string, role: string) {
    return (await apiClient.put<User>(`/api/admin/roles/${userId}`, { role })).data;
  }
};
