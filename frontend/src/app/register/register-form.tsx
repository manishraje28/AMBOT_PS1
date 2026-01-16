'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: (searchParams.get('role') as 'student' | 'alumni') || 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
      toast.success('Account created successfully!');
      router.push('/onboarding');
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface via-surface-50 to-surface">
        <div className="absolute inset-0">
          <div className="glow-orb w-[500px] h-[500px] bg-accent-primary top-1/4 -left-48" />
          <div className="glow-orb w-[300px] h-[300px] bg-accent-tertiary bottom-1/4 right-0" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-16 h-16 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="AlumNet" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-2xl text-text-primary">AlumNet</span>
          </Link>

          <h1 className="font-display text-4xl font-bold text-text-primary mb-4">
            Start your mentorship journey
          </h1>
          <p className="text-text-secondary text-lg max-w-md">
            {formData.role === 'student'
              ? 'Connect with experienced alumni who can guide your career path and open doors to opportunities.'
              : 'Share your experience and help shape the next generation of professionals in your field.'}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="font-display text-2xl font-bold gradient-text">500+</div>
              <div className="text-text-tertiary text-sm">Active Mentors</div>
            </div>
            <div className="card p-4">
              <div className="font-display text-2xl font-bold gradient-text">95%</div>
              <div className="text-text-tertiary text-sm">Match Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Create an account</h2>
              <p className="text-text-secondary">
                Already have an account?{' '}
                <Link href="/login" className="text-accent-primary hover:text-accent-secondary font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-secondary">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`input w-full ${validationErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="John"
                  />
                  {validationErrors.firstName && (
                    <p className="text-xs text-red-500">{validationErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-secondary">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`input w-full ${validationErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Doe"
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-red-500">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input w-full ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="john@example.com"
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input w-full pr-10 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-500">{validationErrors.password}</p>
                )}
                <p className="text-xs text-text-tertiary">
                  Must be at least 8 characters with uppercase, lowercase & number
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input w-full ${validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Confirm your password"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                      Create Account
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-text-tertiary">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-text-secondary">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
