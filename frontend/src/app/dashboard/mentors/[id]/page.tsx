'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  Linkedin,
  MapPin,
  Star,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore, useChatStore } from '@/lib/store';
import { getAvatarUrl, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Slot {
  time: string;
  available: boolean;
}

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { createConversation } = useChatStore();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    fetchMentor();
  }, [params.id]);

  const fetchMentor = async () => {
    try {
      const response = await api.getAlumniById(params.id as string);
      setMentor(response.data);
    } catch (error) {
      console.error('Failed to fetch mentor:', error);
      toast.error('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!mentor?.calcomEventTypeId) {
      toast.error('This mentor has not configured their availability yet');
      return;
    }

    setSlotsLoading(true);
    try {
      const response = await api.getAvailableSlots(params.id as string);
      setSlots(response.data.slots || []);
      setShowBookingFlow(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load available slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      const response = await api.bookSession({
        alumniId: params.id as string,
        slotTime: selectedSlot,
        notes,
      });

      toast.success('Session booked successfully!');
      router.push('/dashboard/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  const handleStartChat = async () => {
    setStartingChat(true);
    try {
      await createConversation(mentor.id);
      toast.success('Chat started!');
      router.push('/dashboard/messages');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-32 mb-8" />
        <div className="skeleton h-64 rounded-xl mb-6" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
          Mentor not found
        </h2>
        <p className="text-text-secondary mb-4">
          This mentor profile doesn't exist or is no longer available.
        </p>
        <Link href="/dashboard/mentors" className="btn-primary">
          Browse Mentors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard/mentors"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to mentors
      </Link>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={getAvatarUrl(mentor.firstName, mentor.lastName, mentor.avatarUrl)}
            alt={mentor.fullName}
            className="w-24 h-24 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {mentor.fullName}
                </h1>
                <p className="text-text-secondary text-lg">
                  {mentor.jobTitle} at {mentor.company}
                </p>
              </div>
              {mentor.isAvailableForMentorship && (
                <span className="tag-primary">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Available
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                {mentor.experienceYears}+ years experience
              </span>
              {mentor.almaMater && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {mentor.almaMater} '{mentor.graduationYear?.toString().slice(-2)}
                </span>
              )}
            </div>

            {mentor.linkedinUrl && (
              <a
                href={mentor.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent-primary hover:underline mt-3"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {mentor.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                About
              </h2>
              <p className="text-text-secondary whitespace-pre-wrap">{mentor.bio}</p>
            </motion.div>
          )}

          {/* Skills */}
          {mentor.skills?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((skill: string) => (
                  <span key={skill} className="tag-primary">{skill}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Domains */}
          {mentor.domains?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Expertise Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.domains.map((domain: string) => (
                  <span key={domain} className="tag-secondary">{domain}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card sticky top-24"
          >
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Book a Session
            </h2>

            {!showBookingFlow ? (
              <>
                <p className="text-text-secondary text-sm mb-4">
                  Schedule a mentorship session with {mentor.firstName}. Sessions are typically 30 minutes.
                </p>
                <button
                  onClick={fetchSlots}
                  disabled={slotsLoading || !mentor.isAvailableForMentorship}
                  className="btn-primary w-full"
                >
                  {slotsLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading slots...
                    </span>
                  ) : !mentor.isAvailableForMentorship ? (
                    'Currently Unavailable'
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      View Available Slots
                    </>
                  )}
                </button>

                {!mentor.calcomEventTypeId && (
                  <p className="text-text-tertiary text-xs mt-3 text-center">
                    This mentor hasn't set up scheduling yet.
                  </p>
                )}

                {/* Send Message Button */}
                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="btn-secondary w-full mt-3"
                >
                  {startingChat ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Starting chat...
                    </span>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Available slots */}
                {slots.length > 0 ? (
                  <>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {slots.map((slot: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedSlot === slot.time
                              ? 'bg-accent-primary text-surface'
                              : 'bg-surface-100 text-text-primary hover:bg-surface-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(slot.time, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="label">Notes for the mentor (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input min-h-[80px] resize-none"
                        placeholder="What would you like to discuss?"
                        maxLength={500}
                      />
                    </div>

                    <button
                      onClick={handleBookSession}
                      disabled={!selectedSlot || booking}
                      className="btn-primary w-full"
                    >
                      {booking ? 'Booking...' : 'Confirm Booking'}
                    </button>

                    <button
                      onClick={() => {
                        setShowBookingFlow(false);
                        setSelectedSlot(null);
                        setSlots([]);
                      }}
                      className="btn-ghost w-full"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                    <p className="text-text-secondary text-sm">
                      No available slots in the next 2 weeks
                    </p>
                    <button
                      onClick={() => setShowBookingFlow(false)}
                      className="btn-ghost mt-4"
                    >
                      Go back
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
