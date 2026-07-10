"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiClock, FiTrash2, FiExternalLink, FiUser, FiBriefcase } from "react-icons/fi";
import { API_BASE_URL } from "@/config/api";

const resolveMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function WishlistPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"gigs" | "projects" | "freelancers">("gigs");
  const [gigsWishlist, setGigsWishlist] = useState<any[]>([]);
  const [projectsWishlist, setProjectsWishlist] = useState<any[]>([]);
  const [freelancersWishlist, setFreelancersWishlist] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const storedGigs = localStorage.getItem("lancerflow_wishlist");
    if (storedGigs) {
      try {
        setGigsWishlist(JSON.parse(storedGigs));
      } catch (e) {
        console.error("Failed to parse gigs wishlist:", e);
      }
    }
    const storedProjects = localStorage.getItem("lancerflow_wishlist_projects");
    if (storedProjects) {
      try {
        setProjectsWishlist(JSON.parse(storedProjects));
      } catch (e) {
        console.error("Failed to parse projects wishlist:", e);
      }
    }
    const storedFreelancers = localStorage.getItem("lancerflow_wishlist_freelancers");
    if (storedFreelancers) {
      try {
        setFreelancersWishlist(JSON.parse(storedFreelancers));
      } catch (e) {
        console.error("Failed to parse freelancers wishlist:", e);
      }
    }
  }, []);

  const handleRemoveGig = (gigId: number, title: string) => {
    const updated = gigsWishlist.filter((item) => item.gig_id !== gigId);
    setGigsWishlist(updated);
    localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
    showToast("success", `Removed "${title.substring(0, 20)}..." from Wishlist`);
  };

  const handleRemoveProject = (projectId: number, title: string) => {
    const updated = projectsWishlist.filter((item) => item.job_id !== projectId);
    setProjectsWishlist(updated);
    localStorage.setItem("lancerflow_wishlist_projects", JSON.stringify(updated));
    showToast("success", `Removed "${title.substring(0, 20)}..." from Wishlist`);
  };

  const handleRemoveFreelancer = (freelancerId: number, name: string) => {
    const updated = freelancersWishlist.filter((item) => item.user_id !== freelancerId);
    setFreelancersWishlist(updated);
    localStorage.setItem("lancerflow_wishlist_freelancers", JSON.stringify(updated));
    showToast("success", `Removed "${name}" from Wishlist`);
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border bg-white animate-slideIn">
          <FiHeart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase mb-1 block">Saved Items</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">My Wishlist</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
            Keep track of services, projects, and freelancers you want to hire, collaborate with, or bid on in the future.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={() => router.push("/dashboard/explore-gigs")}
            className="bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Explore Gigs
          </button>
        </div>
      </div>

      {/* Tab Switchers */}
      <div className="flex gap-6 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("gigs")}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent border-0 outline-none ${
            activeTab === "gigs" ? "border-teal-700 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Services ({gigsWishlist.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent border-0 outline-none ${
            activeTab === "projects" ? "border-teal-700 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Projects ({projectsWishlist.length})
        </button>
        <button
          onClick={() => setActiveTab("freelancers")}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent border-0 outline-none ${
            activeTab === "freelancers" ? "border-teal-700 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Freelancers ({freelancersWishlist.length})
        </button>
      </div>

      {/* GIGS TAB CONTENT */}
      {activeTab === "gigs" && (
        gigsWishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigsWishlist.map((gig) => {
              let imgUrl = "";
              try {
                if (Array.isArray(gig.images)) imgUrl = gig.images[0];
                else if (typeof gig.images === "string") {
                  const parsed = JSON.parse(gig.images);
                  if (Array.isArray(parsed)) imgUrl = parsed[0];
                }
              } catch (e) {}

              const reviewsCount = parseInt(gig.reviews_count || 0);
              const ratingScore = reviewsCount > 0 ? parseFloat(gig.reviews_avg_rating).toFixed(1) : "0.0";

              return (
                <div
                  key={gig.gig_id}
                  className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {imgUrl ? (
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100">
                        <img src={imgUrl} className="w-full h-full object-cover" alt={gig.title} />
                        <button
                          onClick={() => handleRemoveGig(gig.gig_id, gig.title)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-rose-500 border border-slate-100 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                          title="Remove from wishlist"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-full h-44 bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center text-slate-350 select-none text-xs font-extrabold uppercase">
                        💼 Service Showcase Image
                        <button
                          onClick={() => handleRemoveGig(gig.gig_id, gig.title)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-rose-500 border border-slate-100 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                          title="Remove from wishlist"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="p-4 pb-0 text-left">
                      <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase tracking-wider block self-start w-fit">
                        {gig.category_name || "Development"}
                      </span>
                      <h3
                        onClick={() => router.push(`/gigs/${gig.slug || gig.gig_id}`)}
                        className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 mt-2.5 hover:text-teal-750 transition-colors cursor-pointer leading-snug"
                      >
                        {gig.title}
                      </h3>

                      {gig.freelancer_name && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/freelancer/${gig.freelancer_slug || gig.freelancer_id}`);
                          }}
                          className="mt-2 flex items-center gap-2 group/author cursor-pointer w-fit select-none"
                        >
                          {gig.freelancer_image ? (
                            <img
                              src={resolveMediaUrl(gig.freelancer_image)}
                              alt={gig.freelancer_name}
                              className="w-5.5 h-5.5 rounded-full object-cover border border-slate-100/80"
                            />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-teal-700/10 flex items-center justify-center font-bold text-[8px] text-teal-700 border border-teal-500/10 shrink-0 select-none">
                              {gig.freelancer_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 font-bold hover:text-teal-750 group-hover/author:text-teal-700 transition-colors">
                            By {gig.freelancer_name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3.5 text-[9.5px] font-bold text-slate-400 mt-4 pt-2 uppercase tracking-wider">
                        <div className="flex items-center gap-0.5">
                          <FiStar className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-slate-700 font-black">{ratingScore}</span>
                          <span className="text-slate-400 font-semibold">({reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 shrink-0" />
                          <span>{gig.delivery_days || 3}d delivery</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Starting at</span>
                      <span className="text-sm font-black text-slate-900">${parseFloat(gig.price || 0).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/gigs/${gig.slug || gig.gig_id}`)}
                      className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <span>View Gig</span>
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-16 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100/80 flex items-center justify-center text-3xl mx-auto mb-4 select-none">
              💼
            </div>
            <h2 className="text-base font-black text-slate-900">No Saved Services</h2>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
              Browse through our wide variety of expert services and click the heart icon to save them here.
            </p>
            <button
              onClick={() => router.push("/dashboard/explore-gigs")}
              className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Start Exploring
            </button>
          </div>
        )
      )}

      {/* PROJECTS TAB CONTENT */}
      {activeTab === "projects" && (
        projectsWishlist.length > 0 ? (
          <div className="space-y-4">
            {projectsWishlist.map((job) => (
              <div
                key={job.job_id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pr-10">
                    <div className="flex gap-2">
                      <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {job.category_name || "Project"}
                      </span>
                      {job.experience_level && (
                        <span className="bg-slate-50 text-slate-605 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {job.experience_level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-teal-700 font-black text-sm">
                      <span>${parseFloat(job.budget || job.max_budget || 0).toLocaleString()}</span>
                      {job.project_type === "Hourly" && <span className="text-xs font-bold text-slate-500">/hr</span>}
                    </div>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2 mt-2">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2 line-clamp-3">
                    {job.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                    {job.project_type && <span>{job.project_type}</span>}
                    {job.duration && <span>{job.duration}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveProject(job.job_id, job.title)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0"
                      title="Remove from wishlist"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${job.slug || job.job_id}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-sm transition cursor-pointer border-none"
                    >
                      Submit Proposal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-16 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100/80 flex items-center justify-center text-3xl mx-auto mb-4 select-none">
              📂
            </div>
            <h2 className="text-base font-black text-slate-900">No Saved Projects</h2>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
              Browse through our open project briefs and click the heart icon to save them here.
            </p>
            <button
              onClick={() => router.push("/projects")}
              className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Find Projects
            </button>
          </div>
        )
      )}

      {/* FREELANCERS TAB CONTENT */}
      {activeTab === "freelancers" && (
        freelancersWishlist.length > 0 ? (
          <div className="space-y-4">
            {freelancersWishlist.map((f) => {
              const initials = f.name
                ? f.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "FL";

              return (
                <div
                  key={f.user_id}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-5 relative group"
                >
                  <div
                    className="w-14 h-14 rounded-xl text-white flex items-center justify-center text-lg font-black shrink-0 shadow-inner select-none relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary, #10b981) 0%, var(--color-secondary, #06b6d4) 100%)`
                    }}
                  >
                    <span>{initials}</span>
                    {f.profile_image && (
                      <img
                        src={`https://freelancer.sangvish.com${f.profile_image}`}
                        alt={f.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-850 group-hover:text-primary transition-colors leading-tight">
                        {f.name}
                      </h3>
                      {f.vetting_status === "Approved" && (
                        <span className="bg-teal-50 text-teal-705 border border-teal-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Vetted</span>
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-800 mt-1 leading-snug">
                      {f.professional_title || "Freelancer Partner"}
                    </p>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2 line-clamp-2">
                      {f.bio}
                    </p>
                  </div>
                  <div className="sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col justify-between items-start sm:items-end gap-4 self-stretch min-w-[160px]">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Hourly Rate</span>
                      <span className="text-slate-850 font-black text-base mt-0.5 block">${parseFloat(f.hourly_rate || 0).toFixed(0)}/hr</span>
                    </div>
                    <div className="flex items-center gap-2 w-full justify-end">
                      <button
                        onClick={() => handleRemoveFreelancer(f.user_id, f.name)}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/freelancer/${f.slug || f.user_id}`)}
                        className="text-white text-[11px] font-extrabold py-2.5 px-4 rounded-xl shadow-md transition-all duration-300 cursor-pointer text-center border-none hover:shadow-lg hover:brightness-110 active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, var(--color-primary, #10b981) 0%, var(--color-secondary, #06b6d4) 100%)`
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-16 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100/80 flex items-center justify-center text-3xl mx-auto mb-4 select-none">
              👤
            </div>
            <h2 className="text-base font-black text-slate-900">No Saved Freelancers</h2>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
              Find elite developers or designers and click the heart icon to save them here.
            </p>
            <button
              onClick={() => router.push("/talent")}
              className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Hire Freelancers
            </button>
          </div>
        )
      )}
    </div>
  );
}
