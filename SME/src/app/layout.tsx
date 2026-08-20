import type { Metadata, Viewport } from "next";
import { Inter, Hind } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const hindFont = Hind({
  variable: "--font-hind-var",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari", "latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#E8721A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://shreemateshwaribus.com/"),
  title: {
    default: "SME Buses — Shree Mateshwari Enterprises | Bus Rental Jaipur",
    template: "%s | SME Buses",
  },
  description:
    "Safe, comfortable & reliable bus transportation across India since 2005. Mini bus, luxury coaches, AC sleepers for pilgrimage tours, weddings, corporate travel.",
  keywords: [
    "SME Buses",
    "Shree Mateshwari Enterprises",
    "Bus Rental Jaipur",
    "Luxury Bus Hire Rajasthan",
    "Pilgrimage Tour Buses",
    "AC Sleeper Bus Booking",
    "Wedding Bus Hire Jaipur",
    "Corporate Employee Transportation",
    "श्री मातेश्वरी बस",
  ],
  authors: [{ name: "Shree Mateshwari Enterprises", url: "https://shreemateshwaribus.com/" }],
  creator: "Shree Mateshwari Enterprises",
  publisher: "Shree Mateshwari Enterprises",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hindFont.variable} h-full`}
    >
      <body className="min-h-full antialiased flex flex-col">{children}</body>
    </html>
  );
}
