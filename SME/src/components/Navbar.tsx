"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Menu, X, Phone } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "hi" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/routes", label: t("routes") },
    { href: "/qr-payment", label: t("qrPayment") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#faf4ea] border-b border-[#EBE4D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all">
      <div className="site-container">
        <div className="flex items-center justify-between h-20">          
          <Link
            href="/"
            className="flex items-center group transition hover:opacity-95"
          >
            <BrandLogo />
          </Link>
          
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition duration-200 ${isActive
                    ? "bg-[#EDE5D8] text-[#E8721A] font-bold shadow-xs"
                    : "text-[#2B2B2B] hover:text-[#E8721A] hover:bg-[#F2ECE2]"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>          
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              aria-label="Switch Language"
              className="inline-flex items-center justify-center h-8 sm:h-9 px-3.5 sm:px-4 rounded-full border-2 border-[#E8721A] bg-transparent text-xs sm:text-sm font-bold transition hover:bg-orange-50/70 cursor-pointer select-none leading-none"
            >
              <span
                className={`leading-none flex items-center ${locale === "en" ? "text-[#E8721A] font-black" : "text-[#7A6B5D]"
                  }`}
              >
                EN
              </span>
              <span className="w-[1.5px] h-3.5 bg-[#E8721A]/60 mx-2 rounded-full self-center" />
              <span
                className={`leading-none mt-[4px] flex items-center font-hind ${locale === "hi" ? "text-[#E8721A] font-black" : "text-[#7A6B5D]"
                  }`}
              >
                हिं
              </span>
            </button>
          </div>

          {/* Mobile Menu & Language Pill */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleLanguage}
              aria-label="Switch Language"
              className="inline-flex items-center justify-center h-7 px-2.5 rounded-full border-2 border-[#E8721A] bg-transparent text-xs font-bold transition hover:bg-orange-50/70 cursor-pointer select-none leading-none"
            >
              <span
                className={`leading-none flex items-center ${locale === "en" ? "text-[#E8721A] font-black" : "text-[#7A6B5D]"
                  }`}
              >
                EN
              </span>
              <span className="w-[1px] h-3 bg-[#E8721A]/60 mx-1.5 rounded-full self-center" />
              <span
                className={`leading-none flex items-center font-hind ${locale === "hi" ? "text-[#E8721A] font-black" : "text-[#7A6B5D]"
                  }`}
              >
                हिं
              </span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[#EDE5D8] text-[#2B2B2B] hover:text-[#E8721A] focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf4ea] border-b border-[#EBE4D8] shadow-xl px-4 pt-2 pb-6 space-y-1.5 animate-fade-in">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition ${isActive
                  ? "bg-[#EDE5D8] text-[#E8721A] font-bold"
                  : "text-[#2B2B2B] hover:bg-[#F2ECE2] hover:text-[#E8721A]"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#EBE4D8] flex flex-col gap-2">
            <Link
              href="tel:+919636048785"
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#2B2B2B] bg-[#EDE5D8] rounded-xl hover:bg-[#E5DCce] transition"
            >
              <Phone className="w-4 h-4 text-[#E8721A]" />
              <span>+91 99282 61238</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
