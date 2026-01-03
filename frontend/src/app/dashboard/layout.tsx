'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getAvatarUrl } from '@/lib/utils';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout, checkAuth, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (!authenticated) {
        router.push('/login');
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
        { name: 'My Sessions', href: '/dashboard/sessions', icon: Calendar },
        { name: 'Opportunities', href: '/dashboard/opportunities', icon: Briefcase },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Sessions', href: '/dashboard/sessions', icon: Calendar },
        { name: 'My Opportunities', href: '/dashboard/opportunities', icon: Briefcase },
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
              <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-surface" />
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
                className="w-10 h-10 rounded-full"
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
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <img
                  src={getAvatarUrl(user.firstName, user.lastName, user.avatarUrl)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-8 h-8 rounded-full"
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
