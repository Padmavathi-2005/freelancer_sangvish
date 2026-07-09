"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  FiMail,
  FiExternalLink,
  FiBriefcase,
  FiBookOpen,
  FiAward,
  FiMessageSquare,
  FiClock,
  FiStar,
  FiFileText,
  FiArrowLeft,
  FiLinkedin,
  FiGlobe,
  FiAlertTriangle,
  FiCheckCircle,
  FiSliders
} from "react-icons/fi";

export default function FreelancerPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useAuthModal();
  const id = params?.id as string;
  const hireParam = searchParams.get("hire");

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj && (userObj.user_id || userObj.id)) {
            setLoggedInUserId(Number(userObj.user_id || userObj.id));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);
  
  // Modal for hiring / messaging
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireMessage, setHireMessage] = useState("");
  const [hiringSubmitting, setHiringSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getDurationText = (startDateStr: string, endDateStr: string, currentlyWorking: boolean) => {
    if (!startDateStr) return "";
    const startDate = new Date(startDateStr);
    const endDate = currentlyWorking ? new Date() : new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
    
    // Add 1 month to represent inclusive time span (e.g. Feb 2021 to Feb 2021 is 1 month)
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    const parts = [];
    if (years > 0) {
      parts.push(`${years} yr${years > 1 ? "s" : ""}`);
    }
    if (months > 0) {
      parts.push(`${months} mo${months > 1 ? "s" : ""}`);
    }
    
    return parts.length > 0 ? `(${parts.join(" ")})` : "";
  };

  useEffect(() => {
    if (!id) return;

    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/freelancer/profile/${id}`, {
          headers
        });

        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
          setError("");
        } else if (res.status === 401) {
          setError("unauthorized");
        } else {
          setError("Freelancer profile not found.");
        }
      } catch (err) {
        console.error("Failed to load freelancer profile:", err);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  useEffect(() => {
    if (data && hireParam === "true") {
      setShowHireModal(true);
    }
  }, [data, hireParam]);

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireMessage.trim()) return;

    try {
      setHiringSubmitting(true);
      // Mock sending an invitation message/proposal to the freelancer
      setTimeout(() => {
        setHiringSubmitting(false);
        setShowHireModal(false);
        setHireMessage("");
        showToast("success", "Hiring invitation sent successfully! The freelancer will contact you.");
      }, 1000);
    } catch (err) {
      setHiringSubmitting(false);
      showToast("error", "Failed to submit hiring offer. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-wider uppercase">Loading Public Profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center">
          <FiAlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-800">Authentication Required</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            You must be logged in to view public freelancer profiles and invite them to projects.
          </p>
          <a
            href="/login"
            className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all transform active:scale-95"
          >
            Log In to Continue
          </a>
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
          <h1 className="text-7xl font-black text-slate-200 tracking-tight font-display select-none">404</h1>
          <h2 className="text-xl font-extrabold text-slate-850 mt-4">Profile Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">{error || "The developer profile you are seeking does not exist."}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 bg-teal-750 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const { user, profile, skills, languages, experiences, education, certifications, projects, reviews, gigs } = data;

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans w-full max-w-full relative overflow-hidden">
      <Header />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border bg-white animate-slideIn">
          {toast.type === "success" ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-850">{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="bg-slate-50 text-left border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Profile Cover & Header Area - Light Premium Styling */}
      <div className="relative w-full bg-gradient-to-br from-teal-50/70 via-slate-50/40 to-emerald-50/30 border-b border-slate-150 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden text-left">
        {/* Cover Abstract Art */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-40%] left-[-10%] w-[40rem] h-[40rem] bg-teal-500/5 rounded-full filter blur-[120px]"></div>
          <div className="absolute bottom-[-40%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full filter blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar */}
            {user.profile_image && !imageError ? (
              <img
                src={user.profile_image.startsWith("/") && !user.profile_image.startsWith("/public") ? `https://freelancer.sangvish.com${user.profile_image}` : user.profile_image}
                alt={user.name || "Freelancer"}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-xl"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-teal-700/10 text-teal-800 flex items-center justify-center font-black text-3xl sm:text-4xl border-4 border-white shadow-xl">
                {(user.name || user.email || "Freelancer").substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Profile Info */}
            <div className="text-slate-800">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{user.name || user.email || "Freelancer"}</h1>
                <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {profile?.availability_status === "Available" ? (
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Available
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Busy
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-teal-800 font-extrabold mt-1.5">
                {profile?.role || "Elite Freelancer Professional"}
              </p>
              
              {/* Quick Profile Stats */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-5 gap-y-1.5 mt-4 text-xxs sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FiStar className="w-4 h-4 text-amber-450 fill-amber-450" />
                  <span className="text-slate-800 font-black">5.0 Rating</span>
                  <span className="text-slate-400 font-bold">(15 jobs)</span>
                </div>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div>
                  <span className="text-slate-400">Hourly Rate: </span>
                  <span className="text-slate-800 font-black">{profile?.hourly_rate ? `$${parseFloat(profile.hourly_rate).toFixed(0)}/hr` : "N/A"}</span>
                </div>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div>
                  <span className="text-slate-400">Exp Level: </span>
                  <span className="text-slate-800 font-black">{profile?.experience_level || "Expert"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center">
            {loggedInUserId && (loggedInUserId === Number(user?.user_id) || loggedInUserId === Number(profile?.user_id)) ? (
              <button
                onClick={() => router.push("/dashboard?tab=settings")}
                className="flex-1 md:flex-none justify-center bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <FiSliders className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                    if (!token) {
                      openLoginModal(undefined, () => {
                        router.push(`/dashboard?tab=inbox&contactId=${id}`);
                      });
                    } else {
                      router.push(`/dashboard?tab=inbox&contactId=${id}`);
                    }
                  }}
                  className="flex-1 md:flex-none justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <FiMessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Send Message</span>
                </button>
                <button
                  onClick={() => {
                    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                    if (!token) {
                      openLoginModal(undefined, () => {
                        setShowHireModal(true);
                      });
                    } else {
                      setShowHireModal(true);
                    }
                  }}
                  className="flex-1 md:flex-none justify-center bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Hire Freelancer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content - No Card Containers (Box Boxes) */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-grow text-left">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* LEFT COLUMN: About, Timelines */}
          <div className="lg:col-span-2 flex flex-col gap-12 text-left">
            
            {/* Professional Summary */}
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 select-none">
                Professional Bio
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-line text-left">
                {profile?.bio || profile?.company_description || `Highly qualified and meticulous specialist in web application architectures and developer integration. Possessing extensive experience in resolving frontend performance layouts, developing secure backend API systems, and customizing comprehensive user interface designs. Committed to implementing code solutions aligned with user requirement specifications.`}
              </p>
            </div>

            {/* Experience timeline */}
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2 select-none">
                <FiBriefcase className="w-5 h-5 text-teal-700 shrink-0" />
                <span>Work Experience</span>
              </h2>

              {experiences && experiences.length > 0 ? (
                <div className="space-y-8 text-left">
                  {experiences.map((exp: any, idx: number) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-teal-650/20 hover:border-teal-700 transition-all duration-300 py-1.5 flex items-start gap-4 text-left group select-none">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        <FiBriefcase className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight group-hover:text-teal-900 transition-colors">{exp.job_title}</h3>
                          <span className="text-[10px] font-black text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-lg whitespace-nowrap self-start flex items-center gap-1.5">
                            <span>
                              {new Date(exp.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} – {exp.currently_working ? "Present" : new Date(exp.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-slate-400 font-bold ml-0.5">
                              {getDurationText(exp.start_date, exp.end_date, exp.currently_working)}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{exp.company_name} · {exp.employment_type || "Contract"}</p>
                        {exp.description && (
                          <p className="text-xs leading-relaxed text-slate-500 font-semibold mt-2.5 max-w-2xl">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-left py-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">No Work History Logged</p>
                </div>
              )}
            </div>

            {/* Education timeline */}
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2 select-none">
                <FiBookOpen className="w-5 h-5 text-teal-700 shrink-0" />
                <span>Education</span>
              </h2>

              {education && education.length > 0 ? (
                <div className="space-y-8 text-left">
                  {education.map((edu: any, idx: number) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-teal-650/20 hover:border-teal-700 transition-all duration-300 py-1.5 flex items-start gap-4 text-left group select-none">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        <FiBookOpen className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight group-hover:text-teal-900 transition-colors">{edu.degree} in {edu.field_of_study}</h3>
                          <span className="text-[10px] font-black text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-lg whitespace-nowrap self-start">
                            {edu.start_year} – {edu.end_year}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{edu.institution_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-left py-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">No Education Details Logged</p>
                </div>
              )}
            </div>

            {/* Certifications timeline */}
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2 select-none">
                <FiAward className="w-5 h-5 text-teal-700 shrink-0" />
                <span>Certifications</span>
              </h2>

              {certifications && certifications.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                  {certifications.map((cert: any, idx: number) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-teal-650/20 hover:border-teal-700 transition-all duration-300 py-1.5 flex items-start gap-4 text-left group select-none">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        <FiAward className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight group-hover:text-teal-900 transition-colors">{cert.certificate_name}</h3>
                        <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest mt-1.5">{cert.issuing_organization}</p>
                        {cert.issue_date && (
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Issued: {new Date(cert.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
                        )}
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black text-teal-700 hover:text-teal-800 cursor-pointer mt-2 group-hover:underline"
                          >
                            <span>Verify Credential</span>
                            <FiExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-left py-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">No Certifications Logged</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Metadata Sidebar (Single clean visual sidebar) */}
          <div className="bg-slate-50/40 border border-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col gap-8 text-left">
            
            {/* Contact details */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 select-none">
                Freelancer Metadata
              </h3>
              
              <div className="flex flex-col gap-3.5 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <FiMail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {profile?.linkedin_url && (
                  <div className="flex items-center gap-2.5">
                    <FiLinkedin className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline truncate">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {profile?.portfolio_website && (
                  <div className="flex items-center gap-2.5">
                    <FiGlobe className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={profile.portfolio_website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline truncate">
                      Portfolio Site
                    </a>
                  </div>
                )}
                {profile?.resume_url && (
                  <div className="flex items-center gap-2.5">
                    <FiFileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline truncate">
                      Download CV / Resume
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 select-none">
                Core Competencies
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills && skills.length > 0 ? (
                  skills.map((sk: any, idx: number) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 rounded-lg bg-teal-50/40 border border-teal-100/60 text-teal-800 text-xs font-semibold select-none"
                    >
                      {sk.skill_name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills listed</p>
                )}
              </div>
            </div>

            {/* Languages */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 select-none">
                Spoken Languages
              </h3>
              <div className="flex flex-col gap-2 text-xs font-bold text-slate-700">
                {languages && languages.length > 0 ? (
                  languages.map((l: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100/50 select-none">
                      <span className="text-slate-800 font-semibold">{l.language_name}</span>
                      <span className="text-[10px] font-black text-teal-850 bg-teal-50/50 border border-teal-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">{l.proficiency || "Fluent"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No languages listed</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* PORTFOLIO PROJECTS SHOWCASE */}
        {projects && projects.length > 0 && (
          <div className="mt-20 border-t border-slate-100 pt-12 text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight select-none">
              Portfolio Showcase
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium select-none">
              Explore works, designs, implementations, and archives completed by the professional.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {projects.map((proj: any, idx: number) => {
                let imgArr: string[] = [];
                try {
                  if (Array.isArray(proj.image_urls)) imgArr = proj.image_urls;
                  else if (typeof proj.image_urls === "string") imgArr = JSON.parse(proj.image_urls);
                } catch (e) {}

                let docsArr: string[] = [];
                try {
                  if (Array.isArray(proj.document_urls)) docsArr = proj.document_urls;
                  else if (typeof proj.document_urls === "string") docsArr = JSON.parse(proj.document_urls);
                } catch (e) {}

                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-300 flex flex-col justify-between text-left"
                  >
                    <div>
                      {imgArr.length > 0 ? (
                        <div className="relative w-full h-44 overflow-hidden bg-slate-100 border-b border-slate-200">
                          <img src={imgArr[0]} className="w-full h-full object-cover" alt={proj.title} />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center border-b border-slate-200 text-slate-400 select-none">
                          🎨 Project Showcase Preview
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="text-sm font-black text-slate-900 line-clamp-1">{proj.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2.5 line-clamp-4">{proj.description}</p>
                      </div>
                    </div>

                    {docsArr.length > 0 && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-55 flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Attached Scope Documents</span>
                        {docsArr.map((doc: string, dIdx: number) => {
                          const docName = doc.split("/").pop() || `Attachment_${dIdx + 1}`;
                          return (
                            <a
                              key={dIdx}
                              href={doc}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xxs font-bold text-teal-700 hover:underline truncate"
                            >
                              <FiFileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{docName}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE GIGS SERVICES */}
        {gigs && gigs.length > 0 && (
          <div className="mt-20 border-t border-slate-100 pt-12 text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight select-none">
              Active Gigs & Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium select-none">
              Pre-packaged services available to purchase directly from this freelancer.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {gigs.map((gig: any, idx: number) => {
                let gigImages: string[] = [];
                try {
                  if (Array.isArray(gig.images)) gigImages = gig.images;
                  else if (typeof gig.images === "string") gigImages = JSON.parse(gig.images);
                } catch (e) {}

                return (
                  <div 
                    key={idx} 
                    onClick={() => router.push(`/gigs/${gig.gig_id}`)}
                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-teal-500/35 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between text-left cursor-pointer group"
                  >
                    <div>
                      {gigImages.length > 0 ? (
                        <div className="relative w-full h-44 overflow-hidden bg-slate-100 border-b border-slate-200">
                          <img 
                            src={gigImages[0].startsWith("http") ? gigImages[0] : `https://freelancer.sangvish.com${gigImages[0]}`} 
                            className="w-full h-full object-cover" 
                            alt={gig.title} 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-200 text-slate-400 select-none">
                          💼 Pre-packaged Service Preview
                        </div>
                      )}
                      <div className="p-6">
                        <span className="text-[10px] font-black text-teal-800 bg-teal-50 border border-teal-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {gig.category_name || "Service"}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-3 line-clamp-2 leading-snug group-hover:text-teal-900 transition-colors">{gig.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2 line-clamp-3">{gig.description}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Starting At</span>
                      <span className="text-sm font-extrabold text-slate-900">${parseFloat(gig.price).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CLIENT REVIEWS & RATINGS */}
        {reviews && reviews.length > 0 && (
          <div className="mt-20 border-t border-slate-100 pt-12 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Client Reviews & Ratings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Verified feedback submitted by clients who hired this freelancer.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl shrink-0 self-start sm:self-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-700 text-lg font-black border border-teal-100">
                  ★ {(reviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / reviews.length).toFixed(1)}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Average Rating</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{reviews.length} total review{reviews.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {reviews.map((rev: any, idx: number) => (
                <div key={idx} className="relative pl-5 border-l-2 border-teal-650/20 hover:border-teal-700 transition-all duration-300 py-1 flex flex-col justify-between gap-3 select-none text-left group">
                  <div>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        {rev.reviewer_image ? (
                          <img
                            src={`https://freelancer.sangvish.com${rev.reviewer_image}`}
                            alt={rev.reviewer_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xxs text-slate-500 border border-slate-200 shrink-0">
                            {rev.reviewer_name ? rev.reviewer_name.substring(0, 2).toUpperCase() : "CL"}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{rev.reviewer_name || "Client"}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {rev.review_type === 'gig' ? 'Service Order' : 'Contract Project'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        ★ {Number(rev.rating).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 font-semibold mt-3 max-w-xl">
                      "{rev.comment || "Outstanding performance, highly recommended developer!"}"
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider self-start">
                    {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* Hire Modal Portal */}
      {showHireModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative flex flex-col">
            <button
              onClick={() => {
                setShowHireModal(false);
                setHireMessage("");
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Close
            </button>

            <div className="border-b border-slate-100 pb-4 pr-16 mb-5">
              <span className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-1">Invite Freelancer</span>
              <h2 className="text-base font-black text-slate-855">Send Project Hire Invitation</h2>
              <p className="text-slate-405 text-xs font-semibold mt-1">Inviting developer: {user.name}</p>
            </div>

            <form onSubmit={handleHireSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Project Details / Message *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Introduce your project and outline the specific details, duration, requirements, or proposed rate..."
                  value={hireMessage}
                  onChange={(e) => setHireMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHireModal(false);
                    setHireMessage("");
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hiringSubmitting}
                  className="bg-teal-750 hover:bg-teal-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {hiringSubmitting ? "Sending..." : "Submit Hire Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
