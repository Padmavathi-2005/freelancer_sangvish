"use client";

import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Post a Job",
      description: "Describe your project.",
    },
    {
      number: 2,
      title: "Get Matched",
      description: "AI finds the best talent.",
    },
    {
      number: 3,
      title: "Compare",
      description: "Review profiles & proposals.",
    },
    {
      number: 4,
      title: "Hire",
      description: "Choose the right fit.",
    },
    {
      number: 5,
      title: "Collaborate",
      description: "Work and pay securely.",
    },
  ];

  const stats = [
    {
      value: "25K+",
      label: "Freelancers",
    },
    {
      value: "100K+",
      label: "Jobs Completed",
    },
    {
      value: "₹50Cr+",
      label: "Paid to Talent",
    },
    {
      value: "4.9/5",
      label: "Average Rating",
    },
  ];

  return (
    <div className="w-full">
      {/* How It Works Timeline Section */}
      <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-16">
            How It Works
          </h2>

          {/* Timeline Wrapper */}
          <div className="relative max-w-5xl mx-auto">
            {/* Desktop Horizontal Line */}
            <div className="absolute top-[22px] left-[5%] right-[5%] h-[2px] bg-slate-200/80 z-0 hidden lg:block" />

            {/* Mobile Vertical Line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-[2px] bg-slate-200/80 z-0 lg:hidden" />

            {/* Steps Container */}
            <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-4 relative z-10">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-4 lg:gap-5 lg:flex-1 group"
                >
                  {/* Step Number Circle */}
                  <div className="w-11 h-11 rounded-full bg-[#0a5a54] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-[#0a5a54]/10 shrink-0 transition-transform duration-300 group-hover:scale-110">
                    {step.number}
                  </div>

                  {/* Step Details */}
                  <div className="min-w-0 lg:pt-1">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark Green Stats Bar Section */}
      <section className="w-full bg-[#063c38] text-white py-14 px-4 sm:px-6 lg:px-8 border-t border-emerald-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-center text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-2.5">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#22c55e] tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase text-emerald-100/60 leading-none">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
