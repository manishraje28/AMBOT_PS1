'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Calendar, Briefcase, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (authenticated) {
        router.push('/dashboard');
      }
    });
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Smart Matching',
      description: 'AI-powered algorithm connects you with mentors based on skills, domains, and career goals.',
    },
    {
      icon: Calendar,
      title: 'Seamless Scheduling',
      description: 'Book mentorship sessions directly through integrated Cal.com scheduling.',
    },
    {
      icon: Briefcase,
      title: 'Opportunity Feed',
      description: 'Access exclusive internships, projects, and referrals from verified alumni.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="glow-orb w-[600px] h-[600px] bg-accent-primary -top-48 -left-48" />
        <div className="glow-orb w-[400px] h-[400px] bg-accent-tertiary -bottom-32 -right-32" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-surface" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary">AlumNet</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-16 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
              <span className="text-sm text-text-secondary">
                Connect with 500+ verified alumni mentors
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="text-text-primary">Bridge the gap</span>
              <br />
              <span className="gradient-text">from campus to career</span>
            </h1>

            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              A mentorship platform that intelligently matches students with alumni mentors,
              streamlines scheduling, and surfaces real opportunities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?role=student"
                className="btn-primary text-lg px-8 py-3.5 group"
              >
                Join as Student
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register?role=alumni"
                className="btn-secondary text-lg px-8 py-3.5"
              >
                Become a Mentor
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mt-24"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24"
          >
            {[
              { value: '500+', label: 'Alumni Mentors' },
              { value: '2,000+', label: 'Active Students' },
              { value: '1,500+', label: 'Sessions Booked' },
              { value: '300+', label: 'Opportunities Posted' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-text-tertiary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-primary" />
            <span className="font-display font-semibold text-text-primary">AlumNet</span>
          </div>
          <p className="text-text-tertiary text-sm">
            © 2026 AlumNet. Alumni-Student Mentorship Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
