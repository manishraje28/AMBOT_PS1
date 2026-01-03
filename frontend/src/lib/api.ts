import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('alumnet_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('alumnet_token');
            localStorage.removeItem('alumnet_user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'alumni';
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await this.client.post('/auth/change-password', data);
    return response.data;
  }

  // Profile endpoints
  async getProfile() {
    const response = await this.client.get('/profile');
    return response.data;
  }

  async updateProfile(data: Record<string, unknown>) {
    const response = await this.client.put('/profile', data);
    return response.data;
  }

  async getAllAlumni(params?: { page?: number; limit?: number; availableOnly?: boolean }) {
    const response = await this.client.get('/profile/alumni', { params });
    return response.data;
  }

  async getAlumniById(id: string) {
    const response = await this.client.get(`/profile/alumni/${id}`);
    return response.data;
  }

  // Matchmaking endpoints
  async getMatches(params?: { limit?: number; refresh?: boolean }) {
    const response = await this.client.get('/matchmaking/matches', { params });
    return response.data;
  }

  async refreshMatches(limit?: number) {
    const response = await this.client.post('/matchmaking/refresh', { limit });
    return response.data;
  }

  // Scheduling endpoints
  async getAvailableSlots(alumniId: string, params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/scheduling/slots/${alumniId}`, { params });
    return response.data;
  }

  async bookSession(data: { alumniId: string; slotTime: string; notes?: string }) {
    const response = await this.client.post('/scheduling/book', data);
    return response.data;
  }

  async getSessions(params?: { status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/scheduling/sessions', { params });
    return response.data;
  }

  async cancelSession(sessionId: string, reason?: string) {
    const response = await this.client.post(`/scheduling/sessions/${sessionId}/cancel`, { reason });
    return response.data;
  }

  async completeSession(sessionId: string, notes?: string) {
    const response = await this.client.post(`/scheduling/sessions/${sessionId}/complete`, { notes });
    return response.data;
  }

  async addSessionFeedback(sessionId: string, data: { rating: number; feedback?: string }) {
    const response = await this.client.post(`/scheduling/sessions/${sessionId}/feedback`, data);
    return response.data;
  }

  // Opportunity endpoints
  async getOpportunities(params?: {
    page?: number;
    limit?: number;
    type?: string;
    domains?: string;
    skills?: string;
    isRemote?: boolean;
  }) {
    const response = await this.client.get('/opportunities', { params });
    return response.data;
  }

  async getMyOpportunities(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/opportunities/my', { params });
    return response.data;
  }

  async getOpportunityById(id: string) {
    const response = await this.client.get(`/opportunities/${id}`);
    return response.data;
  }

  async createOpportunity(data: {
    title: string;
    description: string;
    type: string;
    company?: string;
    location?: string;
    isRemote?: boolean;
    requiredSkills?: string[];
    requiredDomains?: string[];
    targetDomains?: string[];
    deadline?: string;
    applicationDeadline?: string | null;
    applicationLink?: string;
    externalLink?: string;
  }) {
    const response = await this.client.post('/opportunities', data);
    return response.data;
  }

  async updateOpportunity(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/opportunities/${id}`, data);
    return response.data;
  }

  async deleteOpportunity(id: string) {
    const response = await this.client.delete(`/opportunities/${id}`);
    return response.data;
  }

  async applyForOpportunity(id: string, data: { coverNote?: string; resumeUrl?: string; message?: string }) {
    const response = await this.client.post(`/opportunities/${id}/apply`, data);
    return response.data;
  }

  // Alias for applyForOpportunity
  async applyToOpportunity(id: string, data: { coverNote?: string; resumeUrl?: string; message?: string }) {
    return this.applyForOpportunity(id, data);
  }

  async getMyApplications(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/opportunities/applications', { params });
    return response.data;
  }

  async getOpportunityApplications(opportunityId: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/opportunities/${opportunityId}/applications`, { params });
    return response.data;
  }

  async updateApplicationStatus(applicationId: string, status: string) {
    const response = await this.client.put(`/opportunities/applications/${applicationId}/status`, { status });
    return response.data;
  }

  async withdrawApplication(applicationId: string) {
    const response = await this.client.delete(`/opportunities/applications/${applicationId}`);
    return response.data;
  }

  // Chat endpoints
  async getConversations() {
    const response = await this.client.get('/chat/conversations');
    return response.data;
  }

  async createConversation(userId: string) {
    const response = await this.client.post('/chat/conversations', { userId });
    return response.data;
  }

  async getMessages(conversationId: string, params?: { limit?: number; before?: string }) {
    const response = await this.client.get(`/chat/conversations/${conversationId}/messages`, { params });
    return response.data;
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await this.client.post(`/chat/conversations/${conversationId}/messages`, { content });
    return response.data;
  }

  async markMessagesAsRead(conversationId: string) {
    const response = await this.client.post(`/chat/conversations/${conversationId}/read`);
    return response.data;
  }

  async getUnreadMessageCount() {
    const response = await this.client.get('/chat/unread-count');
    return response.data;
  }

  // Notification endpoints
  async getNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.client.post(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.post('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string) {
    const response = await this.client.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Upload endpoints
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await this.client.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAvatar() {
    const response = await this.client.delete('/upload/avatar');
    return response.data;
  }

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await this.client.post('/upload/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // AI endpoints
  async getAIStatus() {
    const response = await this.client.get('/ai/status');
    return response.data;
  }

  async chatWithAI(message: string, chatHistory: Array<{ content: string; isAI: boolean }> = []) {
    const response = await this.client.post('/ai/chat', { message, chatHistory });
    return response.data;
  }

  async handleAIMention(message: string, conversationHistory: Array<{ content: string; senderName: string }> = []) {
    const response = await this.client.post('/ai/mention', { message, conversationHistory });
    return response.data;
  }

  async getAISuggestion(context: string, type: 'introduction' | 'follow-up' | 'thank-you' | 'application' | 'general' = 'general') {
    const response = await this.client.post('/ai/suggest-message', { context, type });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
