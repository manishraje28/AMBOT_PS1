'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useMatchmakingStore, useAuthStore } from '@/lib/store';
import { getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';

export default function MentorsPage() {
  const { user } = useAuthStore();
  const { matches, loadMatches, isLoading, lastRefreshed } = useMatchmakingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [allAlumni, setAllAlumni] = useState<any[]>([]);
  const [loadingAlumni, setLoadingAlumni] = useState(false);
  const [viewMode, setViewMode] = useState<'matches' | 'all'>('matches');

  useEffect(() => {
    loadMatches();
    fetchAllAlumni();
  }, []);

  const fetchAllAlumni = async () => {
    setLoadingAlumni(true);
    try {
      const response = await api.getAllAlumni({ limit: 50, availableOnly: true });
      setAllAlumni(response.data);
    } catch (error) {
      console.error('Failed to fetch alumni:', error);
    } finally {
      setLoadingAlumni(false);
    }
  };

  const handleRefresh = () => {
    loadMatches(true);
  };

  const displayedMentors = viewMode === 'matches'
    ? matches.filter((m) =>
        (m.alumni.fullName || `${m.alumni.firstName} ${m.alumni.lastName}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.alumni.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.alumni.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allAlumni.filter((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Find Mentors
          </h1>
          <p className="text-text-secondary mt-1">
            Discover alumni mentors matched to your skills and goals
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, company, or role..."
            className="input pl-12"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'matches'
                ? 'bg-accent-primary text-surface'
                : 'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Matches
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-accent-primary text-surface'
                : 'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            All Mentors
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results info */}
      {viewMode === 'matches' && lastRefreshed && (
        <p className="text-text-tertiary text-sm mb-4">
          {matches.length} matches found • Last updated {new Date(lastRefreshed).toLocaleTimeString()}
        </p>
      )}

      {/* Mentors grid */}
      {(isLoading || loadingAlumni) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : displayedMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMentors.map((item, index) => {
            const mentor = viewMode === 'matches' ? item.alumni : item;
            const matchScore = viewMode === 'matches' ? item.score : null;
            const matchDetails = viewMode === 'matches' ? item.matchDetails : null;

            return (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/dashboard/mentors/${mentor.id}`}
                  className="card-hover block group"
                >
                  {/* Match score badge */}
                  {matchScore !== null && (
                    <div className="flex items-center gap-1 mb-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/10 rounded-full">
                        <Star className="w-4 h-4 text-accent-primary" />
                        <span className="text-sm font-medium text-accent-primary">
                          {matchScore} match score
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mentor info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={getAvatarUrl(mentor.firstName || mentor.fullName?.split(' ')[0], mentor.lastName || mentor.fullName?.split(' ')[1], mentor.avatarUrl)}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                        {mentor.fullName || `${mentor.firstName} ${mentor.lastName}`}
                      </h3>
                      <p className="text-text-secondary text-sm truncate">
                        {mentor.jobTitle}
                      </p>
                      <div className="flex items-center gap-1 text-text-tertiary text-sm mt-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="truncate">{mentor.company}</span>
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
                    <span>{mentor.experienceYears || 0}+ years exp.</span>
                    {mentor.isAvailableForMentorship && (
                      <span className="flex items-center gap-1 text-accent-success">
                        <Calendar className="w-3.5 h-3.5" />
                        Available
                      </span>
                    )}
                  </div>

                  {/* Matched skills/domains */}
                  {matchDetails && (matchDetails.matchedSkills.length > 0 || matchDetails.matchedDomains.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-text-tertiary mb-2">Matching:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchDetails.matchedDomains.slice(0, 2).map((domain: string) => (
                          <span key={domain} className="tag-secondary text-xs">{domain}</span>
                        ))}
                        {matchDetails.matchedSkills.slice(0, 2).map((skill: string) => (
                          <span key={skill} className="tag-primary text-xs">{skill}</span>
                        ))}
                        {(matchDetails.matchedDomains.length + matchDetails.matchedSkills.length) > 4 && (
                          <span className="tag text-xs">
                            +{matchDetails.matchedDomains.length + matchDetails.matchedSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills preview for non-matches */}
                  {viewMode === 'all' && mentor.skills?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.skills.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="tag text-xs">{skill}</span>
                        ))}
                        {mentor.skills.length > 3 && (
                          <span className="tag text-xs">+{mentor.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
            No mentors found
          </h3>
          <p className="text-text-secondary">
            {searchTerm
              ? 'Try adjusting your search terms'
              : viewMode === 'matches'
              ? 'Complete your profile to get better matches'
              : 'No alumni mentors are available at the moment'}
          </p>
          {viewMode === 'matches' && (
            <Link href="/dashboard/profile" className="btn-primary mt-4">
              Update Profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
