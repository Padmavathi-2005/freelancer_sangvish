"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL, API_BASE_URL } from "@/config/api";
import { FiCheck, FiZap } from "react-icons/fi";

interface FreelancerItem {
  user_id: number;
  name: string;
  professional_title?: string;
  rating?: number | string;
  profile_image?: string | null;
  category_name?: string;
}

const FALLBACK_CARDS: FreelancerItem[] = [
  {
    user_id: 101,
    name: "David Miller",
    professional_title: "AI Engineer",
    rating: 5.0,
    profile_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  },
  {
    user_id: 102,
    name: "Sarah Jenkins",
    professional_title: "Senior UI Designer",
    rating: 4.9,
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    user_id: 103,
    name: "Alex Rivera",
    professional_title: "Full Stack Developer",
    rating: 4.8,
    profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  }
];

const resolveImgUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.replace(/^\/?public\//, "/");
  const baseBackend = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackend}${clean.startsWith("/") ? "" : "/"}${clean}`;
};

const getInitials = (name: string) => {
  if (!name) return "FL";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function GlobalTrustSection() {
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<FreelancerItem[]>(FALLBACK_CARDS);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await fetch(`${API_URL}/freelancers/public/list`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setFreelancers(data.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load freelancers for GlobalTrustSection:", err);
      }
    };
    fetchFreelancers();
  }, []);

  const displayCards = freelancers.length >= 3 ? freelancers.slice(0, 3) : FALLBACK_CARDS;
  const card1 = displayCards[2] || FALLBACK_CARDS[0]; // Back left
  const card2 = displayCards[1] || FALLBACK_CARDS[1]; // Middle
  const card3 = displayCards[0] || FALLBACK_CARDS[2]; // Active Front Right (PRO)

  const handleNavigateProfile = (f: FreelancerItem) => {
    if (f.user_id) {
      const slugName = f.name ? f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : f.user_id.toString();
      router.push(`/freelancer/${slugName}-${f.user_id}`);
    } else {
      router.push("/talent");
    }
  };

  const renderAvatar = (f: FreelancerItem, sizeClass: string) => {
    const resolved = resolveImgUrl(f.profile_image);
    if (resolved && !failedImages[f.user_id]) {
      return (
        <img
          src={resolved}
          alt={f.name}
          className={`${sizeClass} rounded-full object-cover border-2 border-slate-100 dark:border-zinc-800 shadow-sm shrink-0`}
          onError={() => setFailedImages((prev) => ({ ...prev, [f.user_id]: true }))}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-[#0a5a54] text-white font-black flex items-center justify-center border-2 border-slate-100 dark:border-zinc-800 shadow-sm shrink-0 text-sm select-none`}>
        {getInitials(f.name)}
      </div>
    );
  };

  return (
    <section className="w-full bg-slate-100 dark:bg-zinc-950 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-zinc-800/60 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Overlapping Real Freelancer Cards */}
        <div className="lg:col-span-6 relative flex items-center justify-center py-6 sm:py-10">
          <div className="relative w-full max-w-md h-[340px] flex items-center justify-center">
            
            {/* Card 1 (Back left) */}
            <div 
              onClick={() => handleNavigateProfile(card1)}
              className="absolute left-0 z-10 w-48 sm:w-52 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 shadow-lg scale-90 opacity-65 -translate-x-12 sm:-translate-x-16 transition-all duration-500 flex flex-col items-center text-center gap-2.5 cursor-pointer hover:opacity-100"
            >
              {renderAvatar(card1, "w-16 h-16")}
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-full">{card1.name}</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate max-w-full">
                {card1.professional_title || card1.category_name || "Freelancer"}
              </p>
              <div className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                ★ {typeof card1.rating === "number" ? card1.rating.toFixed(1) : card1.rating || "5.0"}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateProfile(card1);
                }}
                className="w-full mt-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 rounded-xl border-none cursor-pointer transition"
              >
                View Profile
              </button>
            </div>

            {/* Card 2 (Middle) */}
            <div 
              onClick={() => handleNavigateProfile(card2)}
              className="absolute left-1/4 z-20 w-52 sm:w-56 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xl scale-95 opacity-85 -translate-x-6 sm:-translate-x-8 transition-all duration-500 flex flex-col items-center text-center gap-2.5 cursor-pointer hover:opacity-100"
            >
              {renderAvatar(card2, "w-16 h-16")}
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-full">{card2.name}</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate max-w-full">
                {card2.professional_title || card2.category_name || "Freelancer"}
              </p>
              <div className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                ★ {typeof card2.rating === "number" ? card2.rating.toFixed(1) : card2.rating || "5.0"}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateProfile(card2);
                }}
                className="w-full mt-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 rounded-xl border-none cursor-pointer transition"
              >
                View Profile
              </button>
            </div>

            {/* Card 3 (Active Front Right - Top Featured PRO Freelancer) */}
            <div 
              onClick={() => handleNavigateProfile(card3)}
              className="absolute right-0 sm:right-4 z-30 w-56 sm:w-64 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-2xl scale-100 opacity-100 transition-all duration-500 flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-[1.02]"
            >
              
              {/* PRO Badge top right */}
              <div className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md font-black text-[10px] flex items-center gap-1 border border-amber-300/40">
                <FiZap className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>PRO</span>
              </div>

              {renderAvatar(card3, "w-20 h-20")}

              <div className="w-full text-center">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white truncate max-w-full">{card3.name}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5 truncate max-w-full">
                  {card3.professional_title || card3.category_name || "Freelancer"}
                </p>
              </div>

              <div className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
                ★ <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{typeof card3.rating === "number" ? card3.rating.toFixed(1) : card3.rating || "5.0"}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateProfile(card3);
                }}
                className="w-full mt-1 bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs sm:text-sm py-2.5 rounded-xl transition duration-200 shadow-md shadow-emerald-950/20 active:scale-95 border-none flex items-center justify-center cursor-pointer"
              >
                View Profile
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Heading + Subtitle + Checklist */}
        <div className="lg:col-span-6 flex flex-col text-left">
          
          {/* Eyebrow */}
          <span className="text-[#10b981] font-bold text-sm sm:text-base mb-2.5 tracking-wide">
            We’re expanding day by day
          </span>

          {/* Title */}
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.16] tracking-tight mb-5 font-display">
            Global Trust of 1 Million Businesses and Counting
          </h2>

          {/* Subtitle Description */}
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg font-normal leading-relaxed mb-8 max-w-xl">
            Connect with skilled professionals, streamline collaboration, and unlock success. Join now and redefine your work experience!.
          </p>

          {/* Checklist Items */}
          <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold">
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-[#10b981] shrink-0 stroke-[3]" />
              <span>Connect with pros collaborate better succeed faster</span>
            </div>
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-[#10b981] shrink-0 stroke-[3]" />
              <span>Redefine work Join now for a better experience</span>
            </div>
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-[#10b981] shrink-0 stroke-[3]" />
              <span>Streamline collaboration unlock success</span>
            </div>
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-[#10b981] shrink-0 stroke-[3]" />
              <span>Join us redefine your work experience</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
