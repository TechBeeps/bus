"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Bus, QrCode, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-[#0F1A33] overflow-hidden">      
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/banner-img.png"
          alt="Shree Mateshwari Enterprises - Mewar Rajasthan"
          fill
          priority
          className="object-cover object-bottom"
        />        
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>
      
      <div className="relative z-10 site-container py-20 text-center flex flex-col items-center space-y-4 animate-fade-in-up">        
        <div className="inline-block px-4 py-1 rounded-full bg-[#E8721A] text-white text-xs sm:text-sm font-bold shadow-md select-none">
          {t("badge")}
        </div>
        
        <div className="space-y-3 sm:space-y-4 pt-1">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-md">
            {t("headline")}
          </h1>          
          <p className="text-lg sm:text-2xl md:text-3xl text-white/95 font-medium font-hind leading-normal tracking-wide drop-shadow-sm pt-1">
            {t("subheadlineHi")}
          </p>
        </div>
        
        <p className="text-[#FFC107] font-bold text-base sm:text-xl md:text-2xl drop-shadow pt-1">
          {t("accent")}
        </p>
        
        <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-normal pt-1">
          {t("description")}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6">          
          <Link
            href="/routes"
            className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#E8721A] hover:bg-[#D46212] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/30 hover:scale-105 transition duration-200"
          >
            <Bus className="w-4 h-4" />
            <span>{t("viewRoutes")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/qr-payment"
            className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-black/45 hover:bg-black/65 text-white font-bold text-sm sm:text-base border border-white/30 backdrop-blur-md hover:scale-105 transition duration-200 shadow-md"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>{t("payByQr")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
