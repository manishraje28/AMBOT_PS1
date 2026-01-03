'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  CheckCircle,
  XCircle,
  Star,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { formatDate, getOpportunityTypeColor, getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  id: string;
  status: string;
  coverNote?: string;
  resumeUrl?: string;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    major?: string;
    graduationYear?: number;
    skills: string[];
  };
}

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const isStudent = user?.role === 'student';
  const isOwner = user?.role === 'alumni' && (opportunity?.alumni?.id === user?.id || opportunity?.alumniId === user?.id);

  useEffect(() => {
    fetchOpportunity();
  }, [params.id]);

  // Fetch applications when user is alumni and owns this opportunity
  useEffect(() => {
    const checkAndFetchApplications = async () => {
      console.log('checkAndFetchApplications called:', { 
        userId: user?.id, 
        userRole: user?.role,
        opportunityId: opportunity?.id,
        alumniId: opportunity?.alumni?.id,
        opportunityAlumniId: opportunity?.alumniId
      });
      
      if (!user || !opportunity) {
        console.log('User or opportunity not ready yet');
        return;
      }
      
      // Check if current user is the alumni who posted this opportunity
      const isAlumniOwner = user.role === 'alumni' && 
        (opportunity.alumni?.id === user.id || opportunity.alumniId === user.id);
      
      console.log('Is alumni owner:', isAlumniOwner);
      
      if (isAlumniOwner) {
        await fetchApplications();
      }
    };
    
    checkAndFetchApplications();
  }, [user?.id, opportunity?.id]);

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

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      console.log('Fetching applications for opportunity:', params.id);
      const response = await api.getOpportunityApplications(params.id as string);
      console.log('Applications response:', response);
      setApplications(response.data || response.applications || []);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error.response?.data || error.message);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    setUpdatingStatus(applicationId);
    try {
      await api.updateApplicationStatus(applicationId, status);
      toast.success(`Application ${status}`);
      // Refresh applications
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
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

          {/* Applications Section (Alumni only) */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-primary" />
                  Applications ({applications.length})
                </h2>
                <button
                  onClick={fetchApplications}
                  className="text-xs px-3 py-1 bg-accent-primary/20 text-accent-primary rounded hover:bg-accent-primary/30 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {loadingApplications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {applications.map((app) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-surface-100 rounded-xl border border-border"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <img
                            src={getAvatarUrl(app.student.firstName, app.student.lastName, app.student.avatarUrl)}
                            alt={app.student.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-text-primary">{app.student.fullName}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                app.status === 'pending' || app.status === 'applied' ? 'bg-yellow-500/20 text-yellow-400' :
                                app.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                                app.status === 'shortlisted' ? 'bg-purple-500/20 text-purple-400' :
                                app.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            
                            <p className="text-text-secondary text-sm mb-2">
                              {app.student.email}
                              {app.student.major && ` • ${app.student.major}`}
                              {app.student.graduationYear && ` '${app.student.graduationYear.toString().slice(-2)}`}
                            </p>

                            {app.student.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {app.student.skills.slice(0, 5).map((skill) => (
                                  <span key={skill} className="text-xs px-2 py-0.5 bg-surface rounded text-text-tertiary">
                                    {skill}
                                  </span>
                                ))}
                                {app.student.skills.length > 5 && (
                                  <span className="text-xs text-text-tertiary">+{app.student.skills.length - 5} more</span>
                                )}
                              </div>
                            )}

                            {app.coverNote && (
                              <p className="text-text-secondary text-sm bg-surface p-3 rounded-lg mb-3">
                                "{app.coverNote}"
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-tertiary">
                                Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                              </span>

                              {/* Action Buttons */}
                              {(app.status === 'pending' || app.status === 'applied') && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                                    disabled={updatingStatus === app.id}
                                    className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                    title="Shortlist"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                                    disabled={updatingStatus === app.id}
                                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                    title="Accept"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                    disabled={updatingStatus === app.id}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              {app.status === 'shortlisted' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                                    disabled={updatingStatus === app.id}
                                    className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                    disabled={updatingStatus === app.id}
                                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
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
