'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, X, Calendar, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { SKILL_OPTIONS, DOMAIN_OPTIONS } from '@/lib/utils';
import api from '@/lib/api';

export default function NewOpportunityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'job',
    company: '',
    location: '',
    isRemote: false,
    applicationLink: '',
    applicationDeadline: '',
    requiredSkills: [] as string[],
    targetDomains: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        company: formData.company || undefined,
        location: formData.location || undefined,
        isRemote: formData.isRemote,
        requiredSkills: formData.requiredSkills,
        requiredDomains: formData.targetDomains,
        deadline: formData.applicationDeadline || undefined,
        externalLink: formData.applicationLink || undefined,
      };
      console.log('Sending opportunity payload:', payload);
      await api.createOpportunity(payload);
      toast.success('Opportunity posted successfully!');
      router.push('/dashboard/opportunities');
    } catch (error: any) {
      console.error('Create opportunity error:', error.response?.data);
      const details = error.response?.data?.details;
      if (details && Array.isArray(details)) {
        details.forEach((d: { field: string; message: string }) => toast.error(`${d.field}: ${d.message}`));
      } else {
        toast.error(error.response?.data?.error || 'Failed to create opportunity');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  const toggleDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDomains: prev.targetDomains.includes(domain)
        ? prev.targetDomains.filter((d) => d !== domain)
        : [...prev.targetDomains, domain],
    }));
  };

  // Redirect if not alumni
  if (user?.role !== 'alumni') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
          Access Restricted
        </h2>
        <p className="text-text-secondary mb-4">
          Only alumni can post opportunities.
        </p>
        <Link href="/dashboard/opportunities" className="btn-primary">
          Browse Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard/opportunities"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to opportunities
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Post an Opportunity
        </h1>
        <p className="text-text-secondary mb-8">
          Share a job, internship, or project with students
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g., Software Engineering Intern"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: 'job', label: 'Job' },
                { value: 'internship', label: 'Internship' },
                { value: 'project', label: 'Project' },
                { value: 'referral', label: 'Referral' },
                { value: 'mentorship', label: 'Mentorship' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    formData.type === type.value
                      ? 'bg-accent-primary text-surface'
                      : 'bg-surface-100 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Company and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="input"
                placeholder="e.g., Google"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </div>

          {/* Remote toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isRemote: !formData.isRemote })}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.isRemote ? 'bg-accent-primary' : 'bg-surface-100'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.isRemote ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-text-primary">Remote position available</span>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[200px] resize-y"
              placeholder="Describe the opportunity, responsibilities, requirements..."
              required
            />
          </div>

          {/* Application Link */}
          <div>
            <label className="label">
              <LinkIcon className="w-4 h-4 inline mr-1.5" />
              Application Link (optional)
            </label>
            <input
              type="url"
              value={formData.applicationLink}
              onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
              className="input"
              placeholder="https://..."
            />
            <p className="text-text-tertiary text-sm mt-1">
              Leave empty to receive applications through the platform
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label className="label">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Application Deadline (optional)
            </label>
            <input
              type="date"
              value={formData.applicationDeadline}
              onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Required Skills */}
          <div>
            <label className="label">Required Skills</label>
            <p className="text-text-tertiary text-sm mb-3">
              Select skills that are relevant to this opportunity
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.requiredSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="tag-primary flex items-center gap-1"
                >
                  {skill}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-surface-100 rounded-lg max-h-40 overflow-y-auto">
              {SKILL_OPTIONS.filter((s) => !formData.requiredSkills.includes(s)).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="tag hover:bg-surface-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Target Domains */}
          <div>
            <label className="label">Target Domains</label>
            <p className="text-text-tertiary text-sm mb-3">
              Select domains relevant to this opportunity
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.targetDomains.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className="tag-secondary flex items-center gap-1"
                >
                  {domain}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-surface-100 rounded-lg max-h-40 overflow-y-auto">
              {DOMAIN_OPTIONS.filter((d) => !formData.targetDomains.includes(d)).map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className="tag hover:bg-surface-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link href="/dashboard/opportunities" className="btn-secondary flex-1">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Posting...' : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
