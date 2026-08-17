"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";

export default function HomeAboutSection() {
  const t = useTranslations("homeAbout");

  const pills = [
    t("pill1"),
    t("pill2"),
    t("pill3"),
    t("pill4"),
  ];

  return (
    <section className="py-16">
      <div className="site-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Column: Founder Profile */}
          <div className="flex flex-col items-center text-center">
            {/* Circular Photo with 360° Rotating Dashed Ring */}
            <div className="relative flex items-center justify-center">
              {/* Outer 360° Auto-Rotating Dashed Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#B46B18]/80 animate-spin-slow pointer-events-none" />

              {/* Inner Stationary Profile Photo with Gold Border */}
              <div className="relative w-70 h-70 m-6 rounded-full overflow-hidden border-2 border-amber-400 p-1 bg-[#FFFDF9] shadow-lg">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src="/images/portrait 1.jpg"
                    alt="Mr. Narendra Kumar Purbiya - Founder & Owner"
                    height={1529}
                    width={1358}
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#111827] mt-4">
              {t("founderName")}
            </h3>
            <p className="text-xs sm:text-sm text-[#9C6218] font-medium mt-0.5">
              {t("founderRole")}
            </p>

            {/* 5-Star Rating */}
            <div className="flex items-center justify-center gap-1 text-amber-400 mt-2 text-sm select-none">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
          </div>

          {/* Right Column: Story & Pills */}
          <div className=" space-y-4 ">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
              {t("title")}
            </h2>
            <p className="text-sm sm:text-base text-[#9C6218] font-semibold">
              {t("subtitle")}
            </p>

            <div className="space-y-3 pt-1 text-sm sm:text-base text-gray-700 leading-relaxed">
              <p>{t("p1")}</p>
              <p>{t("p2")}</p>
            </div>

            {/* 4 Feature Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
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

            {/* Read More Link */}
            <div className="pt-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-[#E8721A] hover:text-[#D46212] font-bold text-sm sm:text-base transition group"
              >
                <span>{t("readMore")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
