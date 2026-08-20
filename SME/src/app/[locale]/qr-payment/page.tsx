import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import QRPaymentView from "@/components/QRPaymentView";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.qrPayment" });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemateshwaribus.com//${locale}/qr-payment`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemateshwaribus.com//en/qr-payment",
        hi: "https://shreemateshwaribus.com//hi/qr-payment",
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

export default async function QRPaymentPage({
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
            url: `https://shreemateshwaribus.com//${locale}`,
          },
          {
            name: isHindi ? "QR पेमेंट" : "QR Payment",
            url: `https://shreemateshwaribus.com//${locale}/qr-payment`,
          },
        ]}
      />
      <QRPaymentView />
    </>
  );
}
