'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Users, Calendar, Briefcase, Sparkles, 
  GraduationCap, MessageCircle, Award, Target, Rocket,
  BookOpen, Lightbulb, Heart, Star, CheckCircle,
  Play, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// Animated connection lines between mentor and student
const ConnectionLines = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e8b931" stopOpacity="0" />
        <stop offset="50%" stopColor="#e8b931" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 50 150 Q 200 50 350 150"
      stroke="url(#lineGradient)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
    <motion.path
      d="M 50 150 Q 200 250 350 150"
      stroke="url(#lineGradient)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
  </svg>
);

// Floating particles animation
const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-accent-primary/30"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Interactive mentor-student illustration
const MentorStudentIllustration = () => (
  <div className="relative w-full h-80 md:h-96">
    <ConnectionLines />
    
    {/* Mentor side */}
    <motion.div
      className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="relative">
        <motion.div 
          className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-2xl"
          whileHover={{ scale: 1.1 }}
          animate={{ boxShadow: ['0 0 20px rgba(232,185,49,0.3)', '0 0 40px rgba(232,185,49,0.5)', '0 0 20px rgba(232,185,49,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-surface" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent-success flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Award className="w-4 h-4 text-white" />
        </motion.div>
        <p className="text-center mt-4 font-display font-semibold text-text-primary">Alumni Mentor</p>
        <p className="text-center text-sm text-text-tertiary">Industry Expert</p>
      </div>
    </motion.div>

    {/* Center icon */}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-16 h-16 rounded-full bg-surface-50 border-2 border-accent-primary/50 flex items-center justify-center">
        <Heart className="w-8 h-8 text-accent-primary" />
      </div>
    </motion.div>

    {/* Student side */}
    <motion.div
      className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="relative">
        <motion.div 
          className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent-tertiary to-purple-600 flex items-center justify-center shadow-2xl"
          whileHover={{ scale: 1.1 }}
          animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-white" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >
          <Rocket className="w-4 h-4 text-surface" />
        </motion.div>
        <p className="text-center mt-4 font-display font-semibold text-text-primary">Student</p>
        <p className="text-center text-sm text-text-tertiary">Future Leader</p>
      </div>
    </motion.div>

    {/* Floating elements */}
    <motion.div
      className="absolute left-1/4 top-8"
      animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      <Lightbulb className="w-8 h-8 text-accent-primary/60" />
    </motion.div>
    <motion.div
      className="absolute right-1/4 bottom-8"
      animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity }}
    >
      <Target className="w-8 h-8 text-accent-tertiary/60" />
    </motion.div>
  </div>
);

// Animated stats counter
const AnimatedCounter = ({ value, label }: { value: string; label: string }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <motion.div 
      className="text-center p-6 rounded-2xl bg-surface-50/50 border border-border hover:border-accent-primary/50 transition-all duration-300"
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <motion.div 
        className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {count.toLocaleString()}{suffix}
      </motion.div>
      <div className="text-text-tertiary">{label}</div>
    </motion.div>
  );
};

// Testimonial card
const TestimonialCard = ({ name, role, quote, avatar, delay }: { 
  name: string; role: string; quote: string; avatar: string; delay: number 
}) => (
  <motion.div
    className="card-hover p-6 min-w-[320px] md:min-w-[400px]"
    initial={{ opacity: 0, x: 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
  >
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-surface font-bold">
        {avatar}
      </div>
      <div>
        <h4 className="font-semibold text-text-primary">{name}</h4>
        <p className="text-sm text-text-tertiary">{role}</p>
      </div>
    </div>
    <div className="flex gap-1 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-accent-primary text-accent-primary" />
      ))}
    </div>
    <p className="text-text-secondary italic">"{quote}"</p>
  </motion.div>
);

