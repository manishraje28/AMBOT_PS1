'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Briefcase,
  Building,
  GraduationCap,
  Calendar,
  Linkedin,
  Save,
  Camera,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { SKILL_OPTIONS, DOMAIN_OPTIONS, getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.getProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(formData);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    const current = formData.skills || [];
    setFormData({
      ...formData,
      skills: current.includes(skill)
        ? current.filter((s: string) => s !== skill)
        : [...current, skill],
    });
  };

  const toggleDomain = (domain: string) => {
    const current = formData.domains || [];
    setFormData({
      ...formData,
      domains: current.includes(domain)
        ? current.filter((d: string) => d !== domain)
        : [...current, domain],
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-32 rounded-xl mb-6" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <img
            src={getAvatarUrl(user?.firstName || '', user?.lastName || '')}
            alt="Profile"
            className="w-20 h-20 rounded-2xl object-cover"
          />
          <button className="absolute -bottom-2 -right-2 p-2 bg-accent-primary text-surface rounded-full hover:bg-accent-primary/90 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-text-secondary capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-accent-primary text-surface'
              : 'bg-surface-100 text-text-secondary hover:text-text-primary'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'account'
              ? 'bg-accent-primary text-surface'
              : 'bg-surface-100 text-text-secondary hover:text-text-primary'
          }`}
        >
          Account Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Bio */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              About
            </h2>
            <div>
              <label className="label">Bio</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input min-h-[120px] resize-none"
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(formData.skills || []).map((skill: string) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="tag-primary flex items-center gap-1"
                >
                  {skill}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              {(formData.skills || []).length === 0 && (
                <p className="text-text-tertiary text-sm">No skills added yet</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-surface-100 rounded-lg max-h-40 overflow-y-auto">
              {SKILL_OPTIONS.filter((s) => !(formData.skills || []).includes(s)).map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="tag hover:bg-surface-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Interest Domains
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(formData.domains || []).map((domain: string) => (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className="tag-secondary flex items-center gap-1"
                >
                  {domain}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              {(formData.domains || []).length === 0 && (
                <p className="text-text-tertiary text-sm">No domains selected</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-surface-100 rounded-lg max-h-40 overflow-y-auto">
              {DOMAIN_OPTIONS.filter((d) => !(formData.domains || []).includes(d)).map((domain) => (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className="tag hover:bg-surface-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Role-specific fields */}
          {isStudent && (
            <div className="card">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Education Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">University</label>
                  <input
                    type="text"
                    value={formData.university || ''}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="input"
                    placeholder="e.g., MIT"
                  />
                </div>
                <div>
                  <label className="label">Major</label>
                  <input
                    type="text"
                    value={formData.major || ''}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="input"
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div>
                  <label className="label">Expected Graduation Year</label>
                  <input
                    type="number"
                    value={formData.graduationYear || ''}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="input"
                    placeholder="e.g., 2025"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                  />
                </div>
                <div>
                  <label className="label">Career Goals</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.careerGoals) ? formData.careerGoals.join(', ') : (formData.careerGoals || '')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        careerGoals: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="e.g., Software Engineer, Product Manager"
                  />
                </div>
              </div>
            </div>
          )}

          {isAlumni && (
            <>
              <div className="card">
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                  Professional Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle || ''}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="input"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="input"
                      placeholder="e.g., Google"
                    />
                  </div>
                  <div>
                    <label className="label">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.experienceYears || ''}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="input"
                      min={0}
                      max={50}
                    />
                  </div>
                  <div>
                    <label className="label">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="input"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                  Education Background
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Alma Mater</label>
                    <input
                      type="text"
                      value={formData.almaMater || ''}
                      onChange={(e) => setFormData({ ...formData, almaMater: e.target.value })}
                      className="input"
                      placeholder="e.g., Stanford University"
                    />
                  </div>
                  <div>
                    <label className="label">Graduation Year</label>
                    <input
                      type="number"
                      value={formData.graduationYear || ''}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      className="input"
                      min={1950}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                  Mentorship Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-primary font-medium">Available for Mentorship</p>
                      <p className="text-text-secondary text-sm">
                        Allow students to book sessions with you
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isAvailableForMentorship: !formData.isAvailableForMentorship,
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors ${
                        formData.isAvailableForMentorship ? 'bg-accent-primary' : 'bg-surface-100'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                          formData.isAvailableForMentorship ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="label">Cal.com Event Type ID</label>
                    <input
                      type="text"
                      value={formData.calcomEventTypeId || ''}
                      onChange={(e) => setFormData({ ...formData, calcomEventTypeId: e.target.value })}
                      className="input"
                      placeholder="Enter your Cal.com event type ID"
                    />
                    <p className="text-text-tertiary text-sm mt-1">
                      Required for students to book sessions. Find this in your Cal.com dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'account' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={user?.firstName || ''}
                  disabled
                  className="input opacity-60"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={user?.lastName || ''}
                  disabled
                  className="input opacity-60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input opacity-60"
                />
              </div>
            </div>
            <p className="text-text-tertiary text-sm mt-4">
              Contact support to change your name or email.
            </p>
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" placeholder="Enter current password" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" placeholder="Enter new password" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" placeholder="Confirm new password" />
              </div>
            </div>
            <button className="btn-primary mt-6">Update Password</button>
          </div>

          <div className="card border-accent-error/20">
            <h2 className="font-display text-lg font-semibold text-accent-error mb-4">
              Danger Zone
            </h2>
            <p className="text-text-secondary mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="btn-danger">Delete Account</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
