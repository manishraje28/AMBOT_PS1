'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Briefcase,
  MapPin,
  Clock,
  Building,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useOpportunitiesStore, useAuthStore } from '@/lib/store';
import { formatDate, getOpportunityTypeColor } from '@/lib/utils';

export default function OpportunitiesPage() {
  const { user } = useAuthStore();
  const { opportunities, loadOpportunities, isLoading } = useOpportunitiesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const isAlumni = user?.role === 'alumni';

  useEffect(() => {
    loadOpportunities({ type: typeFilter || undefined });
  }, [typeFilter]);

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const opportunityTypes = [
    { value: '', label: 'All Types' },
    { value: 'job', label: 'Full-time Jobs' },
    { value: 'internship', label: 'Internships' },
    { value: 'project', label: 'Projects' },
    { value: 'event', label: 'Events' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Opportunities
          </h1>
          <p className="text-text-secondary mt-1">
            Discover jobs, internships, and projects shared by alumni
          </p>
        </div>
        {isAlumni && (
          <Link href="/dashboard/opportunities/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Post Opportunity
          </Link>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search opportunities..."
            className="input pl-12"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input appearance-none pr-10 min-w-[160px]"
          >
            {opportunityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOpportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/dashboard/opportunities/${opportunity.id}`}
                className="card-hover block group h-full"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`tag capitalize ${getOpportunityTypeColor(opportunity.type)}`}>
                        {opportunity.type}
                      </span>
                      {opportunity.isRemote && (
                        <span className="tag">Remote</span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2">
                      {opportunity.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
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
                </div>

                <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                  {opportunity.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-text-tertiary text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {opportunity.applicationDeadline
                      ? `Apply by ${formatDate(opportunity.applicationDeadline, { month: 'short', day: 'numeric' })}`
                      : `Posted ${formatDate(opportunity.createdAt, { month: 'short', day: 'numeric' })}`}
                  </span>
                  {opportunity.applicationLink && (
                    <span className="text-accent-primary text-sm flex items-center gap-1">
                      Apply
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Skills */}
                {opportunity.requiredSkills?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.requiredSkills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="tag-primary text-xs">{skill}</span>
                      ))}
                      {opportunity.requiredSkills.length > 3 && (
                        <span className="tag text-xs">+{opportunity.requiredSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
            No opportunities found
          </h3>
          <p className="text-text-secondary mb-4">
            {searchTerm || typeFilter
              ? 'Try adjusting your filters'
              : 'No opportunities have been posted yet'}
          </p>
          {isAlumni && (
            <Link href="/dashboard/opportunities/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Post an Opportunity
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
