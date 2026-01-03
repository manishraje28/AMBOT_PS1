'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  User,
  Send,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { formatDate, getOpportunityTypeColor, getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const isStudent = user?.role === 'student';
  const isOwner = opportunity?.postedBy === user?.id;

  useEffect(() => {
    fetchOpportunity();
  }, [params.id]);

  const fetchOpportunity = async () => {
    try {
      const response = await api.getOpportunityById(params.id as string);
      setOpportunity(response.data);
      // Check if already applied
      // setHasApplied(response.data.hasApplied);
    } catch (error) {
      console.error('Failed to fetch opportunity:', error);
      toast.error('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (opportunity.applicationLink) {
      window.open(opportunity.applicationLink, '_blank');
      return;
    }

    setApplying(true);
    try {
      await api.applyToOpportunity(params.id as string, { message: applicationMessage });
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setShowApplicationForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
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

  if (!opportunity) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
          Opportunity not found
        </h2>
        <p className="text-text-secondary mb-4">
          This opportunity doesn't exist or has been removed.
        </p>
        <Link href="/dashboard/opportunities" className="btn-primary">
          Browse Opportunities
        </Link>
      </div>
    );
  }

  const isDeadlinePassed = opportunity.applicationDeadline && new Date(opportunity.applicationDeadline) < new Date();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard/opportunities"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to opportunities
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`tag capitalize ${getOpportunityTypeColor(opportunity.type)}`}>
                  {opportunity.type}
                </span>
                {opportunity.isRemote && <span className="tag">Remote</span>}
                {!opportunity.isActive && <span className="tag bg-surface-100">Closed</span>}
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold text-text-primary mb-4">
              {opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              {opportunity.company && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  {opportunity.company}
                </span>
              )}
              {opportunity.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {opportunity.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Posted {formatDate(opportunity.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Description
            </h2>
            <div className="prose prose-invert max-w-none text-text-secondary whitespace-pre-wrap">
              {opportunity.description}
            </div>
          </motion.div>

          {/* Required Skills */}
          {opportunity.requiredSkills?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((skill: string) => (
                  <span key={skill} className="tag-primary">{skill}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Target Domains */}
          {opportunity.targetDomains?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Relevant Domains
              </h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.targetDomains.map((domain: string) => (
                  <span key={domain} className="tag-secondary">{domain}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card sticky top-24"
          >
            {/* Application deadline */}
            {opportunity.applicationDeadline && (
              <div className={`mb-4 p-3 rounded-lg ${isDeadlinePassed ? 'bg-accent-error/10' : 'bg-accent-primary/10'}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${isDeadlinePassed ? 'text-accent-error' : 'text-accent-primary'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-accent-error' : 'text-accent-primary'}`}>
                      {isDeadlinePassed ? 'Deadline passed' : 'Apply by'}
                    </p>
                    <p className="text-text-primary font-medium">
                      {formatDate(opportunity.applicationDeadline, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Apply section */}
            {isStudent && (
              <>
                {hasApplied ? (
                  <div className="p-4 bg-accent-success/10 rounded-lg text-center">
                    <p className="text-accent-success font-medium">✓ Application Submitted</p>
                  </div>
                ) : isDeadlinePassed ? (
                  <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                    Deadline Passed
                  </button>
                ) : !opportunity.isActive ? (
                  <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                    Opportunity Closed
                  </button>
                ) : showApplicationForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Application Message</label>
                      <textarea
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        className="input min-h-[120px] resize-none"
                        placeholder="Introduce yourself and explain why you're interested..."
                        maxLength={1000}
                      />
                    </div>
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="btn-primary w-full"
                    >
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      onClick={() => setShowApplicationForm(false)}
                      className="btn-ghost w-full"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (opportunity.applicationLink) {
                        window.open(opportunity.applicationLink, '_blank');
                      } else {
                        setShowApplicationForm(true);
                      }
                    }}
                    className="btn-primary w-full"
                  >
                    {opportunity.applicationLink ? (
                      <>
                        Apply on External Site
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Apply Now
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Posted by info */}
            {opportunity.poster && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-text-tertiary text-sm mb-3">Posted by</p>
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(opportunity.poster.firstName, opportunity.poster.lastName)}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-text-primary font-medium">
                      {opportunity.poster.firstName} {opportunity.poster.lastName}
                    </p>
                    {opportunity.poster.company && (
                      <p className="text-text-secondary text-sm">{opportunity.poster.company}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
