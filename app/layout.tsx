import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://primecfo.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "PrimeCFO.ai | Unlocking Potential Through Financial Intelligence™",
    template: "%s | PrimeCFO.ai",
  },
  description:
    "Unlocking Potential Through Financial Intelligence™ — AI-powered clarity from QuickBooks to smarter business decisions. Strategic advisory, asset depreciation registers, and treasury intelligence.",
  keywords: [
    "Fractional CFO",
    "QuickBooks Online AI",
    "Financial Intelligence",
    "Cash Runway Forecast",
    "Capital Asset Depreciation",
    "Accounting Automation",
    "CFO Advisory Workpapers",
  ],
  authors: [{ name: "Prime Accounting Solutions LLC" }],
  creator: "PrimeCFO.ai",
  publisher: "Prime Accounting Solutions",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "PrimeCFO.ai",
    title: "PrimeCFO.ai | Unlocking Potential Through Financial Intelligence™",
    description:
      "AI-powered financial clarity from QuickBooks to smarter business decisions. Real-time cash velocity, treasury health, and automated asset registers.",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "PrimeCFO.ai Operator Command Center & Client Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrimeCFO.ai | Financial Intelligence Platform",
    description: "AI-powered clarity from QuickBooks to strategic business decisions.",
    creator: "@primecfoai",
    images: ["/og-preview.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "PrimeCFO.ai",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "url": baseUrl,
      "description":
        "Fractional CFO intelligence platform that connects directly to QuickBooks Online to provide cash flow runways, automated asset registers, and executive advisory workpapers.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "creator": {
        "@type": "Organization",
        "name": "Prime Accounting Solutions LLC",
        "url": baseUrl,
      },
    },
    {
      "@type": "FinancialService",
      "name": "Prime Accounting Solutions Fractional CFO",
      "url": baseUrl,
      "serviceType": "Fractional CFO Advisory",
      "areaServed": "US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
