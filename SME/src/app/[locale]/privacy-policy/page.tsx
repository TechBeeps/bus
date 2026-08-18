import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ShieldCheck } from "lucide-react";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "meta.privacyPolicy",
  });

  const title = t("title");
  const description = t("description");

  const url = `https://shreemateshwaribus.com/${locale}/privacy-policy`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemateshwaribus.com/en/privacy-policy",
        hi: "https://shreemateshwaribus.com/hi/privacy-policy",
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

export default async function PrivacyPolicyPage({
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
            name: isHindi ? "गोपनीयता नीति" : "Privacy Policy",
            url: `https://shreemateshwaribus.com/${locale}/privacy-policy`,
          },
        ]}
      />

      <div className="py-12 sm:py-16 bg-[#E8721A] text-white text-center">
        <div className="site-container space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            {isHindi ? "गोपनीयता नीति" : "Privacy Policy"}
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
                1. {isHindi ? "अवलोकन" : "Overview"}
              </h2>

              <p>
                {isHindi
                  ? 'यह गोपनीयता नीति ("नीति") बताती है कि श्री मातेश्वरी एंटरप्राइजेज ("कंपनी", "हम", "हमारी") हमारी वेबसाइट, टिकट बुकिंग प्लेटफॉर्म, QR भुगतान सेवाओं तथा परिवहन सेवाओं के माध्यम से प्राप्त जानकारी को कैसे एकत्रित, उपयोग, संग्रहीत और सुरक्षित रखती है।'
                  : 'This Privacy Policy ("Policy") describes how Shree Mateshwari Enterprises ("Company", "we", "our", or "us") collects, uses, stores, and protects information obtained through our website, booking platform, QR payment services, and transportation operations.'}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                2.{" "}
                {isHindi
                  ? "हम कौन सी जानकारी एकत्र करते हैं"
                  : "Information We Collect"}
              </h2>

              <ul className="list-disc pl-5 space-y-2">
                <li>{isHindi ? "नाम" : "Name"}</li>
                <li>{isHindi ? "मोबाइल नंबर" : "Mobile Number"}</li>
                <li>{isHindi ? "ईमेल पता" : "Email Address"}</li>
                <li>{isHindi ? "यात्री विवरण" : "Passenger Information"}</li>
                <li>{isHindi ? "यात्रा विवरण" : "Journey Information"}</li>
                <li>{isHindi ? "भुगतान संदर्भ विवरण" : "Payment References"}</li>
                <li>{isHindi ? "IP पता" : "IP Address"}</li>
                <li>{isHindi ? "डिवाइस और ब्राउज़र जानकारी" : "Device & Browser Information"}</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                3. {isHindi ? "जानकारी का उपयोग" : "How We Use Information"}
              </h2>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {isHindi
                    ? "टिकट बुकिंग और पुष्टि के लिए"
                    : "To process bookings and confirmations"}
                </li>
                <li>
                  {isHindi
                    ? "रिफंड प्रोसेसिंग के लिए"
                    : "To process refunds"}
                </li>
                <li>
                  {isHindi
                    ? "ग्राहक सहायता प्रदान करने के लिए"
                    : "To provide customer support"}
                </li>
                <li>
                  {isHindi
                    ? "सेवाओं में सुधार के लिए"
                    : "To improve our services"}
                </li>
                <li>
                  {isHindi
                    ? "धोखाधड़ी रोकथाम हेतु"
                    : "For fraud prevention"}
                </li>
                <li>
                  {isHindi
                    ? "कानूनी आवश्यकताओं का पालन करने हेतु"
                    : "To comply with legal obligations"}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                4. {isHindi ? "जानकारी साझा करना" : "Sharing of Information"}
              </h2>

              <p>
                {isHindi
                  ? "हम आपकी जानकारी भुगतान गेटवे, तकनीकी साझेदारों, ग्राहक सहायता प्रदाताओं, सरकारी प्राधिकरणों और कानूनी एजेंसियों के साथ केवल आवश्यक होने पर साझा कर सकते हैं।"
                  : "We may share information with payment gateways, technology partners, customer support providers, government authorities, and legal agencies where required by law or for providing our services."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                5. {isHindi ? "भुगतान जानकारी" : "Payment Information"}
              </h2>

              <p>
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज डेबिट कार्ड, क्रेडिट कार्ड, UPI PIN या बैंकिंग क्रेडेंशियल्स को संग्रहीत नहीं करती। सभी भुगतान सुरक्षित तृतीय-पक्ष भुगतान गेटवे के माध्यम से संसाधित किए जाते हैं।"
                  : "Shree Mateshwari Enterprises does not store debit card, credit card, UPI PIN, or banking credentials. Payments are processed through secure third-party payment gateways."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                6. {isHindi ? "कुकीज़ एवं एनालिटिक्स" : "Cookies & Analytics"}
              </h2>

              <p>
                {isHindi
                  ? "हम वेबसाइट प्रदर्शन और उपयोगकर्ता अनुभव को बेहतर बनाने के लिए कुकीज़ और एनालिटिक्स तकनीकों का उपयोग कर सकते हैं।"
                  : "We may use cookies and analytics technologies to improve website performance, user experience, and service quality."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                7. {isHindi ? "डेटा सुरक्षा" : "Data Security"}
              </h2>

              <p>
                {isHindi
                  ? "हम आपकी जानकारी को अनधिकृत पहुंच, उपयोग या प्रकटीकरण से बचाने के लिए उद्योग-मानक सुरक्षा उपायों का उपयोग करते हैं।"
                  : "We use reasonable administrative, technical, and physical safeguards to protect your information from unauthorized access, disclosure, or misuse."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                8. {isHindi ? "डेटा संरक्षण अवधि" : "Data Retention"}
              </h2>

              <p>
                {isHindi
                  ? "हम आपकी व्यक्तिगत जानकारी को केवल उतनी अवधि तक सुरक्षित रखते हैं जितनी सेवाएँ प्रदान करने या कानूनी आवश्यकताओं को पूरा करने के लिए आवश्यक हो।"
                  : "We retain personal information only as long as necessary to provide services, comply with legal obligations, and resolve disputes."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                9. {isHindi ? "आपके अधिकार" : "Your Rights"}
              </h2>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {isHindi
                    ? "अपनी जानकारी तक पहुंच प्राप्त करना"
                    : "Access your personal information"}
                </li>
                <li>
                  {isHindi
                    ? "जानकारी में संशोधन करवाना"
                    : "Request corrections"}
                </li>
                <li>
                  {isHindi
                    ? "जानकारी हटाने का अनुरोध करना"
                    : "Request deletion where legally permitted"}
                </li>
                <li>
                  {isHindi
                    ? "सहमति वापस लेना"
                    : "Withdraw consent where applicable"}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                10. {isHindi ? "तृतीय-पक्ष सेवाएँ" : "Third-Party Services"}
              </h2>

              <p>
                {isHindi
                  ? "हमारी वेबसाइट में तृतीय-पक्ष वेबसाइटों, भुगतान गेटवे या सेवाओं के लिंक हो सकते हैं। हम उनकी गोपनीयता नीतियों के लिए जिम्मेदार नहीं हैं।"
                  : "Our website may contain links to third-party websites or services. We are not responsible for their privacy practices or content."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                11. {isHindi ? "बच्चों की गोपनीयता" : "Children's Privacy"}
              </h2>

              <p>
                {isHindi
                  ? "हम जानबूझकर 18 वर्ष से कम आयु के बच्चों से व्यक्तिगत जानकारी एकत्र नहीं करते हैं।"
                  : "We do not knowingly collect personal information from children under the age of 18."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                12.{" "}
                {isHindi
                  ? "गोपनीयता नीति में परिवर्तन"
                  : "Changes to This Privacy Policy"}
              </h2>

              <p>
                {isHindi
                  ? "हम समय-समय पर इस नीति को अपडेट कर सकते हैं। सभी परिवर्तन वेबसाइट पर प्रकाशित किए जाएंगे।"
                  : "We may update this Privacy Policy from time to time. Updated versions will be published on our website."}
              </p>
            </div>

            <div>
              <h2 className="font-bold text-lg text-[#111827] mb-2">
                13. {isHindi ? "लागू कानून" : "Governing Law"}
              </h2>

              <p>
                {isHindi
                  ? "यह नीति भारत के कानूनों के अनुसार संचालित होगी और सभी विवाद राजस्थान, भारत के न्यायालयों के अधिकार क्षेत्र में होंगे।"
                  : "This Privacy Policy shall be governed by the laws of India and disputes shall be subject to the exclusive jurisdiction of courts in Rajasthan, India."}
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
                    href="mailto:info@shreemateshwaribus.com"
                    className="text-[#E8721A] hover:underline"
                  >
                    info@shreemateshwaribus.com
                  </Link>
                </p>

                <p>
                  Website:{" "}
                  <Link
                    href="https://shreemateshwaribus.com"
                    className="text-[#E8721A] hover:underline"
                  >
                    https://shreemateshwaribus.com
                  </Link>
                </p>

                <p>Phone: +91 99282 61238</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}