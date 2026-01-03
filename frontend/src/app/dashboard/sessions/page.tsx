'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  MessageCircle,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useSessionsStore, useAuthStore } from '@/lib/store';
import { formatDateTime, getAvatarUrl, getStatusColor } from '@/lib/utils';

export default function SessionsPage() {
  const { user } = useAuthStore();
  const { sessions, loadSessions, cancelSession, isLoading } = useSessionsStore();
  const [filter, setFilter] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ sessionId: string; open: boolean }>({
    sessionId: '',
    open: false,
  });
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const isStudent = user?.role === 'student';

  useEffect(() => {
    loadSessions(filter === 'all' ? undefined : filter);
  }, [filter]);

  const handleCancel = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    setCancellingId(sessionId);
    try {
      await cancelSession(sessionId, 'Cancelled by user');
      toast.success('Session cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel session');
    } finally {
      setCancellingId(null);
    }
  };

  const handleFeedback = async () => {
    // Implementation for feedback submission
    try {
      // await api.addSessionFeedback(feedbackModal.sessionId, { rating, feedback });
      toast.success('Feedback submitted');
      setFeedbackModal({ sessionId: '', open: false });
      setRating(5);
      setFeedback('');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === 'confirmed' && new Date(s.scheduledAt) > new Date()
  );
  const pastSessions = filteredSessions.filter(
    (s) => s.status === 'completed' || new Date(s.scheduledAt) <= new Date()
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            My Sessions
          </h1>
          <p className="text-text-secondary mt-1">
            {isStudent
              ? 'Manage your mentorship sessions with alumni'
              : 'Manage your mentorship sessions with students'}
          </p>
        </div>
        {isStudent && (
          <Link href="/dashboard/mentors" className="btn-primary">
            Book New Session
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-accent-primary text-surface'
                : 'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Upcoming
              </h2>
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <img
                        src={getAvatarUrl(
                          isStudent ? session.alumni?.firstName || '' : session.student?.firstName || '',
                          isStudent ? session.alumni?.lastName || '' : session.student?.lastName || ''
                        )}
                        alt=""
                        className="w-14 h-14 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">
                          {isStudent
                            ? `${session.alumni?.firstName} ${session.alumni?.lastName}`
                            : `${session.student?.firstName} ${session.student?.lastName}`}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {isStudent
                            ? `${session.alumni?.jobTitle} at ${session.alumni?.company}`
                            : `${session.student?.university} • ${session.student?.major}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(session.scheduledAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {session.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-sm py-2"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </a>
                        )}
                        <button
                          onClick={() => handleCancel(session.id)}
                          disabled={cancellingId === session.id}
                          className="btn-danger text-sm py-2"
                        >
                          {cancellingId === session.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-text-secondary">
                          <span className="text-text-tertiary">Notes:</span> {session.notes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Past Sessions
              </h2>
              <div className="space-y-4">
                {pastSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card opacity-80"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <img
                        src={getAvatarUrl(
                          isStudent ? session.alumni?.firstName || '' : session.student?.firstName || '',
                          isStudent ? session.alumni?.lastName || '' : session.student?.lastName || ''
                        )}
                        alt=""
                        className="w-14 h-14 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">
                          {isStudent
                            ? `${session.alumni?.firstName} ${session.alumni?.lastName}`
                            : `${session.student?.firstName} ${session.student?.lastName}`}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-text-tertiary">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(session.scheduledAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {session.status === 'completed' && isStudent && !session.studentRating && (
                          <button
                            onClick={() => setFeedbackModal({ sessionId: session.id, open: true })}
                            className="btn-secondary text-sm py-2"
                          >
                            <Star className="w-4 h-4" />
                            Rate
                          </button>
                        )}
                        {session.studentRating && (
                          <div className="flex items-center gap-1 text-accent-primary">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{session.studentRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
            No sessions found
          </h3>
          <p className="text-text-secondary mb-4">
            {filter === 'all'
              ? "You haven't booked any sessions yet"
              : `No ${filter} sessions`}
          </p>
          {isStudent && (
            <Link href="/dashboard/mentors" className="btn-primary">
              Find a Mentor
            </Link>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-md"
          >
            <h3 className="font-display text-xl font-semibold text-text-primary mb-4">
              Rate Your Session
            </h3>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating
                        ? 'text-accent-primary fill-accent-primary'
                        : 'text-border'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="label">Feedback (optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input min-h-[100px] resize-none"
                placeholder="How was your mentorship session?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFeedbackModal({ sessionId: '', open: false })}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleFeedback} className="btn-primary flex-1">
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
