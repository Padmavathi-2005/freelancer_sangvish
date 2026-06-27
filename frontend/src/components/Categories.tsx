"use client";

import React from "react";

export default function Categories() {
  const categoryList = [
    {
      title: "Web Development",
      count: "4,523 Freelancers",
      icon: (
        <svg className="w-5 h-5 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      title: "UI/UX Design",
      count: "2,105 Freelancers",
      icon: (
        <svg className="w-5 h-5 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
          <path d="M9 11v-4" />
          <path d="M5 13v-4" />
        </svg>
      ),
    },
    {
      title: "AI Automation",
      count: "1,240 Freelancers",
      icon: (
        <svg className="w-5 h-5 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
          <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
          <path d="M9 21h6" />
          <path d="M2 14h1M21 14h1" />
        </svg>
      ),
    },
    {
      title: "Digital Marketing",
      count: "3,892 Freelancers",
      icon: (
        <svg className="w-5 h-5 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10 font-display">
          Browse Popular Categories
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryList.map((category, index) => (
            <div 
              key={index} 
              className="bg-slate-100/70 border border-slate-200/60 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:bg-white hover:border-[#0a5a54]/30 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer flex flex-col items-start gap-4"
            >
              {/* Icon badge */}
              <div className="w-10 h-10 rounded-full bg-[#e6f0ef] flex items-center justify-center shrink-0 shadow-inner">
                {category.icon}
              </div>
              
              {/* Text details */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                  {category.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {category.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
