import { MetadataRoute } from "next";

const baseUrl = "https://shreemateshwaribus.com/";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/routes",
    "/qr-payment",
    "/about",
    "/refund-policy",
  ];
  const locales = ["en", "hi"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority:
          route === ""
            ? 1.0
            : route === "/routes" || route === "/qr-payment"
            ? 0.9
            : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${route}`,
            hi: `${baseUrl}/hi${route}`,
          },
        },
      });
    });
  });

  return sitemapEntries;
}
