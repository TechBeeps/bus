import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import HeroSection from "@/components/HeroSection";
import HomeRoutesSection from "@/components/HomeRoutesSection";
import PatternDivider from "@/components/PatternDivider";
import HomeAboutSection from "@/components/HomeAboutSection";
import HomeQRPaySection from "@/components/HomeQRPaySection";
import HomeWhyUsSection from "@/components/HomeWhyUsSection";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemate.in/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemate.in/en",
        hi: "https://shreemate.in/hi",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Shree Mateshwari Enterprises — SME Buses",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
      ],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col">
      <BreadcrumbSchema
        items={[
          {
            name: locale === "hi" ? "होम" : "Home",
            url: `https://shreemate.in/${locale}`,
          },
        ]}
      />      
      <HeroSection />
      
      <div className="w-full h-10 sm:h-12 bg-[#E8721A] shadow-inner" />

      <HomeRoutesSection />
      
      <PatternDivider />
      
      <HomeAboutSection />
      
      <PatternDivider />
      
      <HomeQRPaySection />
      
      <HomeWhyUsSection />
    </div>
  );
}
