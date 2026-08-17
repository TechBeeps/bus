import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import RoutesView from "@/components/RoutesView";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.routes" });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemate.in/${locale}/routes`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemate.in/en/routes",
        hi: "https://shreemate.in/hi/routes",
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

export default async function RoutesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isHindi = locale === "hi";

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: isHindi ? "होम" : "Home",
            url: `https://shreemate.in/${locale}`,
          },
          {
            name: isHindi ? "रूट्स" : "Routes",
            url: `https://shreemate.in/${locale}/routes`,
          },
        ]}
      />
      <RoutesView />
    </>
  );
}
