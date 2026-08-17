import React from "react";

export default function PatternDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full py-8 flex items-center justify-center overflow-hidden opacity-40 select-none ${className}`}>
      <div className="site-container flex items-center justify-center gap-2 sm:gap-3 text-[#B46B18]">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#B46B18]/40 to-[#B46B18]/60" />
        <div className="flex items-center gap-1.5 text-xs tracking-widest font-mono">
          <span>❖</span>
          <span>•</span>
          <span>❖</span>
          <span>•</span>
          <span>❖</span>
          <span>•</span>
          <span>❖</span>
          <span>•</span>
          <span>❖</span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#B46B18]/40 to-[#B46B18]/60" />
      </div>
    </div>
  );
}
