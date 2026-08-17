export function BusinessSchema({ locale }: { locale: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TransportationService"],
    name:
      locale === "hi"
        ? "श्री मातेश्वरी एंटरप्राइजेज — SME Buses"
        : "Shree Mateshwari Enterprises — SME Buses",
    alternateName: "SME Buses",
    url: "https://shreemate.in",
    logo: "https://shreemate.in/logo.png",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
    description:
      locale === "hi"
        ? "जयपुर एवं पूरे भारत में 20+ वर्षों से विश्वसनीय, सुरक्षित और वातानुकूलित बस सेवा।"
        : "Safe, comfortable, and reliable bus rental transportation across India since 2005.",
    telephone: "+91-9876543210",
    email: "info@shreemate.in",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Bank Transfer",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123, Transport Nagar",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302006",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "26.9124",
      longitude: "75.7873",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Rajasthan",
      },
      {
        "@type": "Country",
        name: "India",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Bus Rental Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Pilgrimage Tour Buses",
            description:
              "Special AC buses for Vaishno Devi, Shirdi, Tirupati, Khatu Shyam Ji and religious sites.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Corporate Bus Rental",
            description:
              "Employee shuttle contracts and executive business trip transportation.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wedding & Event Buses",
            description:
              "Decorated deluxe buses for guest transportation during weddings and festivals.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Luxury Sleeper Coaches",
            description:
              "AC sleeper coaches with individual berths for overnight journeys across states.",
          },
        },
      ],
    },
    sameAs: [
      "https://facebook.com/smebuses",
      "https://instagram.com/smebuses",
      "https://wa.me/919928261238",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
