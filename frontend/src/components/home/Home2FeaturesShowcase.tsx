"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiShield, 
  FiCpu, 
  FiZap, 
  FiCreditCard, 
  FiLock, 
  FiMessageSquare, 
  FiCheckCircle, 
  FiGlobe, 
  FiUserCheck, 
  FiTrendingUp, 
  FiAward, 
  FiClock,
  FiArrowUpRight
} from "react-icons/fi";

export interface FeatureItem {
  id?: number | string;
  tag: string;
  title: string;
  desc: string;
  iconName?: string;
  image?: string;
  badge?: string;
}

export default function Home2FeaturesShowcase() {
  const { t } = useLanguage();
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureItem[]>([]);

  // Default pool of 12 high-value platform features
  const defaultFeaturePool: FeatureItem[] = [
    {
      id: 1,
      tag: "AI MATCHMAKING",
      title: "AI-Powered Talent Matching",
      desc: "Our neural matching algorithm pairs your project specs with top 1% verified freelancers instantly.",
      iconName: "cpu",
      badge: "Smart AI",
      image: "/home2_banner.png"
    },
    {
      id: 2,
      tag: "ESCROW SECURITY",
      title: "Milestone-Based Escrow Vault",
      desc: "Funds remain safely locked in escrow and are only released when you approve completed project milestones.",
      iconName: "shield",
      badge: "100% Safe",
      image: "/tablet-work.png"
    },
    {
      id: 3,
      tag: "INSTANT PAYOUTS",
      title: "Multi-Currency Global Payouts",
      desc: "Withdraw earnings seamlessly in your preferred currency via PayPal, Payoneer, or direct Bank Transfer.",
      iconName: "credit_card",
      badge: "Instant",
      image: "/home2_banner.png"
    },
    {
      id: 4,
      tag: "VERIFIED FREELANCERS",
      title: "Vetted Identity & Skill Badges",
      desc: "Every freelancer profile undergoes identity verification and skill test assessment for maximum trust.",
      iconName: "user_check",
      badge: "Verified",
      image: "/tablet-work.png"
    },
    {
      id: 5,
      tag: "REAL-TIME COLLABORATION",
      title: "Live Chat & File Workspace",
      desc: "Communicate directly with freelancers, share large project files, and track progress live in real time.",
      iconName: "message",
      badge: "Live Chat",
      image: "/home2_banner.png"
    },
    {
      id: 6,
      tag: "FAIR DISPUTE GUARANTEE",
      title: "24/7 Dispute Resolution Support",
      desc: "Dedicated arbitration specialists ensure fair outcomes and complete buyer-seller protection on every contract.",
      iconName: "lock",
      badge: "Protected",
      image: "/tablet-work.png"
    },
    {
      id: 7,
      tag: "AUTOMATED CONTRACTS",
      title: "Smart NDAs & Legal Terms",
      desc: "Auto-generate binding non-disclosure agreements and intellectual property transfer contracts in seconds.",
      iconName: "award",
      badge: "Legal",
      image: "/home2_banner.png"
    },
    {
      id: 8,
      tag: "TRANSPARENT REVIEWS",
      title: "Verified Client Rating System",
      desc: "Authentic double-blind reviews ensure only genuine client feedback impacts freelancer reputations.",
      iconName: "trending",
      badge: "Transparent"
    },
    {
      id: 9,
      tag: "ZERO HIDDEN FEES",
      title: "Upfront Budget Guarantee",
      desc: "Clear competitive commission structures with no surprise costs or hidden platform surcharges.",
      iconName: "zap",
      badge: "Fair Price"
    },
    {
      id: 10,
      tag: "SPEED & AVAILABILITY",
      title: "Sub-24 Hour Hiring Velocity",
      desc: "Post your project requirement and receive qualified proposals from ready-to-work freelancers within hours.",
      iconName: "clock",
      badge: "Fast Hire"
    },
    {
      id: 11,
      tag: "GLOBAL WORKFORCE",
      title: "Cross-Border Talent Network",
      desc: "Access specialized developers, designers, and marketers across 120+ countries effortlessly.",
      iconName: "globe",
      badge: "Worldwide"
    },
    {
      id: 12,
      tag: "QUALITY GUARANTEE",
      title: "Satisfied Work Guarantee",
      desc: "If delivered work does not meet milestone specifications, request revisions or a hassle-free refund.",
      iconName: "check",
      badge: "Guaranteed"
    }
  ];

  // Helper to map icon names
  const getIcon = (name?: string) => {
    switch (name) {
      case "cpu": return <FiCpu className="w-5 h-5" />;
      case "shield": return <FiShield className="w-5 h-5" />;
      case "credit_card": return <FiCreditCard className="w-5 h-5" />;
      case "user_check": return <FiUserCheck className="w-5 h-5" />;
      case "message": return <FiMessageSquare className="w-5 h-5" />;
      case "lock": return <FiLock className="w-5 h-5" />;
      case "award": return <FiAward className="w-5 h-5" />;
      case "trending": return <FiTrendingUp className="w-5 h-5" />;
      case "clock": return <FiClock className="w-5 h-5" />;
      case "globe": return <FiGlobe className="w-5 h-5" />;
      case "check": return <FiCheckCircle className="w-5 h-5" />;
      case "zap": default: return <FiZap className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    const fetchAdminFeatures = async () => {
      let pool = defaultFeaturePool;
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const settingItem = data.find((s: any) => s.setting_key === "home2_features_list");
          if (settingItem && settingItem.setting_value) {
            let val = settingItem.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch (e) {}
            }
            if (Array.isArray(val) && val.length > 0) {
              pool = val;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin features list:", err);
      }

      // Pick 7 or 8 random features from pool on each page load
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const countToPick = pool.length >= 7 ? 7 : pool.length;
      setSelectedFeatures(shuffled.slice(0, countToPick));
    };

    fetchAdminFeatures();
  }, []);

  const items = selectedFeatures.length > 0 ? selectedFeatures : defaultFeaturePool.slice(0, 7);

  // Distribute 7 items across 3 columns matching reference screenshot (2, 2, 3)
  const col1 = [items[0], items[3]].filter(Boolean);
  const col2 = [items[1], items[4]].filter(Boolean);
  const col3 = [items[2], items[5], items[6]].filter(Boolean);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none text-center">
      
      {/* Header Section */}
      <div className="max-w-3xl mx-auto mb-14 flex flex-col gap-3">
        <span className="text-xs font-black text-primary uppercase tracking-widest block">
          {t("home2_features_badge", "Why Choose Our Platform")}
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
          {t("home2_features_title", "Engineered for Speed, Security, and Success")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
          {t("home2_features_subtitle", "Discover the core features powering top businesses and world-class freelance professionals every single day.")}
        </p>
      </div>

      {/* 3-Column Bento Grid Layout (Matching Screenshot Heights) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        {/* Column 1 (2 Cards: Medium + Tall) */}
        <div className="flex flex-col gap-6">
          {col1.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex flex-col gap-2.5">
                {item.tag && (
                  <span className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wide block">
                    {item.tag}
                  </span>
                )}

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Image Container with Specific Height */}
              <div className={`mt-3 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-xs ${
                idx === 0 ? "h-44 sm:h-48" : "h-56 sm:h-64"
              }`}>
                <img 
                  src={item.image || (idx === 0 ? "/tablet-work.png" : "/home2_banner.png")} 
                  alt={item.title} 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/tablet-work.png";
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Column 2 (2 Cards: Medium + Extra Tall) */}
        <div className="flex flex-col gap-6">
          {col2.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex flex-col gap-2.5">
                {item.tag && (
                  <span className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wide block">
                    {item.tag}
                  </span>
                )}

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Image Container with Specific Height */}
              <div className={`mt-3 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-xs ${
                idx === 0 ? "h-48 sm:h-52" : "h-64 sm:h-72"
              }`}>
                <img 
                  src={item.image || (idx === 0 ? "/home2_banner.png" : "/tablet-work.png")} 
                  alt={item.title} 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/home2_banner.png";
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Column 3 (3 Cards: Compact + Extra Tall + Medium) */}
        <div className="flex flex-col gap-6">
          {col3.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex flex-col gap-2.5">
                {item.tag && (
                  <span className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wide block">
                    {item.tag}
                  </span>
                )}

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Image Container with Specific Height */}
              <div className={`mt-3 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-xs ${
                idx === 0 ? "h-36 sm:h-40" : idx === 1 ? "h-64 sm:h-72" : "h-44 sm:h-48"
              }`}>
                <img 
                  src={item.image || (idx === 0 ? "/tablet-work.png" : idx === 1 ? "/home2_banner.png" : "/tablet-work.png")} 
                  alt={item.title} 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/tablet-work.png";
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
