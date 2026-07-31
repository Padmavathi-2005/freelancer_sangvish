"use client";

import React from "react";

const COMPANIES = [
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Spotify", logo: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg" },
];

export default function TrustedCompanies() {
  return (
    <section className="w-full bg-slate-100 dark:bg-zinc-950 py-8 border-b border-slate-200/60 dark:border-zinc-800/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-6">
          Trusted by 10,000+ leading companies & enterprise teams worldwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition duration-300">
          {COMPANIES.map((company, idx) => (
            <div key={idx} className="h-7 sm:h-8 flex items-center justify-center transition hover:scale-105">
              <img
                src={company.logo}
                alt={company.name}
                className="h-full object-contain filter dark:invert"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
