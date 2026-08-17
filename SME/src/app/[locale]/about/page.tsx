import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import AboutView from "@/components/AboutView";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.about" });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemate.in/${locale}/about`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemate.in/en/about",
        hi: "https://shreemate.in/hi/about",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "SME Buses — Shree Mateshwari Enterprises",
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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: locale === "hi" ? "होम" : "Home",
            url: `https://shreemate.in/${locale}`,
          },
          {
            name: locale === "hi" ? "हमारे बारे में" : "About Us",
            url: `https://shreemate.in/${locale}/about`,
          },
        ]}
      />
      <AboutView />
    </>
  );
}
