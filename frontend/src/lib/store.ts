import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'alumni';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface StudentProfile extends User {
  skills: string[];
  domains: string[];
  interests?: string;
  careerGoals?: string[] | string;
  university?: string;
  major?: string;
  graduationYear?: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio?: string;
}

export interface AlumniProfile extends User {
  company?: string;
  jobTitle?: string;
  experienceYears?: number;
  skills: string[];
  domains: string[];
  calcomEventTypeId?: string;
  calcomUsername?: string;
  linkedinUrl?: string;
  isAvailableForMentorship?: boolean;
  maxMentees?: number;
  currentMentees?: number;
  bio?: string;
  graduationYear?: number;
  almaMater?: string;
  fullName?: string;
}

export type Profile = StudentProfile | AlumniProfile;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'alumni';
  }) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login({ email, password });
          const { user, token } = response.data;
          
          localStorage.setItem('alumnet_token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Load full profile
          await get().loadProfile();
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(data);
          const { user, token } = response.data;
          
          localStorage.setItem('alumnet_token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Load full profile
          await get().loadProfile();
        } catch (error: any) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('alumnet_token');
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadProfile: async () => {
        try {
          const response = await api.getProfile();
          set({ profile: response.data });
        } catch (error: any) {
          console.error('Failed to load profile:', error);
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.updateProfile(data);
          set({ profile: response.data, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Failed to update profile';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('alumnet_token');
        if (!token) {
          set({ isAuthenticated: false, user: null, profile: null });
          return false;
        }

        try {
          const response = await api.getCurrentUser();
          set({
            user: response.data,
            token,
            isAuthenticated: true,
          });
          await get().loadProfile();
          return true;
        } catch (error) {
          localStorage.removeItem('alumnet_token');
          set({ isAuthenticated: false, user: null, profile: null, token: null });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      refreshUser: async () => {
        try {
          const response = await api.getCurrentUser();
          set({ user: response.data });
          await get().loadProfile();
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'alumnet-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Matchmaking store
interface Match {
  alumni: AlumniProfile;
  score: number;
  matchDetails: {
    matchedDomains: string[];
    matchedSkills: string[];
    domainMatchCount: number;
    skillMatchCount: number;
    hasCareerAlignment: boolean;
  };
}

interface MatchmakingState {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  lastRefreshed: string | null;
  
  loadMatches: (forceRefresh?: boolean) => Promise<void>;
  clearMatches: () => void;
}

export const useMatchmakingStore = create<MatchmakingState>((set) => ({
  matches: [],
  isLoading: false,
  error: null,
  lastRefreshed: null,

  loadMatches: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = forceRefresh 
        ? await api.refreshMatches(10)
        : await api.getMatches({ limit: 10 });
      
      set({
        matches: response.data.matches,
        lastRefreshed: response.data.refreshedAt,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load matches',
        isLoading: false,
      });
    }
  },

  clearMatches: () => set({ matches: [], lastRefreshed: null }),
}));

// Sessions store
interface Session {
  id: string;
  alumniId: string;
  studentId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingLink?: string;
  notes?: string;
  alumni?: Partial<AlumniProfile>;
  student?: Partial<StudentProfile>;
  studentRating?: number;
  studentFeedback?: string;
}

interface SessionsState {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  
  loadSessions: (status?: string) => Promise<void>;
  bookSession: (alumniId: string, slotTime: string, notes?: string) => Promise<Session>;
  cancelSession: (sessionId: string, reason?: string) => Promise<void>;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getSessions({ status });
      set({ sessions: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load sessions',
        isLoading: false,
      });
    }
  },

  bookSession: async (alumniId, slotTime, notes) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.bookSession({ alumniId, slotTime, notes });
      await get().loadSessions();
      set({ isLoading: false });
      return response.data.session;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to book session';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  cancelSession: async (sessionId, reason) => {
    set({ isLoading: true, error: null });
    try {
      await api.cancelSession(sessionId, reason);
      await get().loadSessions();
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to cancel session';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));

// Opportunities store
interface Opportunity {
  id: string;
  alumniId: string;
  title: string;
  description: string;
  type: string;
  company?: string;
  location?: string;
  isRemote: boolean;
  requiredSkills: string[];
  requiredDomains: string[];
  deadline?: string;
  applicationDeadline?: string;
  applicationLink?: string;
  externalLink?: string;
  isActive: boolean;
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  alumni?: Partial<AlumniProfile>;
  relevanceScore?: number;
  poster?: Partial<AlumniProfile>;
  targetDomains?: string[];
  postedBy?: string;
}

interface OpportunitiesState {
  opportunities: Opportunity[];
  myOpportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pages: number;
  } | null;
  
  loadOpportunities: (params?: { type?: string; page?: number; limit?: number }) => Promise<void>;
  loadMyOpportunities: () => Promise<void>;
  createOpportunity: (data: Partial<Opportunity>) => Promise<Opportunity>;
  applyForOpportunity: (id: string, coverNote?: string) => Promise<void>;
}

export const useOpportunitiesStore = create<OpportunitiesState>((set, get) => ({
  opportunities: [],
  myOpportunities: [],
  isLoading: false,
  error: null,
  pagination: null,

  loadOpportunities: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getOpportunities(params);
      set({
        opportunities: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load opportunities',
        isLoading: false,
      });
    }
  },

  loadMyOpportunities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getMyOpportunities();
      set({ myOpportunities: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load opportunities',
        isLoading: false,
      });
    }
  },

  createOpportunity: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createOpportunity(data as any);
      await get().loadMyOpportunities();
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create opportunity';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  applyForOpportunity: async (id, coverNote) => {
    set({ isLoading: true, error: null });
    try {
      await api.applyForOpportunity(id, { coverNote });
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to apply';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));
