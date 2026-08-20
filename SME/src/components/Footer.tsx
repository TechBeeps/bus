import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Bus, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");

  const popularRoutes = [
    { name: "Fatehnagar → Barisadri", href: "/routes" },
    { name: "Salumbar → Bhilwara", href: "/routes" },
    { name: "Bhinder → Bhilwara", href: "/routes" },
    { name: "Aawari Mata Ji → Udaipur", href: "/routes" },
    { name: "Mangalwar → Kanore", href: "/routes" },
    { name: "Chittorgarh → Udaipur", href: "/routes" },
  ];

  return (
    <footer className="bg-[#0A0E17] text-gray-400">      
      <div className="w-full h-3 bg-[#E8721A]" />

      <div className="site-container pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-gray-800/80">         
          <div className="lg:col-span-4 space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8721A] flex items-center justify-center text-white shadow-sm shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight block">
                  Shree Mateshwari Enterprises
                </span>
                <span className="text-[11px] text-gray-400 font-hind block">
                  श्री मातेश्वरी एंटरप्राइजेज
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-gray-400 pt-2">
              {t("brandTagline")}
            </p>

            <p className="text-xs text-[#E8721A] font-semibold">
              {t("ownerCredit")}
            </p>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/routes" className="hover:text-white transition">
                  Routes
                </Link>
              </li>
              <li>
                <Link href="/qr-payment" className="hover:text-white transition">
                  QR Payment
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t("popularRoutes")}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {popularRoutes.map((r, idx) => (
                <li key={idx}>
                  <Link href={r.href} className="hover:text-white transition flex items-center gap-1.5">
                    <span className="text-[#E8721A]">›</span>
                    <span>{r.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t("contactUs")}
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E8721A] shrink-0 mt-0.5" />
                <span>{t("addressVal")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#E8721A] shrink-0" />
                <Link href="tel:+919636048785" className="hover:text-white transition font-mono">
                  {t("phoneVal")}
                </Link>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#E8721A] shrink-0" />
                <Link href="mailto:naresh12881288@gmail.com" className="hover:text-white transition">
                  {t("emailVal")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 text-center space-y-2 text-[11px] sm:text-xs text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="hover:text-gray-300 transition cursor-pointer">
            <Link href="/privacy-policy" className="hover:text-gray-300 transition cursor-pointer">
              {t("privacyPolicy")}
            </Link>
            </span>
            <span>|</span>
            <span className="hover:text-gray-300 transition cursor-pointer">
              <Link href="/terms-and-conditions" className="hover:text-gray-300 transition cursor-pointer">
              {t("termsConditions")}
              </Link>
            </span>
            <span>|</span>
            <Link href="/refund-policy" className="hover:text-gray-300 transition cursor-pointer">
              {t("refundPolicy")}
            </Link>
          </div>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
