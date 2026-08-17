"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FaGoogle, 
  FaMicrosoft, 
  FaSpotify, 
  FaAirbnb, 
  FaAmazon, 
  FaMeta, 
  FaUber, 
  FaShopify, 
  FaSlack,
  FaApple
} from "react-icons/fa6";

export default function CompanyScrollSection() {
  const { t } = useLanguage();

  const companies = [
    { name: "Google", Icon: FaGoogle },
    { name: "Microsoft", Icon: FaMicrosoft },
    { name: "Spotify", Icon: FaSpotify },
    { name: "Airbnb", Icon: FaAirbnb },
    { name: "Amazon", Icon: FaAmazon },
    { name: "Meta", Icon: FaMeta },
    { name: "Uber", Icon: FaUber },
    { name: "Shopify", Icon: FaShopify },
    { name: "Slack", Icon: FaSlack },
    { name: "Apple", Icon: FaApple }
  ];

  // 6x the array for infinite smooth 360-degree looping without gaps
  const loopedCompanies = [...companies, ...companies, ...companies, ...companies, ...companies, ...companies];

  return (
    <div className="w-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border-y border-slate-200/60 dark:border-zinc-800/80 py-8 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-[10px] sm:text-xs font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-6">
          {t("trusted_title", "Trusted by Innovative Companies Worldwide")}
        </p>

        <div className="relative w-full overflow-hidden mask-linear-gradient" style={{ direction: "ltr" }}>
          <div className="flex items-center gap-12 sm:gap-16 w-max animate-marquee py-2">
            {loopedCompanies.map((comp, idx) => {
              const IconComp = comp.Icon;
              return (
                <div key={idx} className="flex items-center gap-3 shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
                  <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 tracking-wider font-display uppercase group-hover:text-primary transition-colors">
                    {comp.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
