'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Check, X, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { DOMAIN_OPTIONS, SKILL_OPTIONS } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, updateProfile, isLoading, checkAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const isStudent = user?.role === 'student';
  const totalSteps = isStudent ? 3 : 4;

  // Student fields
  const [studentData, setStudentData] = useState({
    skills: [] as string[],
    domains: [] as string[],
    interests: '',
    careerGoals: '',
    university: '',
    major: '',
    graduationYear: '',
    bio: '',
  });

  // Alumni fields
  const [alumniData, setAlumniData] = useState({
    skills: [] as string[],
    domains: [] as string[],
    company: '',
    jobTitle: '',
    experienceYears: '',
    calcomEventTypeId: '',
    calcomUsername: '',
    almaMater: '',
    graduationYear: '',
    bio: '',
  });

  const [customSkill, setCustomSkill] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (!authenticated) {
        router.push('/login');
      }
    });
  }, []);

  const toggleItem = (
    list: string[],
    item: string,
    setData: (fn: (prev: any) => any) => void,
    field: string
  ) => {
    setData((prev: any) => ({
      ...prev,
      [field]: list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item],
    }));
  };

  const addCustomItem = (
    value: string,
    list: string[],
    setData: (fn: (prev: any) => any) => void,
    field: string,
    clearInput: () => void
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setData((prev: any) => ({
        ...prev,
        [field]: [...list, value.trim()],
      }));
      clearInput();
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const data = isStudent ? studentData : alumniData;
      await updateProfile({
        ...data,
        graduationYear: data.graduationYear ? parseInt(data.graduationYear) : undefined,
        experienceYears: !isStudent && alumniData.experienceYears 
          ? parseInt(alumniData.experienceYears) 
          : undefined,
      });
      toast.success('Profile completed! Welcome to AlumNet.');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const data = isStudent ? studentData : alumniData;
  const setData = isStudent ? setStudentData : setAlumniData;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-12 bg-accent-primary'
                  : i + 1 < step
                  ? 'w-8 bg-accent-primary/50'
                  : 'w-8 bg-border'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="card p-8"
        >
          {/* Step 1: Skills */}
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                What are your skills?
              </h2>
              <p className="text-text-secondary mb-6">
                Select the skills you have or want to develop. This helps us match you better.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem(data.skills, skill, setData, 'skills')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      data.skills.includes(skill)
                        ? 'bg-accent-primary text-surface'
                        : 'bg-surface-100 text-text-secondary hover:bg-surface-50 border border-border'
                    }`}
                  >
                    {data.skills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                    {skill}
                  </button>
                ))}
              </div>

              {/* Custom skill input */}
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomItem(customSkill, data.skills, setData, 'skills', () => setCustomSkill(''));
                    }
                  }}
                  placeholder="Add custom skill..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => addCustomItem(customSkill, data.skills, setData, 'skills', () => setCustomSkill(''))}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Selected skills */}
              {data.skills.length > 0 && (
                <div className="mt-4 p-4 bg-surface-100 rounded-lg">
                  <p className="text-sm text-text-tertiary mb-2">Selected ({data.skills.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill) => (
                      <span key={skill} className="tag-primary flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => toggleItem(data.skills, skill, setData, 'skills')}
                          className="hover:text-accent-danger"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Domains */}
          {step === 2 && (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                What domains interest you?
              </h2>
              <p className="text-text-secondary mb-6">
                {isStudent
                  ? 'Select the areas you want to explore or work in.'
                  : 'Select the domains you have expertise in.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {DOMAIN_OPTIONS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleItem(data.domains, domain, setData, 'domains')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      data.domains.includes(domain)
                        ? 'bg-accent-tertiary text-white'
                        : 'bg-surface-100 text-text-secondary hover:bg-surface-50 border border-border'
                    }`}
                  >
                    {data.domains.includes(domain) && <Check className="w-3 h-3 inline mr-1" />}
                    {domain}
                  </button>
                ))}
              </div>

              {/* Custom domain input */}
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomItem(customDomain, data.domains, setData, 'domains', () => setCustomDomain(''));
                    }
                  }}
                  placeholder="Add custom domain..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => addCustomItem(customDomain, data.domains, setData, 'domains', () => setCustomDomain(''))}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {data.domains.length > 0 && (
                <div className="mt-4 p-4 bg-surface-100 rounded-lg">
                  <p className="text-sm text-text-tertiary mb-2">Selected ({data.domains.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {data.domains.map((domain) => (
                      <span key={domain} className="tag-secondary flex items-center gap-1">
                        {domain}
                        <button
                          type="button"
                          onClick={() => toggleItem(data.domains, domain, setData, 'domains')}
                          className="hover:text-accent-danger"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3 for Student: Goals & Education */}
          {step === 3 && isStudent && (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                Tell us about yourself
              </h2>
              <p className="text-text-secondary mb-6">
                This helps alumni understand your background and goals.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">University</label>
                    <input
                      type="text"
                      value={studentData.university}
                      onChange={(e) => setStudentData(prev => ({ ...prev, university: e.target.value }))}
                      className="input"
                      placeholder="Stanford University"
                    />
                  </div>
                  <div>
                    <label className="label">Major</label>
                    <input
                      type="text"
                      value={studentData.major}
                      onChange={(e) => setStudentData(prev => ({ ...prev, major: e.target.value }))}
                      className="input"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Expected Graduation Year</label>
                  <input
                    type="number"
                    value={studentData.graduationYear}
                    onChange={(e) => setStudentData(prev => ({ ...prev, graduationYear: e.target.value }))}
                    className="input"
                    placeholder="2026"
                    min="2020"
                    max="2035"
                  />
                </div>

                <div>
                  <label className="label">Career Goals</label>
                  <textarea
                    value={studentData.careerGoals}
                    onChange={(e) => setStudentData(prev => ({ ...prev, careerGoals: e.target.value }))}
                    className="input min-h-[100px] resize-none"
                    placeholder="What do you want to achieve? What kind of roles interest you?"
                  />
                </div>

                <div>
                  <label className="label">Short Bio</label>
                  <textarea
                    value={studentData.bio}
                    onChange={(e) => setStudentData(prev => ({ ...prev, bio: e.target.value }))}
                    className="input min-h-[80px] resize-none"
                    placeholder="A brief introduction about yourself..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3 for Alumni: Professional Info */}
          {step === 3 && !isStudent && (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                Professional Experience
              </h2>
              <p className="text-text-secondary mb-6">
                Share your professional background to help students find you.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Company</label>
                    <input
                      type="text"
                      value={alumniData.company}
                      onChange={(e) => setAlumniData(prev => ({ ...prev, company: e.target.value }))}
                      className="input"
                      placeholder="Google"
                    />
                  </div>
                  <div>
                    <label className="label">Job Title</label>
                    <input
                      type="text"
                      value={alumniData.jobTitle}
                      onChange={(e) => setAlumniData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="input"
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Years of Experience</label>
                    <input
                      type="number"
                      value={alumniData.experienceYears}
                      onChange={(e) => setAlumniData(prev => ({ ...prev, experienceYears: e.target.value }))}
                      className="input"
                      placeholder="5"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="label">Graduation Year</label>
                    <input
                      type="number"
                      value={alumniData.graduationYear}
                      onChange={(e) => setAlumniData(prev => ({ ...prev, graduationYear: e.target.value }))}
                      className="input"
                      placeholder="2018"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Alma Mater</label>
                  <input
                    type="text"
                    value={alumniData.almaMater}
                    onChange={(e) => setAlumniData(prev => ({ ...prev, almaMater: e.target.value }))}
                    className="input"
                    placeholder="MIT"
                  />
                </div>

                <div>
                  <label className="label">Short Bio</label>
                  <textarea
                    value={alumniData.bio}
                    onChange={(e) => setAlumniData(prev => ({ ...prev, bio: e.target.value }))}
                    className="input min-h-[100px] resize-none"
                    placeholder="Tell students about your journey, expertise, and what you can offer as a mentor..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 4 for Alumni: Cal.com Setup */}
          {step === 4 && !isStudent && (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                Setup Scheduling
              </h2>
              <p className="text-text-secondary mb-6">
                Connect your Cal.com account to let students book mentorship sessions with you.
              </p>

              <div className="space-y-4">
                <div className="card bg-surface-100 p-4">
                  <h4 className="font-medium text-text-primary mb-2">How to get your Cal.com Event Type ID:</h4>
                  <ol className="list-decimal list-inside text-text-secondary text-sm space-y-1">
                    <li>Go to cal.com and sign in</li>
                    <li>Create or select an event type for mentorship</li>
                    <li>Copy the event type ID from the URL (e.g., /event-types/123456)</li>
                    <li>Paste it below</li>
                  </ol>
                </div>

                <div>
                  <label className="label">Cal.com Username</label>
                  <input
                    type="text"
                    value={alumniData.calcomUsername}
                    onChange={(e) => setAlumniData(prev => ({ ...prev, calcomUsername: e.target.value }))}
                    className="input"
                    placeholder="johndoe"
                  />
                  <p className="text-text-tertiary text-sm mt-1">Your Cal.com username (from cal.com/username)</p>
                </div>

                <div>
                  <label className="label">Event Type ID</label>
                  <input
                    type="text"
                    value={alumniData.calcomEventTypeId}
                    onChange={(e) => setAlumniData(prev => ({ ...prev, calcomEventTypeId: e.target.value }))}
                    className="input"
                    placeholder="123456"
                  />
                  <p className="text-text-tertiary text-sm mt-1">
                    This is required for students to book sessions with you
                  </p>
                </div>

                <div className="p-4 border border-accent-warning/30 bg-accent-warning/5 rounded-lg">
                  <p className="text-accent-warning text-sm">
                    <strong>Note:</strong> You can skip this step and add it later from your profile settings.
                    However, students won't be able to book sessions until this is configured.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="btn-ghost disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < totalSteps ? (
              <button type="button" onClick={handleNext} className="btn-primary">
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Complete Setup'}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
