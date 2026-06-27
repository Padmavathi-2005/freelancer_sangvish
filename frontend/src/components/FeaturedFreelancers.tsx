"use client";

import React from "react";

export default function FeaturedFreelancers() {
  const freelancers = [
    {
      name: "Sarah J.",
      role: "Senior UI Designer",
      avatar: "/sarah-avatar.png",
      rating: "4.9",
      jobs: "124 jobs",
      skills: ["Figma", "UX Research"],
      rate: "$85/hr",
    },
    {
      name: "David M.",
      role: "AI Engineer",
      avatar: "/david-avatar.png",
      rating: "5.0",
      jobs: "89 jobs",
      skills: ["Python", "Machine Learning"],
      rate: "$120/hr",
    },
    {
      name: "Alex R.",
      role: "Full Stack Developer",
      avatar: null, // renders letter "A"
      rating: "4.8",
      jobs: "210 jobs",
      skills: ["React", "Node.js"],
      rate: "$95/hr",
    },
  ];

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              Featured Freelancers
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">
              Top-rated professionals ready to start immediately.
            </p>
          </div>
          <a 
            href="#" 
            className="inline-flex items-center gap-1 text-sm font-bold text-[#0a5a54] hover:text-[#073f3a] transition-all duration-200 group shrink-0"
          >
            See all 
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {freelancers.map((freelancer, index) => (
            <div 
              key={index} 
              className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:border-[#0a5a54]/30 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between"
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-5">
                  {freelancer.avatar ? (
                    <img
                      src={freelancer.avatar}
                      alt={freelancer.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#e6f0ef] flex items-center justify-center font-bold text-lg text-[#0a5a54] border border-[#0a5a54]/10 shrink-0">
                      A
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-base truncate">
                        {freelancer.name}
                      </span>
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                      {freelancer.role}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <span className="text-[#0a5a54] font-bold">★ {freelancer.rating}</span>
                      <span className="text-slate-400 font-medium">({freelancer.jobs})</span>
                    </div>
                  </div>
                </div>

                {/* Skills/Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {freelancer.skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Price & Hire CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Hourly Rate</span>
                  <span className="text-base font-extrabold text-slate-900">{freelancer.rate}</span>
                </div>
                <button 
                  onClick={() => alert(`Initiating hire request for ${freelancer.name}...`)}
                  className="bg-[#0a5a54] hover:bg-[#073f3a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] hover:shadow-lg hover:shadow-[#0a5a54]/10 cursor-pointer"
                >
                  Hire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
