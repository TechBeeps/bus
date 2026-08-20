import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FileText } from "lucide-react";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "meta.termsConditions",
  });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemateshwaribus.com/${locale}/terms-and-conditions`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemateshwaribus.com/en/terms-and-conditions",
        hi: "https://shreemateshwaribus.com/hi/terms-and-conditions",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Shree Mateshwari Enterprises",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      type: "website",
    },
  };
}

export default async function TermsConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isHindi = locale === "hi";

  return (
    <div className="flex flex-col">
      <BreadcrumbSchema
        items={[
          {
            name: isHindi ? "होम" : "Home",
            url: `https://shreemateshwaribus.com/${locale}`,
          },
          {
            name: isHindi ? "नियम एवं शर्तें" : "Terms & Conditions",
            url: `https://shreemateshwaribus.com/${locale}/terms-and-conditions`,
          },
        ]}
      />

      <div className="py-12 sm:py-16 bg-[#E8721A] text-white text-center">
        <div className="site-container space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            {isHindi ? "नियम एवं शर्तें" : "Terms & Conditions"}
          </h1>

          <p className="text-xs sm:text-sm text-white/90">
            {isHindi
              ? "अंतिम अपडेट: 18 अगस्त 2026"
              : "Last Updated: August 18, 2026"}
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="site-container">
          <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#FFFDF9] border border-[#FED7AA]/80 shadow-xs space-y-8 text-gray-700 text-sm leading-relaxed">

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                1. {isHindi ? "नियमों की स्वीकृति" : "Acceptance of Terms"}
              </h2>

              <p>
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज की वेबसाइट, मोबाइल प्लेटफॉर्म या सेवाओं का उपयोग करके आप इन नियमों एवं शर्तों से सहमत होते हैं।"
                  : "By accessing or using the services, website, mobile applications, or booking platform of Shree Mateshwari Enterprises, you agree to be bound by these Terms & Conditions."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                2. {isHindi ? "हमारे बारे में" : "About Us"}
              </h2>

              <p>
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज राजस्थान एवं आसपास के क्षेत्रों में बस परिवहन सेवाएं प्रदान करता है।"
                  : "Shree Mateshwari Enterprises provides passenger transportation and bus services across Rajasthan and nearby regions."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                3. {isHindi ? "बुकिंग सेवाएँ" : "Booking Services"}
              </h2>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {isHindi
                    ? "रूट और बस खोजें"
                    : "Search routes and available buses"}
                </li>
                <li>
                  {isHindi
                    ? "सीट चयन करें"
                    : "Select preferred seats"}
                </li>
                <li>
                  {isHindi
                    ? "यात्री विवरण दर्ज करें"
                    : "Provide passenger details"}
                </li>
                <li>
                  {isHindi
                    ? "ऑनलाइन भुगतान करें"
                    : "Complete payment online"}
                </li>
                <li>
                  {isHindi
                    ? "बुकिंग पुष्टि प्राप्त करें"
                    : "Receive booking confirmation"}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                4. {isHindi ? "भुगतान एवं किराया" : "Payments & Fares"}
              </h2>

              <p>
                {isHindi
                  ? "सभी किराए उपलब्धता, मार्ग, मौसम और मांग के अनुसार बदल सकते हैं।"
                  : "Fares may vary based on route, seat availability, season, and demand."}
              </p>

              <p>
                {isHindi
                  ? "भुगतान UPI, QR कोड, नेट बैंकिंग, डेबिट कार्ड, क्रेडिट कार्ड तथा अन्य स्वीकृत माध्यमों से किया जा सकता है।"
                  : "Payments may be made using UPI, QR Code, Net Banking, Debit Card, Credit Card, and other approved payment methods."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                5. {isHindi ? "यात्री की जिम्मेदारियाँ" : "Passenger Responsibilities"}
              </h2>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {isHindi
                    ? "सही जानकारी प्रदान करना"
                    : "Provide accurate passenger information"}
                </li>
                <li>
                  {isHindi
                    ? "समय पर रिपोर्ट करना"
                    : "Arrive before departure time"}
                </li>
                <li>
                  {isHindi
                    ? "सुरक्षा निर्देशों का पालन करना"
                    : "Follow safety instructions"}
                </li>
                <li>
                  {isHindi
                    ? "अन्य यात्रियों का सम्मान करना"
                    : "Respect fellow passengers"}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                6. {isHindi ? "रद्दीकरण एवं रिफंड" : "Cancellation & Refunds"}
              </h2>

              <p>
                {isHindi
                  ? "सभी रद्दीकरण और रिफंड हमारी रिफंड एवं रद्दीकरण नीति के अनुसार होंगे।"
                  : "All cancellations and refunds are governed by our Refund & Cancellation Policy."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                7. {isHindi ? "सेवा में देरी" : "Service Delays"}
              </h2>

              <p>
                {isHindi
                  ? "यातायात, मौसम, सड़क बंद होने, सरकारी आदेश या तकनीकी कारणों से देरी हो सकती है।"
                  : "Services may be delayed due to traffic, weather, road closures, government restrictions, or technical issues."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                8. {isHindi ? "कंपनी द्वारा रद्दीकरण" : "Cancellation by Company"}
              </h2>

              <p>
                {isHindi
                  ? "यदि कंपनी किसी सेवा को रद्द करती है, तो पात्र यात्रियों को पूर्ण रिफंड दिया जाएगा।"
                  : "If a service is cancelled by the Company, eligible passengers may receive a full refund."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                9. {isHindi ? "सामान नीति" : "Luggage Policy"}
              </h2>

              <p>
                {isHindi
                  ? "यात्री अपने सामान के लिए स्वयं जिम्मेदार होंगे। प्रतिबंधित या अवैध वस्तुएँ ले जाना सख्त मना है।"
                  : "Passengers are responsible for their personal belongings. Carrying prohibited or illegal items is strictly forbidden."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                10. {isHindi ? "गोपनीयता" : "Privacy"}
              </h2>

              <p>
                {isHindi
                  ? "बुकिंग और ग्राहक सहायता के लिए आवश्यक जानकारी एकत्र और उपयोग की जा सकती है।"
                  : "Information may be collected and used for booking, customer support, and operational purposes."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                11. {isHindi ? "उत्तरदायित्व की सीमा" : "Limitation of Liability"}
              </h2>

              <p>
                {isHindi
                  ? "कंपनी अप्रत्यक्ष, आकस्मिक या परिणामी क्षति के लिए उत्तरदायी नहीं होगी।"
                  : "The Company shall not be liable for indirect, incidental, or consequential damages."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                12. {isHindi ? "नियमों में परिवर्तन" : "Changes to Terms"}
              </h2>

              <p>
                {isHindi
                  ? "कंपनी किसी भी समय इन नियमों में संशोधन कर सकती है।"
                  : "We reserve the right to update these Terms & Conditions at any time."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                13. {isHindi ? "लागू कानून" : "Governing Law"}
              </h2>

              <p>
                {isHindi
                  ? "सभी विवाद राजस्थान, भारत के न्यायालयों के अधिकार क्षेत्र में होंगे।"
                  : "All disputes shall be subject to the exclusive jurisdiction of courts in Rajasthan, India."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                14. {isHindi ? "संपर्क करें" : "Contact Us"}
              </h2>

              <div className="space-y-1">
                <p className="font-bold">
                  Shree Mateshwari Enterprises
                </p>

                <p>Mewar Region, Rajasthan, India</p>

                <p>
                  Email:{" "}
                  <Link
                    href="mailto:naresh12881288@gmail.com"
                    className="text-[#E8721A]"
                  >
                    naresh12881288@gmail.com
                  </Link>
                </p>

                <p>
                  Website:{" "}
                  <Link
                    href="https://shreemateshwaribus.com"
                    className="text-[#E8721A]"
                  >
                    https://shreemateshwaribus.com
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}