"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Clock, IndianRupee } from "lucide-react";

export default function HomeWhyUsSection() {
  const t = useTranslations("homeWhyUs");

  const cards = [
    {
      title: t("c1Title"),
      desc: t("c1Desc"),
      icon: IndianRupee,
    },
    {
      title: t("c2Title"),
      desc: t("c2Desc"),
      icon: ShieldCheck,
    },
    {
      title: t("c3Title"),
      desc: t("c3Desc"),
      icon: Clock,
    },
  ];

  return (
    <section className="py-20">
      <div className="site-container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] text-center mb-12 tracking-tight">
          {t("title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl border-2 border-[#FDE68A] bg-[#FAF5EB]/50 hover:bg-[#FAF5EB] shadow-xs hover:shadow-md transition-all duration-200 text-center flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-[#FFE8D6] text-[#E8721A] flex items-center justify-center mb-5 group-hover:scale-110 transition duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-[#111827] mb-2">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xs">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
