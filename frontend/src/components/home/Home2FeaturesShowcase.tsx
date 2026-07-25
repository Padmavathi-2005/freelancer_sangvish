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
  FiArrowRight,
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

const ICON_COLORS = [
  { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-600 dark:text-violet-400", accent: "from-violet-500 to-purple-600" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400", accent: "from-emerald-500 to-teal-600" },
  { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-600 dark:text-sky-400", accent: "from-sky-500 to-blue-600" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", accent: "from-amber-500 to-orange-600" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-600 dark:text-rose-400", accent: "from-rose-500 to-pink-600" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-600 dark:text-indigo-400", accent: "from-indigo-500 to-violet-600" },
  { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-600 dark:text-teal-400", accent: "from-teal-500 to-emerald-600" },
];

export default function Home2FeaturesShowcase() {
  const { t } = useLanguage();
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const defaultFeaturePool: FeatureItem[] = [
    {
      id: 1,
      tag: "AI MATCHMAKING",
      title: "AI-Powered Talent Matching",
      desc: "Our neural matching algorithm pairs your project specs with top 1% verified freelancers instantly.",
      iconName: "cpu",
      badge: "Smart AI",
      image: "/home2_banner.png",
    },
    {
      id: 2,
      tag: "ESCROW SECURITY",
      title: "Milestone-Based Escrow Vault",
      desc: "Funds remain safely locked in escrow and are only released when you approve completed project milestones.",
      iconName: "shield",
      badge: "100% Safe",
      image: "/tablet-work.png",
    },
    {
      id: 3,
      tag: "ZERO HIDDEN FEES",
      title: "Upfront Budget Guarantee",
      desc: "Clear competitive commission structures with no surprise costs or hidden platform surcharges.",
      iconName: "zap",
      badge: "Fair Price",
      image: "/home2_banner.png",
    },
    {
      id: 4,
      tag: "GLOBAL WORKFORCE",
      title: "Cross-Border Talent Network",
      desc: "Access specialized developers, designers, and marketers across 120+ countries effortlessly.",
      iconName: "globe",
      badge: "Worldwide",
      image: "/tablet-work.png",
    },
    {
      id: 5,
      tag: "SPEED & AVAILABILITY",
      title: "Sub-24 Hour Hiring Velocity",
      desc: "Post your project requirement and receive qualified proposals from ready-to-work freelancers within hours.",
      iconName: "clock",
      badge: "Fast Hire",
      image: "/home2_banner.png",
    },
    {
      id: 6,
      tag: "AUTOMATED CONTRACTS",
      title: "Smart NDAs & Legal Terms",
      desc: "Auto-generate binding non-disclosure agreements and intellectual property transfer contracts in seconds.",
      iconName: "award",
      badge: "Legal",
      image: "/tablet-work.png",
    },
    {
      id: 7,
      tag: "TRANSPARENT REVIEWS",
      title: "Verified Client Rating System",
      desc: "Authentic double-blind reviews ensure only genuine client feedback impacts freelancer reputations.",
      iconName: "trending",
      badge: "Transparent",
      image: "/home2_banner.png",
    },
  ];

  const getIcon = (name?: string, size = "w-6 h-6") => {
    switch (name) {
      case "cpu": return <FiCpu className={size} />;
      case "shield": return <FiShield className={size} />;
      case "credit_card": return <FiCreditCard className={size} />;
      case "user_check": return <FiUserCheck className={size} />;
      case "message": return <FiMessageSquare className={size} />;
      case "lock": return <FiLock className={size} />;
      case "award": return <FiAward className={size} />;
      case "trending": return <FiTrendingUp className={size} />;
      case "clock": return <FiClock className={size} />;
      case "globe": return <FiGlobe className={size} />;
      case "check": return <FiCheckCircle className={size} />;
      case "zap": default: return <FiZap className={size} />;
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
          if (settingItem?.setting_value) {
            let val = settingItem.setting_value;
            if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
            if (Array.isArray(val) && val.length > 0) pool = val;
          }
        }
      } catch (err) {
        console.error("Failed to fetch features:", err);
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setSelectedFeatures(shuffled.slice(0, 7));
    };
    fetchAdminFeatures();
  }, []);

  const items = selectedFeatures.length > 0 ? selectedFeatures : defaultFeaturePool;
  const activeItem = items[activeIndex] || items[0];
  const activeColor = ICON_COLORS[activeIndex % ICON_COLORS.length];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none">

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-5">
          <FiZap className="w-3 h-3" />
          {t("home2_features_badge", "Why Choose Our Platform")}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight mb-4">
          {t("home2_features_title", "Engineered for Speed, Security, and Success")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          {t("home2_features_subtitle", "Discover the core features powering top businesses and world-class freelance professionals every single day.")}
        </p>
      </div>

      {/* Main Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">

        {/* Left: Feature List (interactive) */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {items.map((item, idx) => {
            const color = ICON_COLORS[idx % ICON_COLORS.length];
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-full text-left flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 border-primary/30 shadow-lg shadow-primary/5"
                    : "bg-slate-50/60 dark:bg-zinc-900/50 border-slate-200/60 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Icon Badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? color.bg : "bg-slate-100 dark:bg-zinc-800"}`}>
                  <span className={isActive ? color.text : "text-slate-400 dark:text-zinc-500"}>
                    {getIcon(item.iconName, "w-5 h-5")}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase tracking-wide mb-0.5 ${isActive ? "text-primary" : "text-slate-400 dark:text-zinc-500"}`}>
                    {item.tag}
                  </p>
                  <p className={`text-sm font-bold leading-snug truncate ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-300"}`}>
                    {item.title}
                  </p>
                </div>

                {/* Arrow */}
                <div className={`shrink-0 transition-all duration-200 ${isActive ? "text-primary translate-x-0 opacity-100" : "text-slate-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"}`}>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Feature Detail Panel */}
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/60 dark:shadow-none min-h-[480px] flex flex-col">

          {/* Gradient top strip */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${activeColor.accent}`} />

          {/* Content */}
          <div className="flex flex-col flex-1 p-8 sm:p-10">
            {/* Top meta */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeColor.bg}`}>
                <span className={activeColor.text}>
                  {getIcon(activeItem?.iconName, "w-6 h-6")}
                </span>
              </div>
              <div>
                <span className={`text-xs font-black uppercase tracking-widest block ${activeColor.text}`}>
                  {activeItem?.tag}
                </span>
                {activeItem?.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeColor.bg} ${activeColor.text} inline-block mt-0.5`}>
                    {activeItem.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4 font-display">
              {activeItem?.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              {activeItem?.desc}
            </p>

            {/* Step indicator dots */}
            <div className="flex items-center gap-2 mt-auto">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-full transition-all duration-300 cursor-pointer border-none ${
                    idx === activeIndex
                      ? `w-6 h-2 bg-gradient-to-r ${activeColor.accent}`
                      : "w-2 h-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300"
                  }`}
                />
              ))}
              <span className="ml-auto text-xs text-slate-400 dark:text-zinc-500 font-bold tabular-nums">
                {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Bottom image strip */}
          <div className="h-52 sm:h-64 w-full overflow-hidden relative">
            {/* Gradient fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-zinc-900 via-transparent to-transparent z-10 h-16 pointer-events-none" />
            <img
              src={activeItem?.image || "/home2_banner.png"}
              alt={activeItem?.title}
              className="w-full h-full object-cover object-center transition-all duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = "/home2_banner.png"; }}
            />
          </div>
        </div>
      </div>

      {/* Bottom compact grid: remaining features as stat-style cards */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Countries", value: "120+", icon: "globe", color: ICON_COLORS[2] },
          { label: "Vetted Freelancers", value: "50K+", icon: "user_check", color: ICON_COLORS[1] },
          { label: "Projects Completed", value: "200K+", icon: "check", color: ICON_COLORS[0] },
          { label: "Client Satisfaction", value: "98%", icon: "award", color: ICON_COLORS[3] },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color.bg}`}>
              <span className={stat.color.text}>{getIcon(stat.icon, "w-4 h-4")}</span>
            </div>
            <div>
              <p className={`text-2xl font-black ${stat.color.text} leading-none mb-0.5`}>{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
