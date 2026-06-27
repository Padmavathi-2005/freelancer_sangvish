"use client";

import React from "react";

export default function WhyChoose() {
  const benefits = [
    {
      title: "Verified Talent",
      description: "Every freelancer undergoes a rigorous vetting process to ensure top quality.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 11 2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "AI Matching",
      description: "Our smart algorithms connect you with the perfect fit for your specific project needs.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
      ),
    },
    {
      title: "Secure Payments",
      description: "Funds are held in escrow and only released when you are 100% satisfied.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="12" cy="14" r="2.5" />
        </svg>
      ),
    },
    {
      title: "24/7 Support",
      description: "Our dedicated team is always available to help you with any questions or issues.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h8" />
          <path d="M8 14h6" />
        </svg>
      ),
    },
    {
      title: "Fast Hiring",
      description: "Hire a professional and start working on your project within hours, not weeks.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: "Seamless Collaboration",
      description: "Built-in workspace tools for easy communication and file sharing.",
      icon: (
        <svg className="w-6 h-6 text-[#0a5a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Why Choose Freelancer?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-3 max-w-xl mx-auto font-medium leading-relaxed">
            We provide a seamless experience to find, hire, and manage top freelance talent globally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bg-slate-100/70 border border-slate-200/60 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.03] hover:bg-white hover:border-[#0a5a54]/30 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col items-start gap-4"
            >
              {/* Icon badge */}
              <div className="w-11 h-11 rounded-2xl bg-[#e6f0ef] flex items-center justify-center shrink-0 shadow-inner">
                {benefit.icon}
              </div>
              
              {/* Details text */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
