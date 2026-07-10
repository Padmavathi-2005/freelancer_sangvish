import React, { useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiAlertTriangle, FiX } from "react-icons/fi";
import UpgradeOverlay from "./UpgradeOverlay";

interface FindWorkTabProps {
  userRole: string | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: any) => void;
  filteredFreelancers: any[];
  triggerToast: any;
  setActiveTab: (tab: any) => void;
  jobSearchQuery: string;
  setJobSearchQuery: (val: string) => void;
  gigCategories: any[];
  jobSelectedCategory: string;
  setJobSelectedCategory: (val: string) => void;
  loadingAllJobs: boolean;
  allJobs: any[];
  appliedJobIds: Set<number>;
  proposalLimitReached: boolean;
  proposalLimitMsg: string;
  setApplyingJob: (job: any) => void;
  setProposalBidAmount: (amount: number) => void;
  setProposalDeliveryDays: (days: number) => void;
  setProposalCoverLetter: (letter: string) => void;
  setProposalError: (err: string) => void;
  setShowProposalModal: (show: boolean) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
}

export default function FindWorkTab({
  userRole,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredFreelancers,
  triggerToast,
  setActiveTab,
  jobSearchQuery,
  setJobSearchQuery,
  gigCategories,
  jobSelectedCategory,
  setJobSelectedCategory,
  loadingAllJobs,
  allJobs,
  appliedJobIds,
  proposalLimitReached,
  proposalLimitMsg,
  setApplyingJob,
  setProposalBidAmount,
  setProposalDeliveryDays,
  setProposalCoverLetter,
  setProposalError,
  setShowProposalModal,
  setSelectedFreelancerProfile,
}: FindWorkTabProps) {
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const scrollCats = (dir: "left" | "right") => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catName = params.get("categoryName");
      const subCatName = params.get("subCategoryName");
      if (subCatName) {
        if (userRole === "client") {
          setSearchQuery(subCatName);
        } else {
          setJobSearchQuery(subCatName);
        }
      } else if (catName) {
        if (userRole === "client") {
          setSearchQuery(catName);
        } else {
          setJobSearchQuery(catName);
        }
      }
    }
  }, [userRole]);

  if (userRole === "client") {
    return (
      <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left text-slate-800">
        {/* Search and Header */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-left w-full sm:w-auto">
            <h2 className="text-lg font-bold text-slate-900">Explore Top Freelancers</h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Review credentials, skills, and client ratings to choose the best fit.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80 shrink-0">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search skills, names, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none no-scrollbar">
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
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === category.id
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "bg-white text-slate-500 border border-slate-200 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Freelancers Grid */}
        {filteredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />

                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-center">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${freelancer.avatarColor} flex items-center justify-center font-bold text-base text-white shadow-sm shrink-0`}>
                        {freelancer.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <h3 className="font-extrabold text-slate-800 text-sm truncate leading-none">{freelancer.name}</h3>
                          {freelancer.verified && (
                            <span className="text-cyan-600 shrink-0" title="Verified Professional">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.585a.75.75 0 011.026.237L10 8.442l2.707-4.62a.75.75 0 111.286.752L10.87 9.873a.75.75 0 01-1.127.185l-3.239-2.7a.75.75 0 01-.237-1.026z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xxs font-bold tracking-wide block mt-1 uppercase truncate text-left">{freelancer.role}</span>
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded-lg shrink-0">
                      ${freelancer.hourlyRate}/hr
                    </span>
                  </div>

                  <p className="text-slate-505 text-xs mt-4 leading-relaxed font-medium text-left line-clamp-3">
                    {freelancer.bio}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-4 justify-start">
                    {freelancer.skills.map((skill: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-slate-800">{freelancer.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-xxs font-semibold">({freelancer.completedJobs} jobs)</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFreelancerProfile({
                        user_id: freelancer.id,
                        name: freelancer.name,
                        role: freelancer.role,
                        email: "developer@lancerflow.net",
                        skills: freelancer.skills,
                        hourlyRate: freelancer.hourlyRate,
                        rating: freelancer.rating,
                        completedJobs: freelancer.completedJobs,
                        bio: freelancer.bio
                      });
                    }}
                    className="text-[10px] font-bold text-primary hover:text-primary-hover border border-primary/20 hover:bg-primary/5 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    View Profile
                    <span className="text-[8px] font-bold">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner">
            <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No matches found</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">Adjust your search term or filter parameters.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
      {/* Search and Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-left w-full sm:w-auto">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-primary"></i> Find Projects & Bids
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Browse active projects posted by clients and submit your proposals.</p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-slate-450"></i>
          </span>
          <input
            type="text"
            placeholder="Search jobs, categories, keywords..."
            value={jobSearchQuery}
            onChange={(e) => setJobSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-semibold"
          />
        </div>
      </div>

      {/* ─── Category Filter Strip ─── */}
      <div className="relative flex items-center gap-1">
        {/* Left fade + scroll button */}
        <button
          onClick={() => scrollCats("left")}
          className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary/40 shadow-sm transition-all cursor-pointer z-10"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll container with gradient fade on both sides */}
        <div className="relative flex-1 overflow-hidden">
          {/* Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          {/* Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10" />

          <div
            ref={catScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-none no-scrollbar px-3 py-1.5"
          >
            {[
              { id: "all", label: "All Categories" },
              ...gigCategories.map((c) => ({ id: c.category_name, label: c.category_name }))
            ].map((category) => {
              const isActive = jobSelectedCategory === category.id;
              // count matching jobs for this category
              const count = category.id === "all"
                ? allJobs.length
                : allJobs.filter((j) => j.category_name === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setJobSelectedCategory(category.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 group ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.04]"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <span>{category.label}</span>
                  {count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-black px-1 transition-all ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {/* Active underline indicator */}
                  {isActive && (
                    <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scrollCats("right")}
          className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary/40 shadow-sm transition-all cursor-pointer z-10"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Job Cards */}
      {loadingAllJobs ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Loading available projects...</p>
        </div>
      ) : allJobs.filter((job) => {
        const matchesSearch =
          job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
          (job.category_name && job.category_name.toLowerCase().includes(jobSearchQuery.toLowerCase())) ||
          (job.sub_category_name && job.sub_category_name.toLowerCase().includes(jobSearchQuery.toLowerCase()));
        const matchesCategory =
          jobSelectedCategory === "all" || job.category_name === jobSelectedCategory;
        return matchesSearch && matchesCategory;
      }).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No matching projects found</h3>
          <p className="text-slate-400 text-xs max-w-sm font-semibold">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {allJobs
            .filter((job) => {
              const matchesSearch =
                job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                job.description.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                (job.category_name && job.category_name.toLowerCase().includes(jobSearchQuery.toLowerCase())) ||
                (job.sub_category_name && job.sub_category_name.toLowerCase().includes(jobSearchQuery.toLowerCase()));
              const matchesCategory =
                jobSelectedCategory === "all" || job.category_name === jobSelectedCategory;
              return matchesSearch && matchesCategory;
            })
            .map((job) => {
              const isApplied = appliedJobIds.has(job.job_id);
              const handleCardClick = () => {
                if (!isApplied) {
                  if (proposalLimitReached) {
                    setShowLimitModal(true);
                  } else {
                    setApplyingJob(job);
                    setProposalBidAmount(parseFloat(job.budget || 0));
                    setProposalDeliveryDays(7);
                    setProposalCoverLetter("");
                    setProposalError("");
                    setShowProposalModal(true);
                  }
                }
              };
              return (
                <div
                  key={job.job_id}
                  onClick={handleCardClick}
                  className={`bg-white border rounded-xl p-6 shadow-sm transition-all duration-300 flex flex-col gap-4 relative overflow-hidden ${
                    isApplied
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-slate-200/80 hover:shadow-md cursor-pointer hover:border-teal-600/40"
                  }`}
                >
                  {/* Top accent bar — green if applied, brand gradient otherwise */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    isApplied ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-cyan-500 opacity-80"
                  }`} />

                <div className="flex justify-between items-start gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-850">{job.title}</h3>
                      {isApplied && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <i className="fa-solid fa-circle-check"></i> Proposal Submitted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 text-[10px] font-bold">
                        Posted by <strong>{job.company_name || job.client_name}</strong>
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-slate-400 text-[10px] font-bold">
                        {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-150 px-2 py-0.5 rounded uppercase tracking-wider">
                      {job.category_name || "Project"}
                    </span>
                    {job.project_type && (
                      <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded uppercase tracking-wider">
                        {job.project_type}
                      </span>
                    )}
                    {job.location && (
                      <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-150 px-2 py-0.5 rounded uppercase tracking-wider">
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">{job.description}</p>
                {(job.skills || job.languages) && (
                  <div className="flex flex-col gap-2 pt-2 mt-1">
                    {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center justify-start">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Skills:</span>
                        {job.skills.map((skill: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold"
                          >
                            {skill.skill_name || skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.languages && Array.isArray(job.languages) && job.languages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center justify-start">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Languages:</span>
                        {job.languages.map((lang: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold"
                          >
                            {lang.language_name || lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 mt-2 gap-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-500 text-xxs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-wallet text-slate-400"></i>
                      <span>Budget: <strong className="text-slate-700">
                        {job.min_budget && job.max_budget 
                          ? `$${parseFloat(job.min_budget).toLocaleString()} - $${parseFloat(job.max_budget).toLocaleString()}`
                          : `$${parseFloat(job.budget).toLocaleString()}`}
                        {job.project_type === "Hourly" ? " / hr" : ""}
                      </strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                      <span>Experience Required: <strong className="text-slate-700">{job.experience_level}</strong></span>
                    </div>
                    {job.sub_category_name && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-tags text-slate-400"></i>
                        <span>Subcategory: <strong className="text-slate-700">{job.sub_category_name}</strong></span>
                      </div>
                    )}
                    {job.duration && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-calendar text-slate-400"></i>
                        <span>Duration: <strong className="text-slate-700">{job.duration}</strong></span>
                      </div>
                    )}
                    {job.num_freelancers && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-users text-slate-400"></i>
                        <span>Freelancers: <strong className="text-slate-700">{job.num_freelancers}</strong></span>
                      </div>
                    )}
                    {job.project_type === "Hourly" && job.max_hours && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-clock text-slate-400"></i>
                        <span>Hours Limit: <strong className="text-slate-700">{job.max_hours} hrs/week</strong></span>
                      </div>
                    )}
                    {job.project_type === "Hourly" && job.payment_mode && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-money-check text-slate-400"></i>
                        <span>Payout: <strong className="text-slate-700">{job.payment_mode}</strong></span>
                      </div>
                    )}
                  </div>
                  {isApplied ? (
                    <button
                      disabled
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-4 rounded-xl cursor-not-allowed flex items-center gap-1.5 select-none"
                    >
                      <i className="fa-solid fa-circle-check text-emerald-600"></i> Proposal Submitted
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (proposalLimitReached) {
                          setShowLimitModal(true);
                        } else {
                          setApplyingJob(job);
                          setProposalBidAmount(parseFloat(job.budget));
                          setProposalDeliveryDays(7);
                          setProposalCoverLetter("");
                          setProposalError("");
                          setShowProposalModal(true);
                        }
                      }}
                      className="text-[10px] font-bold text-white bg-primary hover:bg-primary-hover py-2 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-paper-plane"></i> Submit Proposal
                    </button>
                  )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
      {/* Limit Exceeded Upgrade Popup Overlay */}
      <UpgradeOverlay 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        message={proposalLimitMsg} 
      />
    </div>
  );
}
