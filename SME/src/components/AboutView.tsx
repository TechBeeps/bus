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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">            
            <div className=" flex flex-col items-center text-center">              
              <div className="relative flex items-center justify-center">                
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#B46B18]/80 animate-spin-slow pointer-events-none" />                
                <div className="relative w-70 h-70 m-6 rounded-full overflow-hidden border-2 border-amber-400 p-1 bg-[#FFFDF9] shadow-lg">
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
            </div>            
            <div className=" space-y-6">
              <div className="space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                <p>{t("p1")}</p>
                <p>{t("p2")}</p>
              </div>              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {pills.map((pill, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-300/80 bg-[#FFF8EE] text-xs sm:text-sm font-semibold text-[#8C4A0B]"
                  >
                    <Check className="w-3.5 h-3.5 text-[#E8721A] stroke-[3]" />
                    <span>{pill}</span>
                  </div>
                ))}
              </div>              
              <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-[#EDE5D8]/70 border border-[#E0D5C3] space-y-3.5">
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
                    <Link href="tel:+919928261238" className="hover:text-[#E8721A] transition font-mono">
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
          </div>
        </div>
      </section>
    </div>
  );
}
