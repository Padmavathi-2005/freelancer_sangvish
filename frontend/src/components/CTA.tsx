"use client";

import React from "react";

export default function CTA() {
  return (
    <section className="w-full pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-tight mb-5 font-display">
          Ready to Hire the Right Freelancer?
        </h2>
        
        <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-10 font-sans">
          Join thousands of businesses who trust Freelancer to deliver exceptional results on time, every time.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 select-none">
          <button
            onClick={() => alert("Redirecting to client registration...")}
            className="w-full sm:w-auto bg-[#0a5a54] hover:bg-[#073f3a] text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#0a5a54]/15 active:scale-[0.98] cursor-pointer"
          >
            Get Started Now
          </button>
          
          <button
            onClick={() => alert("Opening sales inquiry form...")}
            className="w-full sm:w-auto bg-white/60 hover:bg-white border border-slate-200/80 text-slate-800 font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md"
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}
