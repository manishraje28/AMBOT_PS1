'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react';
import { useAuthStore, useMatchmakingStore, useSessionsStore, useOpportunitiesStore } from '@/lib/store';
import { formatDateTime, formatRelativeTime, getAvatarUrl } from '@/lib/utils';

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const { matches, loadMatches, isLoading: matchesLoading } = useMatchmakingStore();
  const { sessions, loadSessions, isLoading: sessionsLoading } = useSessionsStore();
  const { opportunities, loadOpportunities, isLoading: oppsLoading } = useOpportunitiesStore();

  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (isStudent) {
      loadMatches();
    }
    loadSessions();
    loadOpportunities({ limit: 5 });
  }, [isStudent]);

  const upcomingSessions = sessions
    .filter((s) => s.status === 'confirmed' && new Date(s.scheduledAt) > new Date())
    .slice(0, 3);

  const stats = isStudent
    ? [
        { label: 'Matched Mentors', value: matches.length, icon: Users, color: 'text-accent-primary' },
        { label: 'Sessions Booked', value: sessions.length, icon: Calendar, color: 'text-accent-tertiary' },
        { label: 'Opportunities', value: opportunities.length, icon: Briefcase, color: 'text-accent-success' },
      ]
    : [
        { label: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'text-accent-primary' },
        { label: 'Active Mentees', value: (profile as any)?.currentMentees || 0, icon: Users, color: 'text-accent-tertiary' },
        { label: 'Opportunities Posted', value: opportunities.length, icon: Briefcase, color: 'text-accent-success' },
      ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-text-secondary mt-1">
            {isStudent
              ? 'Find mentors, book sessions, and discover opportunities.'
              : 'Manage your mentorship sessions and opportunities.'}
          </p>
        </div>
        {isStudent && (
          <Link href="/dashboard/mentors" className="btn-primary">
            Find Mentors
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">{stat.label}</p>
                <p className="font-display text-3xl font-bold text-text-primary mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Upcoming Sessions
            </h2>
            <Link href="/dashboard/sessions" className="text-accent-primary text-sm hover:underline">
              View all
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-lg" />
              ))}
            </div>
          ) : upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 bg-surface-100 rounded-lg"
                >
                  <img
                    src={getAvatarUrl(
                      isStudent ? session.alumni?.firstName || '' : session.student?.firstName || '',
                      isStudent ? session.alumni?.lastName || '' : session.student?.lastName || ''
                    )}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {isStudent
                        ? `${session.alumni?.firstName} ${session.alumni?.lastName}`
                        : `${session.student?.firstName} ${session.student?.lastName}`}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(session.scheduledAt)}
                    </div>
                  </div>
                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm py-2"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No upcoming sessions</p>
              {isStudent && (
                <Link href="/dashboard/mentors" className="link text-sm mt-2 inline-block">
                  Book your first session
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Matched Mentors (Students) / Recent Activity (Alumni) */}
        {isStudent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Top Matches
              </h2>
              <Link href="/dashboard/mentors" className="text-accent-primary text-sm hover:underline">
                View all
              </Link>
            </div>

            {matchesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-4">
                {matches.slice(0, 3).map((match) => (
                  <Link
                    key={match.alumni.id}
                    href={`/dashboard/mentors/${match.alumni.id}`}
                    className="flex items-center gap-4 p-4 bg-surface-100 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    <img
                      src={getAvatarUrl(match.alumni.firstName, match.alumni.lastName, match.alumni.avatarUrl)}
                      alt=""
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {match.alumni.fullName || `${match.alumni.firstName} ${match.alumni.lastName}`}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {match.alumni.jobTitle} at {match.alumni.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-accent-primary">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">{match.score}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">No matches yet</p>
                <Link href="/dashboard/profile" className="link text-sm mt-2 inline-block">
                  Complete your profile
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Your Opportunities
              </h2>
              <Link href="/dashboard/opportunities/new" className="text-accent-primary text-sm hover:underline">
                Post new
              </Link>
            </div>

            {oppsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.slice(0, 4).map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/dashboard/opportunities/${opp.id}`}
                    className="flex items-center justify-between p-4 bg-surface-100 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{opp.title}</p>
                      <p className="text-sm text-text-tertiary">
                        {opp.applicationsCount} applications
                      </p>
                    </div>
                    <span className="tag capitalize">{opp.type}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">No opportunities posted</p>
                <Link href="/dashboard/opportunities/new" className="link text-sm mt-2 inline-block">
                  Post your first opportunity
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Opportunities Feed (Students only) */}
      {isStudent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Latest Opportunities
            </h2>
            <Link href="/dashboard/opportunities" className="text-accent-primary text-sm hover:underline">
              View all
            </Link>
          </div>

          {oppsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 rounded-lg" />
              ))}
            </div>
          ) : opportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map((opp) => (
                <Link
                  key={opp.id}
                  href={`/dashboard/opportunities/${opp.id}`}
                  className="p-4 bg-surface-100 rounded-lg hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-text-primary line-clamp-1">{opp.title}</h3>
                    <span className="tag text-xs capitalize shrink-0">{opp.type}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">
                    {opp.company || opp.alumni?.company}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {opp.requiredSkills?.slice(0, 2).map((skill) => (
                      <span key={skill} className="tag text-xs">{skill}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No opportunities available</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
