'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      // Error handled by store
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
            <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-surface" />
            </div>
            <span className="font-display font-bold text-2xl text-text-primary">AlumNet</span>
          </Link>

          <h1 className="font-display text-4xl font-bold text-text-primary mb-4">
            Welcome back
          </h1>
          <p className="text-text-secondary text-lg max-w-md">
            Continue your mentorship journey. Your matched mentors and opportunities are waiting.
          </p>

          <div className="mt-12 space-y-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-success/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-accent-success" />
              </div>
              <div>
                <div className="text-text-primary font-medium">New matches available</div>
                <div className="text-text-tertiary text-sm">3 alumni match your profile</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-accent-primary" />
              </div>
              <div>
                <div className="text-text-primary font-medium">Upcoming session</div>
                <div className="text-text-tertiary text-sm">Tomorrow at 3:00 PM</div>
              </div>
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
            <h2 className="font-display text-3xl font-bold text-text-primary mb-2">
              Sign in to your account
            </h2>
            <p className="text-text-secondary mb-8">
              Don't have an account?{' '}
              <Link href="/register" className="link">
                Create one
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={validationErrors.email ? 'input-error' : 'input'}
                  placeholder="john@university.edu"
                  autoComplete="email"
                />
                {validationErrors.email && (
                  <p className="text-accent-danger text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link href="/forgot-password" className="text-sm text-accent-primary hover:text-accent-primary/80">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${validationErrors.password ? 'input-error' : 'input'} pr-12`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-accent-danger text-sm mt-1">{validationErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
