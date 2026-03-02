import type { Metadata } from "next";
import { Bebas_Neue, Share_Tech_Mono } from 'next/font/google';
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Vibe2Real | Incident Simulator',
  description: 'A debugging simulator for vibe coders. 15 real incidents. No AI allowed. 100% free.',
  openGraph: {
    title: 'Vibe2Real | Incident Simulator',
    description: 'Can you debug without AI? 15 real production incidents. No hints. No walkthroughs.',
    url: 'https://vibe2real.com',
    siteName: 'Vibe2Real',
    images: [{ url: '/177237402778bf.png', width: 1200, height: 630, alt: 'Vibe2Real Incident Simulator' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe2Real | Incident Simulator',
    description: 'Can you debug without AI? 15 real production incidents. No hints. No walkthroughs.',
    images: ['/177237402778bf.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bebasNeue.variable} ${shareTechMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
