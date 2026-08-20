import React from "react";
import Image from "next/image";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <Image
        src="/images/logo.png"
        alt="Shree Mateshwari Enterprises — श्री मातेश्वरी एंटरप्राइजेज"
        width={240}
        height={80}
        priority
        className="h-11 sm:h-14 w-auto object-contain"
      />
    </div>
  );
}
