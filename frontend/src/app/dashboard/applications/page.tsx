'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Star,
  Building2,
  Calendar,
  ExternalLink,
  Filter,
  Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

interface Application {
  id: string;
  status: string;
  coverNote?: string;
  createdAt: string;
  opportunity: {
    id: string;
    title: string;
    type: string;
    company?: string;
    deadline?: string;
    isActive: boolean;
  };
}

const statusConfig: Record<string, {
  icon: typeof Clock;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    label: 'Pending Review',
  },
  applied: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    label: 'Applied',
  },
  reviewed: {
    icon: AlertCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    label: 'Under Review',
  },
  shortlisted: {
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    label: 'Shortlisted',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/30',
    label: 'Not Selected',
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    label: 'Accepted',
  },
};

// Default config for unknown statuses
const defaultStatusConfig = {
  icon: FileText,
  color: 'text-gray-400',
  bgColor: 'bg-gray-400/10',
  borderColor: 'border-gray-400/30',
  label: 'Unknown',
};

const typeColors: Record<string, string> = {
  job: 'bg-blue-500/20 text-blue-400',
  internship: 'bg-green-500/20 text-green-400',
  mentorship: 'bg-purple-500/20 text-purple-400',
  project: 'bg-orange-500/20 text-orange-400',
  research: 'bg-cyan-500/20 text-cyan-400',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const response = await api.getMyApplications({ limit: 50 });
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    
    setWithdrawingId(applicationId);
    try {
      await api.withdrawApplication(applicationId);
      toast.success('Application withdrawn successfully');
      // Remove from list
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    // Treat 'applied' status as 'pending' for filtering
    if (filter === 'pending') return app.status === 'pending' || app.status === 'applied';
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending' || a.status === 'applied').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Applications</h1>
        <p className="text-[#7a7a8c]">Track the status of your opportunity applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a35]"
        >
          <p className="text-[#7a7a8c] text-sm mb-1">Total Applications</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a35]"
        >
          <p className="text-yellow-400 text-sm mb-1">Pending</p>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a35]"
        >
          <p className="text-purple-400 text-sm mb-1">Shortlisted</p>
          <p className="text-2xl font-bold text-white">{stats.shortlisted}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a35]"
        >
          <p className="text-green-400 text-sm mb-1">Accepted</p>
          <p className="text-2xl font-bold text-white">{stats.accepted}</p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-[#7a7a8c]" />
        {['all', 'pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              filter === status
                ? "bg-[#e8b931] text-black"
                : "bg-[#1a1a22] text-[#7a7a8c] hover:text-white hover:bg-[#2a2a35]"
            )}
          >
            {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label || status}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#e8b931] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1a1a22] flex items-center justify-center">
            <FileText className="w-10 h-10 text-[#7a7a8c]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No applications found</h3>
          <p className="text-[#7a7a8c] mb-6">
            {filter === 'all' 
              ? "You haven't applied to any opportunities yet"
              : `No ${(statusConfig[filter]?.label || filter).toLowerCase()} applications`
            }
          </p>
          <Link href="/dashboard/opportunities">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black font-semibold rounded-xl"
            >
              Browse Opportunities
            </motion.button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredApplications.map((application, index) => {
              const config = statusConfig[application.status] || defaultStatusConfig;
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    "bg-[#1a1a22] rounded-xl p-5 border transition-all hover:border-[#e8b931]/30",
                    config.borderColor
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={clsx("p-2 rounded-lg", config.bgColor)}>
                          <StatusIcon className={clsx("w-5 h-5", config.color)} />
                        </div>

                        <div className="flex-1">
                          {/* Title */}
                          <Link href={`/dashboard/opportunities/${application.opportunity.id}`}>
                            <h3 className="text-lg font-semibold text-white hover:text-[#e8b931] transition-colors">
                              {application.opportunity.title}
                            </h3>
                          </Link>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#7a7a8c]">
                            {application.opportunity.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {application.opportunity.company}
                              </span>
                            )}
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-xs",
                              typeColors[application.opportunity.type] || 'bg-gray-500/20 text-gray-400'
                            )}>
                              {application.opportunity.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Cover Note Preview */}
                          {application.coverNote && (
                            <p className="mt-2 text-sm text-[#7a7a8c] line-clamp-2">
                              {application.coverNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "px-4 py-2 rounded-lg text-sm font-medium",
                        config.bgColor,
                        config.color
                      )}>
                        {config.label}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Withdraw button - only for pending/applied applications */}
                        {(application.status === 'pending' || application.status === 'applied') && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWithdraw(application.id)}
                            disabled={withdrawingId === application.id}
                            className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            title="Withdraw Application"
                          >
                            {withdrawingId === application.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}
                        
                        <Link href={`/dashboard/opportunities/${application.opportunity.id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-[#2a2a35] rounded-lg text-[#7a7a8c] hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Deadline Warning */}
                  {application.opportunity.deadline && 
                   new Date(application.opportunity.deadline) > new Date() && 
                   (application.status === 'pending' || application.status === 'applied') && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a35]">
                      <p className="text-sm text-[#7a7a8c]">
                        Deadline: {format(new Date(application.opportunity.deadline), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
