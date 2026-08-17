import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { RotateCcw } from "lucide-react";
import { BreadcrumbSchema } from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.refundPolicy" });

  const title = t("title");
  const description = t("description");
  const url = `https://shreemate.in/${locale}/refund-policy`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: "https://shreemate.in/en/refund-policy",
        hi: "https://shreemate.in/hi/refund-policy",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Shree Mateshwari Enterprises — SME Buses",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      type: "website",
    },
  };
}

export default async function RefundPolicyPage({
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
            url: `https://shreemate.in/${locale}`,
          },
          {
            name: isHindi ? "रिफंड एवं रद्दीकरण नीति" : "Refund & Cancellation Policy",
            url: `https://shreemate.in/${locale}/refund-policy`,
          },
        ]}
      />

      <div className="py-12 sm:py-16 bg-[#E8721A] text-white text-center">
        <div className="site-container space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-3">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {isHindi ? "रिफंड एवं रद्दीकरण नीति" : "Refund & Cancellation Policy"}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-normal">
            {isHindi ? "अंतिम अपडेट: 17 अगस्त 2025" : "Last updated: August 17, 2025"}
          </p>
        </div>
      </div>
      
      <section className="pt-12 pb-4">
        <div className="site-container">
          <h2 className="text-base sm:text-lg font-bold text-[#111827] text-center mb-4">
            {isHindi ? "रद्दीकरण एवं रिफंड एक नज़र में" : "Cancellation at a Glance"}
          </h2>

          <div className="max-w-3xl mx-auto rounded-xl overflow-hidden border border-amber-200/90 shadow-xs bg-[#FFFDF9]">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#E8721A] text-white font-bold">
                  <th className="py-3 px-4 sm:px-6">{isHindi ? "प्रस्थान से पहले का समय" : "Time Before Departure"}</th>
                  <th className="py-3 px-4 sm:px-6">{isHindi ? "रद्दीकरण शुल्क" : "Cancellation Fee"}</th>
                  <th className="py-3 px-4 sm:px-6">{isHindi ? "रिफंड राशि" : "Refund"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 text-gray-800">
                <tr className="hover:bg-[#FAF5EB]/50 transition">
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "24 घंटे से अधिक" : "More than 24 hours"}</td>
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "किराए का 20%" : "20% of fare"}</td>
                  <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{isHindi ? "80% रिफंड" : "80% refunded"}</td>
                </tr>
                <tr className="hover:bg-[#FAF5EB]/50 transition">
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "12 – 24 घंटे" : "12 – 24 hours"}</td>
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "किराए का 50%" : "50% of fare"}</td>
                  <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{isHindi ? "50% रिफंड" : "50% refunded"}</td>
                </tr>
                <tr className="hover:bg-[#FAF5EB]/50 transition">
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "12 घंटे से कम" : "Less than 12 hours"}</td>
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "किराए का 100%" : "100% of fare"}</td>
                  <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{isHindi ? "कोई रिफंड नहीं" : "No refund"}</td>
                </tr>
                <tr className="hover:bg-[#FAF5EB]/50 transition">
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "नो-शो (बस में उपस्थित न होना)" : "No-show"}</td>
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "किराए का 100%" : "100% of fare"}</td>
                  <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{isHindi ? "कोई रिफंड नहीं" : "No refund"}</td>
                </tr>
                <tr className="hover:bg-[#FAF5EB]/50 transition">
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "कंपनी द्वारा रद्द" : "Cancelled by us"}</td>
                  <td className="py-3 px-4 sm:px-6">{isHindi ? "शून्य (None)" : "None"}</td>
                  <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{isHindi ? "100% पूरा रिफंड" : "Full refund"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <section className="py-8 pb-16">
        <div className="site-container">
          <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#FFFDF9] border border-[#FED7AA]/80 shadow-xs space-y-8 text-gray-700 text-xs sm:text-sm leading-relaxed">           
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                1. {isHindi ? "अवलोकन (Overview)" : "Overview"}
              </h3>
              <p>
                {isHindi
                  ? 'यह रिफंड एवं रद्दीकरण नीति ("नीति") श्री मातेश्वरी एंटरप्राइजेज ("कंपनी", "हम", "हमारी") द्वारा राजस्थान के मेवाड़ क्षेत्र में संचालित सभी बस टिकटों और यात्रा सेवाओं के लिए लागू होती है।'
                  : 'This Refund & Cancellation Policy ("Policy") governs all cancellations and refund requests for bus tickets and services provided by Shree Mateshwari Enterprises ("Company", "we", "us", or "our"), operating in the Mewar region of Rajasthan, India.'}
              </p>
              <p>
                {isHindi
                  ? "टिकट बुक करने या हमारी सेवाओं का उपयोग करने पर आप इस नीति की शर्तों से सहमत होते हैं। कृपया बुकिंग करने से पहले इसे ध्यानपूर्वक पढ़ें।"
                  : "By booking a ticket or using our services, you agree to the terms of this Policy. Please read it carefully before making a booking."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                2. {isHindi ? "यात्री द्वारा टिकट रद्दीकरण" : "Ticket Cancellation by Passenger"}
              </h3>
              <p>
                {isHindi
                  ? "यात्री निम्नलिखित शर्तों के अधीन अपने बुक किए गए टिकट रद्द कर सकते हैं:"
                  : "Passengers may cancel their booked tickets subject to the following conditions:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>
                  <strong className="text-gray-800">{isHindi ? "प्रस्थान से 24 घंटे से अधिक पहले:" : "More than 24 hours before departure:"}</strong>{" "}
                  {isHindi
                    ? "टिकट किराए का 20% रद्दीकरण शुल्क काटा जाएगा। शेष 80% राशि 5-7 कार्य दिवसों में मूल भुगतान माध्यम पर वापस कर दी जाएगी।"
                    : "A cancellation fee of 20% of the ticket fare will be deducted. The remaining amount will be refunded to the original payment method within 5–7 working days."}
                </li>
                <li>
                  <strong className="text-gray-800">{isHindi ? "प्रस्थान से 12 से 24 घंटे के बीच:" : "Between 12 and 24 hours before departure:"}</strong>{" "}
                  {isHindi
                    ? "टिकट किराए का 50% रद्दीकरण शुल्क काटा जाएगा। शेष 50% राशि 5-7 कार्य दिवसों में वापस की जाएगी।"
                    : "A cancellation fee of 50% of the ticket fare will be deducted. The remaining 50% will be refunded within 5–7 working days."}
                </li>
                <li>
                  <strong className="text-gray-800">{isHindi ? "प्रस्थान से 12 घंटे से कम समय पहले:" : "Less than 12 hours before departure:"}</strong>{" "}
                  {isHindi
                    ? "कोई रिफंड जारी नहीं किया जाएगा। पूरा टिकट किराया गैर-वापसी योग्य होगा।"
                    : "No refund will be issued. The full ticket fare is non-refundable."}
                </li>
                <li>
                  <strong className="text-gray-800">{isHindi ? "नो-शो (यात्री बस में नहीं बैठा):" : "No-show (passenger does not board):"}</strong>{" "}
                  {isHindi
                    ? "जो यात्री निर्धारित प्रस्थान समय पर बस में सवार नहीं होते हैं, उनके लिए कोई रिफंड जारी नहीं किया जाएगा।"
                    : "No refund will be issued for passengers who do not board the bus at the scheduled departure time."}
                </li>
              </ul>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                3. {isHindi ? "श्री मातेश्वरी एंटरप्राइजेज द्वारा रद्दीकरण" : "Cancellation by Shree Mateshwari Enterprises"}
              </h3>
              <p>
                {isHindi
                  ? "यदि किसी परिचालन, तकनीकी या सुरक्षा कारणों से श्री मातेश्वरी एंटरप्राइजेज द्वारा कोई निर्धारित बस सेवा रद्द की जाती है:"
                  : "In the event that Shree Mateshwari Enterprises cancels a scheduled bus service due to operational, mechanical, or safety reasons:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>{isHindi ? "यात्री को पूरे टिकट किराए का 100% रिफंड जारी किया जाएगा।" : "A full refund of the ticket fare will be issued to the passenger."}</li>
                <li>{isHindi ? "रिफंड 5-7 कार्य दिवसों के भीतर मूल भुगतान माध्यम पर प्रोसेस किया जाएगा।" : "Refunds will be processed within 5–7 working days to the original payment method."}</li>
                <li>{isHindi ? "जहाँ संभव हो, हम प्रभावित यात्रियों के लिए बिना किसी अतिरिक्त शुल्क के वैकल्पिक बस सेवा की व्यवस्था करने का प्रयास करेंगे।" : "Where possible, we will attempt to arrange an alternative bus service for affected passengers at no additional cost."}</li>
                <li>{isHindi ? "श्री मातेश्वरी एंटरप्राइजेज टिकट किराए के रिफंड से अधिक किसी भी अतिरिक्त लागत, नुकसान या असुविधा के लिए उत्तरदायी नहीं होगा।" : "Shree Mateshwari Enterprises shall not be liable for any additional costs, losses, or inconvenience caused by a service cancellation beyond the refund of the ticket fare."}</li>
              </ul>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                4. {isHindi ? "सेवा में व्यवधान एवं देरी" : "Service Disruptions & Delays"}
              </h3>
              <p>
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज निम्नलिखित कारणों से होने वाली देरी या व्यवधान के लिए उत्तरदायी नहीं होगा:"
                  : "Shree Mateshwari Enterprises shall not be liable for delays or disruptions caused by:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>{isHindi ? "ट्रैफ़िक जाम, सड़क बंद होना या दुर्घटनाएं।" : "Traffic congestion, road closures, or accidents."}</li>
                <li>{isHindi ? "प्रतिकूल मौसम की स्थिति या प्राकृतिक आपदाएं।" : "Adverse weather conditions or natural calamities."}</li>
                <li>{isHindi ? "सरकारी आदेश, दंगे या बंद।" : "Government orders, riots, or bandhs."}</li>
                <li>{isHindi ? "हमारे उचित नियंत्रण से परे यांत्रिक खराबी।" : "Mechanical breakdowns beyond our reasonable control."}</li>
              </ul>
              <p className="text-gray-500 italic pt-1">
                {isHindi
                  ? "ऐसी स्थितियों में केवल देरी के लिए कोई रिफंड जारी नहीं किया जाएगा। यदि कोई सेवा पूरी तरह से संचालित करने में असमर्थ है, तो धारा 3 की रद्दीकरण नीति लागू होगी।"
                  : "In such events, no refund will be issued for delays alone. If a service is entirely unable to operate, the cancellation policy in Section 3 will apply."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                5. {isHindi ? "QR पेमेंट एवं डिजिटल किराया रिफंड" : "QR Payment & Digital Fare Refunds"}
              </h3>
              <p>
                {isHindi
                  ? "QR कोड या UPI के माध्यम से भुगतान किए गए किराए के लिए:"
                  : "For fares paid via QR code or UPI:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>{isHindi ? "रिफंड उसी मूल UPI ID या बैंक खाते में भेजा जाएगा जिससे भुगतान किया गया था।" : "Refunds will be processed to the original UPI ID or bank account used for payment."}</li>
                <li>{isHindi ? "रिफंड प्रोसेसिंग समय 5-7 कार्य दिवस है, जो आपके बैंक के नियमों के अधीन है।" : "Refund processing time is 5–7 working days, subject to your bank's processing schedule."}</li>
                <li>{isHindi ? "यदि आपके खाते से पैसे कट गए हैं लेकिन बुकिंग की पुष्टि नहीं हुई है, तो कृपया अपने ट्रांजेक्शन रेफरेंस नंबर के साथ तुरंत info@shreemateshwaribus.com पर संपर्क करें। हम 24 घंटों में समाधान करेंगे।" : "In cases where a payment is deducted but a booking confirmation is not received, please contact us immediately at info@shreemateshwaribus.com with your transaction reference number. We will investigate and resolve such cases within 24 hours."}</li>
                <li>{isHindi ? "यात्रा रद्द होने पर अर्जित कैशबैक रिवार्ड्स (यदि कोई हो) स्वतः अमान्य हो जाएंगे।" : "Cashback rewards earned (if applicable) will be forfeited upon cancellation of the associated journey."}</li>
              </ul>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                6. {isHindi ? "गैर-वापसी योग्य शुल्क (Non-Refundable Items)" : "Non-Refundable Items"}
              </h3>
              <p>
                {isHindi
                  ? "निम्नलिखित शुल्क और फ़ीस किसी भी परिस्थिति में सख्ती से गैर-वापसी योग्य हैं:"
                  : "The following charges and fees are strictly non-refundable under any circumstances:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>{isHindi ? "बुकिंग के समय लगाया गया सुविधा शुल्क (Convenience Fee) या सेवा शुल्क।" : "Convenience fees or service charges applied at the time of booking."}</li>
                <li>{isHindi ? "कैशबैक या रिवॉर्ड राशि या प्रोमोशनल छूट।" : "Cashback or reward amounts or promotional discounts."}</li>
                <li>{isHindi ? "बीमा शुल्क, यदि लागू हो।" : "Insurance fees, if applicable."}</li>
                <li>{isHindi ? "विशेष सेवाओं के लिए कोई अतिरिक्त शुल्क (उदा. लगेज हैंडलिंग, आरक्षित सीट अपग्रेड)।" : "Any additional charges for special services (e.g., luggage handling, reserved seating upgrades)."}</li>
              </ul>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                7. {isHindi ? "रद्दीकरण या रिफंड का अनुरोध कैसे करें" : "How to Request a Cancellation or Refund"}
              </h3>
              <p>
                {isHindi
                  ? "बुकिंग रद्द करने या रिफंड का अनुरोध करने के लिए, कृपया हमसे संपर्क करें:"
                  : "To cancel a booking or request a refund, please contact us through the following channels:"}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>{isHindi ? "ईमेल: info@shreemateshwaribus.com" : "Email: info@shreemateshwaribus.com"}</li>
                <li>{isHindi ? "हेल्पलाइन: +91 96360 48785" : "Helpline: +91 96360 48785"}</li>
              </ul>
              <p className="pt-1">
                {isHindi
                  ? "कृपया अपने अनुरोध में निम्नलिखित विवरण शामिल करें:"
                  : "Please include the following details in your request:"}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>{isHindi ? "यात्री का नाम" : "Passenger name"}</li>
                <li>{isHindi ? "यात्रा की तारीख और रूट" : "Journey date and route"}</li>
                <li>{isHindi ? "बुकिंग संदर्भ या QR पेमेंट ट्रांजेक्शन ID" : "Booking reference or QR payment transaction ID"}</li>
                <li>{isHindi ? "रद्द करने का कारण" : "Reason for cancellation"}</li>
              </ul>
              <p className="text-gray-500 italic pt-1">
                {isHindi
                  ? "हम 24 घंटों के भीतर आपके अनुरोध की पुष्टि करेंगे और 5-7 कार्य दिवसों में पात्र रिफंड की प्रक्रिया पूरी करेंगे।"
                  : "We will acknowledge your request within 24 hours and process eligible refunds within 5–7 working days."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                8. {isHindi ? "रिफंड प्रोसेसिंग समय (Processing Time)" : "Refund Processing Time"}
              </h3>
              <p>
                {isHindi
                  ? "स्वीकृति मिलने के बाद रिफंड की प्रक्रिया इस प्रकार होगी:"
                  : "Refunds, once approved, will be processed as follows:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>{isHindi ? "UPI / डिजिटल भुगतान: मूल भुगतान खाते में 5-7 कार्य दिवस।" : "UPI / digital payments: 5–7 working days to the original payment account."}</li>
                <li>{isHindi ? "नकद भुगतान: नकद भुगतान किए गए टिकटों का रिफंड सत्यापन के बाद हमारे निर्धारित बस स्टॉप कार्यालय पर नकद में दिया जाएगा।" : "Cash payments: Refunds for cash-paid tickets will be issued in cash at our designated office bus stop, subject to verification."}</li>
              </ul>
              <p className="text-gray-500 italic pt-1">
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज हमारे नियंत्रण से परे बैंकिंग या पेमेंट गेटवे सिस्टम के कारण रिफंड प्रोसेसिंग में होने वाली देरी के लिए ज़िम्मेदार नहीं है।"
                  : "Shree Mateshwari Enterprises is not responsible for delays in refund processing caused by banking or payment gateway systems beyond our control."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                9. {isHindi ? "विवाद एवं निपटारा (Disputes)" : "Disputes"}
              </h3>
              <p>
                {isHindi
                  ? "रद्दीकरण या रिफंड के संबंध में किसी भी विवाद की स्थिति में, कृपया info@shreemateshwaribus.com पर संपर्क करें। हम 7 कार्य दिवसों के भीतर सौहार्दपूर्ण समाधान निकालने का पूरा प्रयास करेंगे।"
                  : "In case of any dispute regarding a cancellation or refund, please contact us at info@shreemateshwaribus.com. We will make every effort to resolve disputes amicably within 7 working days."}
              </p>
              <p>
                {isHindi
                  ? "यदि समाधान नहीं हो पाता है, तो विवाद भारतीय अनुबंध अधिनियम, 1872 के अनुसार राजस्थान, भारत की अदालतों के अनन्य क्षेत्राधिकार के अधीन होंगे।"
                  : "If a resolution cannot be reached, disputes shall be subject to the exclusive jurisdiction of the courts in Rajasthan, India, in accordance with the Indian Contract Act, 1872."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                10. {isHindi ? "इस नीति में परिवर्तन" : "Changes to This Policy"}
              </h3>
              <p>
                {isHindi
                  ? "श्री मातेश्वरी एंटरप्राइजेज के पास किसी भी समय इस रिफंड एवं रद्दीकरण नीति को संशोधित करने का अधिकार सुरक्षित है। परिवर्तन हमारी वेबसाइट पर पोस्ट किए जाएंगे और तुरंत प्रभावी होंगे। बुकिंग करने से पहले इस नीति की समीक्षा करना आपकी ज़िम्मेदारी है।"
                  : "Shree Mateshwari Enterprises reserves the right to modify this Refund & Cancellation Policy at any time. Changes will be posted on our website and will take effect immediately. It is your responsibility to review this Policy before making a booking."}
              </p>
            </div>            
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                11. {isHindi ? "संपर्क करें (Contact Us)" : "Contact Us"}
              </h3>
              <p>
                {isHindi
                  ? "इस रिफंड एवं रद्दीकरण नीति के संबंध में किसी भी प्रश्न या सहायता के लिए कृपया हमसे संपर्क करें:"
                  : "For any questions or concerns regarding this Refund & Cancellation Policy, please contact us:"}
              </p>
              <div className="pt-2 text-xs sm:text-sm text-gray-700 space-y-1">
                <p className="font-bold text-[#111827]">Shree Mateshwari Enterprises</p>
                <p>Mewar Region, Rajasthan, India</p>
                <p>Email: <Link href="mailto:info@shreemateshwaribus.com" className="text-[#E8721A] hover:underline">info@shreemateshwaribus.com</Link></p>
                <p>Website: <Link href="https://shreemate.in" className="text-[#E8721A] hover:underline">https://shreemate.in</Link></p>
              </div>
            </div>           
            <div className="pt-8 border-t border-amber-100 flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
              <span className="hover:text-gray-700 transition cursor-pointer">
                {isHindi ? "गोपनीयता नीति" : "Privacy Policy"}
              </span>
              <span>|</span>
              <span className="hover:text-gray-700 transition cursor-pointer">
                {isHindi ? "नियम एवं शर्तें" : "Terms & Conditions"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
