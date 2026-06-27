"use client";

import React, { useState, useMemo } from "react";

// Mock Freelancer Data
interface Freelancer {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  skills: string[];
  bio: string;
  verified: boolean;
  category: "development" | "design" | "marketing" | "ai";
}

const freelancersData: Freelancer[] = [
  {
    id: "1",
    name: "Alex Rivera",
    avatarColor: "from-violet-500 to-indigo-500",
    role: "Senior Full-Stack Developer",
    rating: 4.9,
    completedJobs: 142,
    hourlyRate: 95,
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
    bio: "Ex-Stripe engineer specializing in high-performance web applications and financial integrations.",
    verified: true,
    category: "development",
  },
  {
    id: "2",
    name: "Sophia Chen",
    avatarColor: "from-cyan-500 to-blue-500",
    role: "Product & UI/UX Designer",
    rating: 5.0,
    completedJobs: 89,
    hourlyRate: 85,
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    bio: "Creating beautiful, conversion-focused digital products for series A startups and enterprises.",
    verified: true,
    category: "design",
  },
  {
    id: "3",
    name: "Marcus Vance",
    avatarColor: "from-emerald-500 to-teal-500",
    role: "Growth & Acquisition Marketer",
    rating: 4.8,
    completedJobs: 115,
    hourlyRate: 75,
    skills: ["SEO", "Google Ads", "Conversion Rate Optimization", "Copywriting"],
    bio: "Helping SaaS companies scale from $10k to $100k MRR through data-driven performance marketing.",
    verified: false,
    category: "marketing",
  },
  {
    id: "4",
    name: "Elena Rostova",
    avatarColor: "from-rose-500 to-pink-500",
    role: "AI Integration & ML Engineer",
    rating: 4.9,
    completedJobs: 54,
    hourlyRate: 120,
    skills: ["Python", "PyTorch", "LLM Fine-tuning", "FastAPI", "OpenAI API"],
    bio: "Building smart conversational agents and recommendation engines integrated directly into production apps.",
    verified: true,
    category: "ai",
  },
  {
    id: "5",
    name: "Liam O'Connor",
    avatarColor: "from-amber-500 to-orange-500",
    role: "Next.js Core Developer",
    rating: 4.7,
    completedJobs: 73,
    hourlyRate: 90,
    skills: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    bio: "Specialist in server components, performance optimization, and custom Next.js deployment solutions.",
    verified: true,
    category: "development",
  },
  {
    id: "6",
    name: "Amina Al-Jamil",
    avatarColor: "from-purple-500 to-fuchsia-500",
    role: "Brand Identity Designer",
    rating: 5.0,
    completedJobs: 104,
    hourlyRate: 80,
    skills: ["Illustrator", "Brand Strategy", "Typography", "Packaging Design"],
    bio: "Developing memorable visual identities and design languages for modern eco-friendly brands.",
    verified: true,
    category: "design",
  },
];

interface MarketplaceProps {
  onToggleView: (view: "marketplace" | "dashboard") => void;
}

