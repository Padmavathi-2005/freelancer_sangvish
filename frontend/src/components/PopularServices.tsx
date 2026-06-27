"use client";

import React from "react";

export default function PopularServices() {
  const services = [
    {
      title: "I will build a custom responsive website in React",
      rating: "4.9",
      reviews: "1k+ reviews",
      price: "$500",
      icon: (
        <svg className="w-12 h-12 text-[#0a5a54] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      title: "I will design a high-converting landing page in Figma",
      rating: "5.0",
      reviews: "450 reviews",
      price: "$350",
      icon: (
        <svg className="w-12 h-12 text-[#0a5a54] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
          <path d="M9 11v-4" />
          <path d="M5 13v-4" />
        </svg>
      ),
    },
    {
      title: "I will optimize your website for SEO and speed",
      rating: "4.8",
      reviews: "600 reviews",
      price: "$200",
      icon: (
        <svg className="w-12 h-12 text-[#0a5a54] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
          Popular Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-[#0a5a54]/30 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer bg-white"
              onClick={() => alert(`Opening details page for: "${service.title}"`)}
            >
              {/* Top visual block (Grey backing with centered icon) */}
              <div className="bg-slate-200/70 hover:bg-slate-200/50 transition-colors duration-300 flex items-center justify-center p-12 aspect-video rounded-t-2xl shrink-0">
                {service.icon}
              </div>

              {/* Bottom detail block */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-5 border-t border-slate-100">
                <div className="flex flex-col gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#0a5a54] font-bold">★ {service.rating}</span>
                    <span className="text-slate-400 font-medium">({service.reviews})</span>
                  </div>
                </div>

                {/* Footer starting price */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider">Starting At</span>
                  <span className="text-base font-extrabold text-slate-900">{service.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