// How it works step
const HowItWorksStep = ({ step, title, description, icon: Icon, delay }: {
  step: number; title: string; description: string; icon: any; delay: number
}) => (
  <motion.div
    className="relative"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
  >
    <div className="flex items-start gap-4">
      <div className="relative">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center"
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          <Icon className="w-7 h-7 text-accent-primary" />
        </motion.div>
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent-primary text-surface text-xs font-bold flex items-center justify-center">
          {step}
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary">{description}</p>
      </div>
    </div>
  </motion.div>
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

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
      color: 'from-accent-primary to-yellow-500',
    },
    {
      icon: Calendar,
      title: 'Seamless Scheduling',
      description: 'Book mentorship sessions directly through integrated Cal.com scheduling.',
      color: 'from-accent-tertiary to-purple-500',
    },
    {
      icon: Briefcase,
      title: 'Opportunity Feed',
      description: 'Access exclusive internships, projects, and referrals from verified alumni.',
      color: 'from-accent-secondary to-orange-500',
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Connect instantly with your mentor through our built-in messaging system.',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science, Class of 2025",
      quote: "AlumNet connected me with a Google engineer who helped me ace my interviews. I got my dream internship!",
      avatar: "SC"
    },
    {
      name: "Rahul Patel",
      role: "Alumni Mentor, Product Manager",
      quote: "Giving back to students has been incredibly rewarding. The platform makes scheduling so easy.",
      avatar: "RP"
    },
    {
      name: "Emily Rodriguez",
      role: "Business Student, Class of 2026",
      quote: "The opportunity feed is amazing! Found a startup internship that perfectly matched my interests.",
      avatar: "ER"
    },
  ];

  const howItWorks = [
    {
      icon: Users,
      title: "Create Your Profile",
      description: "Sign up and tell us about your skills, interests, and career goals."
    },
    {
      icon: Target,
      title: "Get Matched",
      description: "Our AI matches you with alumni mentors who align with your aspirations."
    },
    {
      icon: Calendar,
      title: "Book Sessions",
      description: "Schedule 1-on-1 mentorship sessions at times that work for both of you."
    },
    {
      icon: Rocket,
      title: "Grow Together",
      description: "Receive guidance, access opportunities, and accelerate your career."
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="glow-orb w-[800px] h-[800px] bg-accent-primary -top-64 -left-64"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="glow-orb w-[600px] h-[600px] bg-accent-tertiary -bottom-48 -right-48"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
        
        {/* Floating particles */}
        <FloatingParticle delay={0} x="10%" y="20%" size={6} />
        <FloatingParticle delay={0.5} x="80%" y="15%" size={8} />
        <FloatingParticle delay={1} x="70%" y="70%" size={5} />
        <FloatingParticle delay={1.5} x="15%" y="60%" size={7} />
        <FloatingParticle delay={2} x="50%" y="80%" size={6} />
        <FloatingParticle delay={2.5} x="90%" y="40%" size={5} />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 px-6 py-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              className="w-14 h-14 rounded-xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img src="/logo.png" alt="AlumNet" className="w-full h-full object-contain" />
            </motion.div>
            <span className="font-display font-bold text-xl text-text-primary group-hover:text-accent-primary transition-colors">
              AlumNet
            </span>
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
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-50 border border-border mb-8"
                whileHover={{ scale: 1.05 }}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-success"></span>
                </span>
                <span className="text-sm text-text-secondary">
                  500+ verified alumni mentors online
                </span>
              </motion.div>

              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-text-primary">Bridge the gap</span>
                <br />
                <motion.span 
                  className="gradient-text"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: '200% auto' }}
                >
                  from campus to career
                </motion.span>
              </h1>

              <p className="text-lg md:text-xl text-text-secondary max-w-xl mb-10">
                A mentorship platform that intelligently matches students with alumni mentors,
                streamlines scheduling, and surfaces real opportunities.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                <Link href="/register?role=student" className="btn-primary text-lg px-8 py-3.5 group">
                  <GraduationCap className="w-5 h-5" />
                  Join as Student
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/register?role=alumni" className="btn-secondary text-lg px-8 py-3.5 group">
                  <Award className="w-5 h-5" />
                  Become a Mentor
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 text-text-tertiary text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-success" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-success" />
                  <span>Verified mentors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-success" />
                  <span>Secure platform</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Interactive illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MentorStudentIllustration />
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="card-hover group cursor-pointer"
              >
                <motion.div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                  whileHover={{ rotate: 10 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* How It Works Section */}
          <motion.section
            className="mt-32"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-16">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-tertiary/10 border border-accent-tertiary/30 mb-4"
              >
                <Play className="w-4 h-4 text-accent-tertiary" />
                <span className="text-sm text-accent-tertiary">How it works</span>
              </motion.div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-4">
                Your journey to success in <span className="gradient-text">4 simple steps</span>
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                From sign-up to career growth, we've made the mentorship journey seamless and rewarding.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => (
                <HowItWorksStep
                  key={step.title}
                  step={index + 1}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  delay={index * 0.15}
                />
              ))}
            </div>
          </motion.section>

          {/* Animated Stats */}
          <motion.section
            className="mt-32"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Trusted by <span className="gradient-text">thousands</span> of students & alumni
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <AnimatedCounter value="500+" label="Alumni Mentors" />
              <AnimatedCounter value="2000+" label="Active Students" />
              <AnimatedCounter value="1500+" label="Sessions Booked" />
              <AnimatedCounter value="300+" label="Opportunities" />
            </div>
          </motion.section>

          {/* Testimonials */}
          <motion.section
            className="mt-32"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/30 mb-4"
              >
                <Heart className="w-4 h-4 text-accent-primary" />
                <span className="text-sm text-accent-primary">Success stories</span>
              </motion.div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-4">
                What our <span className="gradient-text">community</span> says
              </h2>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={testimonial.name} {...testimonial} delay={index * 0.15} />
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            className="mt-32 relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-primary/20 via-surface-50 to-accent-tertiary/20 border border-border p-12 md:p-16 text-center">
              {/* Decorative elements */}
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-accent-primary/20 blur-3xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-accent-tertiary/20 blur-3xl"
                animate={{ scale: [1.3, 1, 1.3], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              <motion.div
                className="relative z-10"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
              >
                <GraduationCap className="w-16 h-16 text-accent-primary mx-auto mb-6" />
                <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary mb-4">
                  Ready to accelerate your career?
                </h2>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
                  Join thousands of students who have found their path through mentorship.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register" className="btn-primary text-lg px-10 py-4 group">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/login" className="btn-secondary text-lg px-10 py-4">
                    Sign In
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/logo.png" alt="AlumNet" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-bold text-lg text-text-primary">AlumNet</span>
              </Link>
              <p className="text-text-tertiary text-sm">
                Bridging the gap between students and alumni for a brighter future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-text-tertiary">
                <li><Link href="/register?role=student" className="hover:text-accent-primary transition-colors">For Students</Link></li>
                <li><Link href="/register?role=alumni" className="hover:text-accent-primary transition-colors">For Alumni</Link></li>
                <li><Link href="#" className="hover:text-accent-primary transition-colors">Opportunities</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-text-tertiary">
                <li><Link href="#" className="hover:text-accent-primary transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-accent-primary transition-colors">Success Stories</Link></li>
                <li><Link href="#" className="hover:text-accent-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-text-tertiary">
                <li><Link href="#" className="hover:text-accent-primary transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-accent-primary transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-accent-primary transition-colors">LinkedIn</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-tertiary text-sm">
              © 2026 AlumNet. Alumni-Student Mentorship Platform.
            </p>
            <div className="flex items-center gap-6 text-sm text-text-tertiary">
              <Link href="#" className="hover:text-accent-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-accent-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom scrollbar hide utility */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
