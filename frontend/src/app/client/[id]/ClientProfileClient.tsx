"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiBriefcase, 
  FiGlobe, 
  FiUsers, 
  FiMapPin, 
  FiCalendar, 
  FiAward, 
  FiStar, 
  FiChevronLeft, 
  FiMessageSquare,
  FiArrowRight,
  FiAlertCircle
} from "react-icons/fi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";

export default function ClientProfileClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "reviews">("jobs");

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/freelancer/client-profile/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Client profile not found.");
          }
          throw new Error("Failed to load client details.");
        }
        const json = await res.ok ? await res.json() : null;
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs font-black tracking-wider uppercase animate-pulse">Loading Client Profile...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 text-2xl">
            <FiAlertCircle />
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">Profile Unavailable</h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-sm leading-relaxed">
            {error || "We could not find the client profile you requested."}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer border-0"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const { user, profile, reviews, jobs, stats } = data;
  const ratingAvg = parseFloat(stats.average_rating || 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative overflow-hidden">
      <Header />
      <div className="flex-1 pb-16 bg-slate-50/50">
        {/* Top Banner section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-slate-50/65 to-secondary/10 border-b border-slate-200/80 py-16 px-6 overflow-hidden text-slate-800">
          {/* Subtle decorative background shapes */}
          <div className="absolute top-[-30%] left-[-10%] w-[35rem] h-[35rem] bg-primary/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-30%] right-[-10%] w-[35rem] h-[35rem] bg-secondary/5 rounded-full filter blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 relative z-10">
            <div className="flex items-center">
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/projects");
                  }
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xxs font-black tracking-wider uppercase px-3.5 py-2.5 rounded-xl transition cursor-pointer border border-slate-200/60 shadow-sm"
              >
                <FiChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mt-2">
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-slate-200/50 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{(user.name || "C").substring(0, 1)}</span>
                  )}
                  {profile?.vetting_status === "Approved" && (
                    <span className="absolute bottom-0 right-0 bg-primary text-white rounded-tl-lg p-1 text-[8px]" title="Vetted Client Partner">
                      <FiAward className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{profile?.company_name || "Independent Client Partner"}</h1>
                  <p className="text-slate-500 font-bold text-xs mt-1.5 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                    <span>Hired by <strong className="text-slate-700 font-bold">{user.name}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-650">{profile?.industry || "Enterprise Management"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 flex items-center gap-1"><FiMapPin className="w-3 h-3 text-slate-400" /> Remote / Global</span>
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3.5 flex-wrap text-slate-600 font-bold text-xs">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < Math.round(ratingAvg) ? "fill-amber-450" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-slate-800 font-black">{ratingAvg > 0 ? ratingAvg : "No"} Rating</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-semibold">{reviews.length} Freelancer Review{reviews.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Cards */}
              <div className="flex gap-4 flex-wrap justify-center shrink-0">
                <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 text-center min-w-[100px] shadow-sm">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Active Jobs</span>
                  <span className="text-lg font-black text-primary mt-1 block">{stats.open_jobs} Open</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 text-center min-w-[100px] shadow-sm">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Rating Avg</span>
                  <span className="text-lg font-black text-amber-500 mt-1 block">{ratingAvg > 0 ? `${ratingAvg}/5.0` : "—"}</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 text-center min-w-[100px] shadow-sm">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Joined On</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">
                    {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main content split layout */}
      <div className="max-w-6xl mx-auto px-6 mt-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: About & Company Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm text-left">
            <h3 className="text-xs font-black text-slate-805 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4">
              Company Vitals
            </h3>
            
            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-650">
              {profile?.company_size && (
                <div className="flex items-center gap-3">
                  <FiUsers className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-0.5">Company Size</span>
                    <span className="text-slate-800 font-bold">{profile.company_size} Employees</span>
                  </div>
                </div>
              )}

              {profile?.company_established_year && (
                <div className="flex items-center gap-3">
                  <FiCalendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-0.5">Established</span>
                    <span className="text-slate-800 font-bold">{profile.company_established_year}</span>
                  </div>
                </div>
              )}

              {profile?.industry && (
                <div className="flex items-center gap-3">
                  <FiBriefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-0.5">Industry Segment</span>
                    <span className="text-slate-800 font-bold">{profile.industry}</span>
                  </div>
                </div>
              )}

              {profile?.company_website && (
                <div className="flex items-center gap-3">
                  <FiGlobe className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-0.5">Website</span>
                    <a 
                      href={profile.company_website.startsWith("http") ? profile.company_website : `https://${profile.company_website}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline hover:text-primary-hover font-bold truncate max-w-[200px] block"
                    >
                      {profile.company_website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              )}

              {profile?.hiring_contact_name && (
                <div className="flex items-center gap-3 border-t border-slate-100 pt-3.5 mt-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                    {profile.hiring_contact_name.substring(0, 1)}
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-0.5">Primary Contact</span>
                    <span className="text-slate-800 font-bold block">{profile.hiring_contact_name}</span>
                    {profile.hiring_contact_designation && (
                      <span className="text-[10px] text-slate-400 font-medium">{profile.hiring_contact_designation}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm text-left">
            <h3 className="text-xs font-black text-slate-805 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4">
              About Client
            </h3>
            <p className="text-slate-650 text-xs font-medium leading-relaxed">
              {profile?.company_description || "This client has not provided a detailed company bio profile description yet."}
            </p>
          </div>
        </div>

        {/* Right Side: Tabbed Posted Projects & Freelancer Reviews */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Tab Selector */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-sm flex gap-1">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer border-0 flex items-center justify-center gap-2 ${
                activeTab === "jobs"
                  ? "bg-primary text-white font-bold"
                  : "text-slate-500 hover:text-slate-805 hover:bg-slate-50"
              }`}
            >
              <FiBriefcase className="w-3.5 h-3.5" />
              <span>Active Job Openings ({jobs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer border-0 flex items-center justify-center gap-2 ${
                activeTab === "reviews"
                  ? "bg-primary text-white font-bold"
                  : "text-slate-500 hover:text-slate-805 hover:bg-slate-50"
              }`}
            >
              <FiStar className="w-3.5 h-3.5" />
              <span>Freelancer Reviews ({reviews.length})</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === "jobs" ? (
            <div className="flex flex-col gap-4">
              {jobs.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-xl py-12 px-6 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-3">
                  <FiBriefcase className="text-3xl text-slate-300" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">No Active Job Openings</h4>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">This client doesn't have any open projects hiring right now.</p>
                  </div>
                </div>
              ) : (
                jobs.map((job: any) => (
                  <div key={job.job_id} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-300 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-80" />
                    
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-850 hover:text-primary transition">{job.title}</h4>
                        <span className="text-[9px] font-black uppercase bg-primary-light border border-primary/20 text-primary px-2 py-0.5 rounded">
                          {job.project_type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-450 pt-2 flex-wrap">
                        <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Budget: <strong className="text-slate-700 font-bold">${parseFloat(job.budget || job.min_budget || 0).toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Proposals: <strong className="text-slate-700 font-bold">{job.proposal_count}</strong></span>
                      </div>
                    </div>

                    <Link 
                      href={`/projects/${job.job_id}`}
                      className="w-full md:w-auto shrink-0 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-[10px] rounded-xl shadow-sm text-center no-underline flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <span>Apply Now</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-xl py-12 px-6 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-3">
                  <FiStar className="text-3xl text-slate-300" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">No Reviews Yet</h4>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Freelancers have not left reviews on this client profile yet.</p>
                  </div>
                </div>
              ) : (
                reviews.map((rev: any) => {
                  const rating = parseFloat(rev.rating || 0);
                  return (
                    <div key={rev.review_id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-left flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {rev.reviewer_image ? (
                              <img
                                src={rev.reviewer_image.startsWith("http") ? rev.reviewer_image : `${API_URL.replace("/api", "")}${rev.reviewer_image.startsWith("/") ? "" : "/"}${rev.reviewer_image}`}
                                alt={rev.reviewer_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xxs font-black text-slate-505">{(rev.reviewer_name || "F").substring(0, 1)}</span>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{rev.reviewer_name}</h5>
                            <p className="text-[10px] text-teal-600 font-bold mt-0.5">
                              Freelancer Review • on contract: <span className="font-bold text-slate-600">{rev.project_title || "Project Assignment"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <FiStar 
                                key={i} 
                                className={`w-3 h-3 ${i < Math.round(rating) ? "fill-amber-450" : "text-slate-200"}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(rev.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50/50 rounded-xl border border-slate-100/80 p-3.5 whitespace-pre-wrap italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
