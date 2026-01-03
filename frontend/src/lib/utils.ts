import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

export function getAvatarUrl(firstName: string, lastName: string, avatarUrl?: string) {
  if (avatarUrl) {
    // If it's a relative URL (local upload), prepend the base server URL
    if (avatarUrl.startsWith('/uploads/')) {
      // Remove /api suffix from the API URL to get the base server URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${avatarUrl}`;
    }
    // If it's an absolute URL, return as is
    return avatarUrl;
  }
  const initials = getInitials(firstName, lastName);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=e8b931&color=0f0f12&bold=true`;
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getOpportunityTypeColor(type: string) {
  const colors: Record<string, string> = {
    internship: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    project: 'bg-green-500/10 text-green-400 border-green-500/30',
    referral: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    mentorship: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    job: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
  return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    no_show: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
}

export const DOMAIN_OPTIONS = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'UI/UX Design',
  'Product Management',
  'Blockchain',
  'IoT',
  'Game Development',
  'Embedded Systems',
  'Database Administration',
  'Quality Assurance',
];

export const SKILL_OPTIONS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Django',
  'Spring Boot',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'GraphQL',
  'REST APIs',
  'Git',
  'CI/CD',
  'Agile',
  'Scrum',
];