export default function Marketplace({ onToggleView }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "development" | "design" | "marketing" | "ai">("all");
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobBudget, setJobBudget] = useState(2500);
  const [jobDescription, setJobDescription] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter freelancers based on search query and category
  const filteredFreelancers = useMemo(() => {
    return freelancersData.filter((freelancer) => {
      const matchesCategory = selectedCategory === "all" || freelancer.category === selectedCategory;
      const matchesSearch =
        freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handlePostJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription) return;

    // Simulate success toast
    setToastMessage(`🎉 Project "${jobTitle}" posted successfully with a budget of $${jobBudget}!`);
    setShowPostJobModal(false);
    setJobTitle("");
    setJobDescription("");
    setJobBudget(2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const lightMeshStyle = {
    backgroundImage: `
      radial-gradient(at 10% 20%, rgba(15, 118, 110, 0.04) 0px, transparent 55%),
      radial-gradient(at 90% 10%, rgba(6, 182, 212, 0.04) 0px, transparent 55%),
      radial-gradient(at 50% 80%, rgba(244, 63, 94, 0.02) 0px, transparent 55%)
    `,
    backgroundColor: "#f8fafc"
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 md:px-8 flex flex-col gap-12 text-slate-800 font-sans" style={lightMeshStyle}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-slate-250 border-l-4 border-l-primary text-slate-800 py-4 px-6 rounded-xl shadow-2xl animate-fadeIn flex items-center gap-3">
          <svg className="w-6 h-6 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full flex flex-col items-center justify-center text-center py-16 px-4 md:py-24 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-md">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-cyan-500/5 to-transparent pointer-events-none" />
        
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-6 select-none">
          <span className="w-2 h-2 rounded-full bg-primary" />
          LANCERFLOW MARKETPLACE
        </span>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 max-w-4xl leading-tight text-slate-900">
          Find Elite Freelance Talent, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-600">Elevate Your Next Project</span>
        </h1>

        <p className="text-slate-505 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-medium">
          Instantly connect with verified professionals in Design, Development, Marketing, and AI. Track projects seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md px-4">
          <button
            onClick={() => setShowPostJobModal(true)}
            className="px-8 py-3.5 rounded-xl bg-primary text-white font-extrabold shadow-lg shadow-primary/20 hover:brightness-105 transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            Post a Project
          </button>
          <button
            onClick={() => onToggleView("dashboard")}
            className="px-8 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-255 font-extrabold transition-all duration-200 cursor-pointer shadow-sm"
          >
            Enter Workspace
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-slate-150 w-full px-6 select-none">
          {[
            { value: "99.8%", label: "Job Success Rate" },
            { value: "$140M+", label: "Client Transactions" },
            { value: "50,000+", label: "Verified Experts" },
            { value: "48 hours", label: "Average Match Time" },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-black text-slate-800">{stat.value}</span>
              <span className="text-xs md:text-sm text-slate-400 font-bold mt-1 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Talent Browser Section */}
      <section className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-200 pb-6">
          <div className="text-left w-full md:w-auto">
            <h2 className="text-2xl font-bold text-slate-900">Explore Top Freelancers</h2>
            <p className="text-slate-400 text-sm font-semibold mt-1">Review credentials, skills, and client ratings to choose the best fit.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search skills, names, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-250 rounded-xl py-3 pl-10 pr-4 text-slate-855 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none no-scrollbar select-none">
          {[
            { id: "all", label: "All Talents" },
            { id: "development", label: "Development" },
            { id: "design", label: "Design & UX" },
            { id: "marketing", label: "Marketing" },
            { id: "ai", label: "AI & ML Experts" },
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === category.id
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "bg-white text-slate-505 hover:text-slate-850 border border-slate-205 hover:bg-slate-50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Grid of Freelancer Cards */}
        {filteredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500" />
                
                <div>
                  {/* Top card row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${freelancer.avatarColor} flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0`}>
                        {freelancer.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-800 text-base leading-none truncate">{freelancer.name}</h3>
                          {freelancer.verified && (
                            <span className="text-cyan-600 shrink-0" title="Verified Professional">
                              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.585a.75.75 0 011.026.237L10 8.442l2.707-4.62a.75.75 0 111.286.752L10.87 9.873a.75.75 0 01-1.127.185l-3.239-2.7a.75.75 0 01-.237-1.026z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider block mt-1 truncate">{freelancer.role}</span>
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-lg shrink-0">
                      ${freelancer.hourlyRate}/hr
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-slate-500 text-sm mt-5 leading-relaxed text-left font-medium line-clamp-3">
                    {freelancer.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mt-5 justify-start">
                    {freelancer.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer of card */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-150 mt-auto">
                  <div className="flex items-center gap-1 select-none">
                    <span className="text-amber-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    <span className="text-sm font-black text-slate-800">{freelancer.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-xxs font-semibold">({freelancer.completedJobs} jobs)</span>
                  </div>

                  <button
                    onClick={() => onToggleView("dashboard")}
                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 group py-1.5 px-3 rounded-xl border border-primary/20 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Hire Candidate
                    <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-300 rounded-2xl p-8 shadow-inner">
            <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">No matches found</h3>
            <p className="text-slate-400 text-xs font-semibold max-w-sm">We couldn't find any freelancer matching "{searchQuery}" in this category.</p>
          </div>
        )}
      </section>

      {/* Post Project Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl text-slate-800 text-left animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-150">
              <h3 className="text-lg font-extrabold text-slate-900">Post an Active Project</h3>
              <button
                onClick={() => setShowPostJobModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePostJobSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js SaaS Platform Development"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Budget</label>
                  <span className="text-xs font-black text-cyan-600">${jobBudget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={jobBudget}
                  onChange={(e) => setJobBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                  <span>$500</span>
                  <span>$5,000</span>
                  <span>$10,000</span>
                  <span>$15,000+</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Outline requirements, skills needed, and milestone deliverables..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md transition-all font-extrabold text-xs cursor-pointer active:scale-95"
                >
                  Post to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
