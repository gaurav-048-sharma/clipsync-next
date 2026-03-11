import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AxiosInterceptor } from '@/components/providers/AxiosInterceptor';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://clipsync.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'ClipSync – Connect with Your College Community',
    template: '%s | ClipSync',
  },
  description:
    'ClipSync is a college social platform to share posts, reels, stories, messages, confessions, events, and marketplace listings with your campus community.',
  keywords: [
    'clipsync',
    'college social network',
    'campus community',
    'college events',
    'college marketplace',
    'college confessions',
    'student social media',
  ],
  authors: [{ name: 'ClipSync' }],
  creator: 'ClipSync',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ClipSync',
    title: 'ClipSync – Connect with Your College Community',
    description:
      'Share posts, reels, stories, messages, confessions, events, and marketplace listings with your campus community.',
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'ClipSync Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'ClipSync – Connect with Your College Community',
    description:
      'Share posts, reels, stories, messages, confessions, events, and marketplace listings with your campus community.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Replace with your actual Google Search Console verification code
    // google: 'your-google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider>
            <AuthProvider>
              <AxiosInterceptor>
                {children}
              </AxiosInterceptor>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
