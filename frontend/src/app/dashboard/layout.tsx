'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  User,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Plus,
  MessageSquare,
  Bell,
  FileText,
} from 'lucide-react';
import { useAuthStore, useChatStore, useNotificationStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { getAvatarUrl } from '@/lib/utils';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout, checkAuth, isAuthenticated } = useAuthStore();
  const { unreadCount: messageUnreadCount, loadUnreadCount: loadMessageUnreadCount } = useChatStore();
  const { 
    notifications, 
    unreadCount: notificationUnreadCount, 
    loadNotifications, 
    loadUnreadCount: loadNotificationUnreadCount,
    markAsRead,
    markAllAsRead 
  } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  
  // Initialize socket connection
  useSocket();

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (!authenticated) {
        router.push('/login');
      } else {
        // Load unread counts
        loadMessageUnreadCount();
        loadNotificationUnreadCount();
        loadNotifications();
      }
    });
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isStudent = user.role === 'student';

  const navigation = isStudent
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Find Mentors', href: '/dashboard/mentors', icon: Users },
        { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { name: 'My Sessions', href: '/dashboard/sessions', icon: Calendar },
        { name: 'Opportunities', href: '/dashboard/opportunities', icon: Briefcase },
        { name: 'My Applications', href: '/dashboard/applications', icon: FileText },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { name: 'My Sessions', href: '/dashboard/sessions', icon: Calendar },
        { name: 'Opportunites', href: '/dashboard/opportunities', icon: Briefcase },
        { name: 'Post Opportunity', href: '/dashboard/opportunities/new', icon: Plus },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-50 border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden">
                <img src="/logo.png" alt="AlumNet" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-lg text-text-primary">AlumNet</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-100">
              <img
                src={getAvatarUrl(user.firstName, user.lastName, user.avatarUrl)}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full mt-3 px-4 py-2.5 text-text-secondary hover:text-accent-danger hover:bg-accent-danger/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              {/* Messages Icon */}
              <Link
                href="/dashboard/messages"
                className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-100"
              >
                <MessageSquare className="w-5 h-5" />
                {messageUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-surface text-xs font-bold rounded-full flex items-center justify-center">
                    {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-100"
                >
                  <Bell className="w-5 h-5" />
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setNotificationDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface-50 border border-border rounded-xl shadow-2xl z-50"
                      >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-text-primary">Notifications</h3>
                          {notificationUnreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs text-accent-primary hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-text-tertiary">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {notifications.slice(0, 10).map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setNotificationDropdownOpen(false);
                                  // Navigate based on notification type
                                  if (notification.type === 'application_received' && notification.data?.opportunityId) {
                                    router.push(`/dashboard/opportunities/${notification.data.opportunityId}`);
                                  } else if (notification.type === 'application_status' && notification.data?.opportunityId) {
                                    router.push('/dashboard/applications');
                                  } else if (notification.type === 'new_message' && notification.data?.conversationId) {
                                    router.push('/dashboard/messages');
                                  }
                                }}
                                className={`p-4 hover:bg-surface-100 cursor-pointer transition-colors ${
                                  !notification.is_read ? 'bg-accent-primary/5' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.is_read ? 'bg-transparent' : 'bg-accent-primary'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                                    <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{notification.message}</p>
                                    <p className="text-xs text-text-tertiary mt-2">
                                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <img
                  src={getAvatarUrl(user.firstName, user.lastName, user.avatarUrl)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden sm:block text-sm font-medium">
                  {user.firstName}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
