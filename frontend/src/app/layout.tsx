import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'AlumNet - Alumni Mentorship Platform',
  description: 'Connect with alumni mentors, discover opportunities, and accelerate your career journey.',
  keywords: ['mentorship', 'alumni', 'students', 'career', 'opportunities'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="noise-overlay">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1f',
              color: '#f5f5f7',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1a1a1f',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1a1a1f',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
