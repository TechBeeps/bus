"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Check, MapPin, Phone, Mail } from "lucide-react";

export default function AboutView() {
  const t = useTranslations("about");

  const pills = [
    t("pill1"),
    t("pill2"),
    t("pill3"),
    t("pill4"),
    t("pill5"),
  ];

  return (
    <div className="flex flex-col">
      <div className="py-14 sm:py-16 bg-[#E8721A] text-white text-center">
        <div className="site-container space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {t("pageHeadline")}
          </h1>
          <p className="text-sm sm:text-base text-white/95 max-w-2xl mx-auto font-normal">
            {t("pageSubheadline")}
          </p>
        </div>
      </div>

      <section className="py-16 sm:py-24">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
            {/* Left Column: Founder Details & Contact */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#B46B18]/80 animate-spin-slow pointer-events-none" />
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 m-4 rounded-full overflow-hidden border-2 border-amber-400 p-1 bg-[#FFFDF9] shadow-lg">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src="/images/portrait 1.jpg"
                      alt={`${t("founderName")} - ${t("founderRole")}`}
                      height={1529}
                      width={1358}
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] mt-4">
                {t("founderName")}
              </h2>
              <p className="text-xs sm:text-sm text-[#9C6218] font-medium mt-0.5">
                {t("founderRole")}
              </p>
              <div className="flex items-center justify-center gap-1 text-amber-400 mt-2 text-sm select-none">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>

              {/* Contact Box */}
              <div className="w-full mt-8 p-6 sm:p-7 rounded-2xl bg-[#EDE5D8]/70 border border-[#E0D5C3] space-y-3.5 text-left">
                <h3 className="font-bold text-base text-[#111827]">
                  {t("contactBoxTitle")}
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm text-gray-700 font-medium">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#E8721A] shrink-0" />
                    <span>{t("locationVal")}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#E8721A] shrink-0" />
                    <Link href="tel:+919929261238" className="hover:text-[#E8721A] transition font-mono">
                      {t("phoneVal")}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#E8721A] shrink-0" />
                    <Link href="mailto:naresh12881288@gmail.com" className="hover:text-[#E8721A] transition">
                      {t("emailVal")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Complete Narrative Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed font-normal">
                <p>{t("p1")}</p>
                <p>{t("p2")}</p>
                <p>{t("p3")}</p>
                <p>{t("p4")}</p>
                <p>{t("p5")}</p>
              </div>

              {/* 5 Value Pills */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {pills.map((pill, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-300/80 bg-[#FFF8EE] text-xs sm:text-sm font-semibold text-[#8C4A0B]"
                  >
                    <Check className="w-3.5 h-3.5 text-[#E8721A] stroke-[3]" />
                    <span>{pill}</span>
                  </div>
                ))}
              </div>

              {/* Blessings Paragraph */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EE] border border-amber-200 text-sm sm:text-base text-gray-800 font-normal leading-relaxed">
                <p>{t("p6")}</p>
              </div>

              {/* Signature Quote Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#FFF8EE] to-[#FFF2DF] border border-amber-300 text-[#7A3E09] space-y-1.5">
                <p className="font-semibold text-base sm:text-lg italic leading-relaxed">
                  {t("quoteText")}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#9C4B08] text-right uppercase tracking-wide">
                  — {t("quoteAuthor")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
