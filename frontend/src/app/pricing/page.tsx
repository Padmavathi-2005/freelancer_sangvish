"use client";
import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { FiCheck, FiStar, FiZap, FiArrowRight, FiShield } from "react-icons/fi";

interface Plan {
  plan_id: number;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  button_text: string;
  is_popular: boolean;
  gig_discount_percent: number;
  proposal_limit: number;
  job_posting_limit: number;
  transaction_fee_percent: string | number;
  featured_job_allowance: boolean;
  plan_duration?: number;
  plan_role?: string;
  credits?: number;
  badge_image?: string | null;
}

function buildFeatures(plan: Plan): string[] {
  const items: string[] = [];
  const credits = plan.credits ?? 0;
  if (credits > 0) items.push(credits >= 9999 ? "Unlimited bids / month" : `${credits} bids / month`);
  if (plan.job_posting_limit > 0) items.push(plan.job_posting_limit >= 9999 ? "Unlimited job postings" : `${plan.job_posting_limit} job postings / month`);
  if (plan.gig_discount_percent > 0) items.push(`${plan.gig_discount_percent}% gig order discount`);
  if (plan.featured_job_allowance) items.push("Featured job badge");
  if (plan.transaction_fee_percent != null && plan.transaction_fee_percent !== "") items.push(`${plan.transaction_fee_percent}% transaction fee`);
  return items;
}

export default function PricingPage() {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [roleTab, setRoleTab] = useState<"seller" | "buyer">("seller");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Load and apply theme on mount
    const savedTheme = typeof window !== "undefined" ? localStorage.getItem("siteTheme") || "light" : "light";
    const primaryCol = typeof window !== "undefined" ? localStorage.getItem("primaryColor") || "#0d9488" : "#0d9488";
    const secondaryCol = typeof window !== "undefined" ? localStorage.getItem("secondaryColor") || "#06b6d4" : "#06b6d4";
    import("@/utils/theme").then((mod) => {
      mod.applyTheme(savedTheme, primaryCol, secondaryCol);
    });

    const storedRole = typeof window !== "undefined" ? localStorage.getItem("onboarding_role") : null;
    if (storedRole === "client") setRoleTab("buyer");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const load = async () => {
      try {
        const [plansRes, userRes] = await Promise.allSettled([
          fetch(`${API_URL}/subscription-plans`),
          token ? fetch(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
        ]);
        if (plansRes.status === "fulfilled" && plansRes.value.ok) setAllPlans(await plansRes.value.json());
        if (userRes.status === "fulfilled" && userRes.value && (userRes.value as Response).ok) {
          const u = await (userRes.value as Response).json();
          setActivePlanId(u.active_plan_id ?? null);
        }
      } catch (e) { console.error(e); }
      finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      }
    };
    load();
    setTimeout(() => setVisible(true), 100);
  }, []);

  const hasBuyerPlans = allPlans.some((p) => p.plan_role === "buyer");
  const plans = allPlans.filter((p) => (p.plan_role || "seller") === roleTab);
  const colClass = plans.length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1.03); }
          50%       { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0), 0 25px 50px rgba(6,60,56,0.35); }
          50%       { box-shadow: 0 0 0 6px rgba(20,184,166,0.18), 0 25px 50px rgba(6,60,56,0.45); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotateBadge {
          0%,100% { transform: rotate(-2deg) scale(1); }
          50%      { transform: rotate(2deg) scale(1.08); }
        }
        @keyframes blobA {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-15px) scale(1.08); }
        }
        @keyframes blobB {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-18px,12px) scale(1.06); }
        }
        .card-enter { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
        .card-popular {
          animation: float 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite;
        }
        .shimmer-badge {
          background: linear-gradient(90deg, #22c55e 0%, #4ade80 40%, #22c55e 60%, #16a34a 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        .blob-a { animation: blobA 7s ease-in-out infinite; }
        .blob-b { animation: blobB 9s ease-in-out infinite; }
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          transition: none;
        }
        .btn-shine:hover::after {
          left: 150%;
          transition: left 0.5s ease;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/80 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Header />

        {/* ── Hero ── */}
        <section className="relative bg-white dark:bg-slate-900/40 overflow-hidden border-b border-slate-100/80 dark:border-slate-800/80 py-20 px-4 text-center transition-colors duration-300">
          {/* Animated blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="blob-a absolute -top-24 -left-24 w-80 h-80 bg-teal-100/50 dark:bg-teal-900/10 rounded-full blur-3xl" />
            <div className="blob-b absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-3xl" />
            <div className="blob-a absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-teal-50/60 dark:bg-teal-900/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto" style={{ animation: "fadeUp 0.6s cubic-bezier(.22,1,.36,1) both" }}>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-light border border-primary/20 px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <FiZap className="w-3 h-3" /> Membership Plans
            </span>
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Simple,{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                  transparent
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-2.5 bg-teal-100/60 dark:bg-teal-900/40 rounded-full z-0" />
              </span>{" "}
              pricing
            </h1>
            <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
              Upgrade or cancel any time — no lock‑in, no hidden fees.
            </p>

            {!loading && hasBuyerPlans && (
              <div className="mt-8 inline-flex items-center bg-slate-100/80 dark:bg-slate-850/80 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl p-1 gap-1 shadow-sm">
                <button onClick={() => setRoleTab("seller")} className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${roleTab === "seller" ? "bg-primary text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-205"}`}>
                  Freelancer Plans
                </button>
                <button onClick={() => setRoleTab("buyer")} className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${roleTab === "buyer" ? "bg-primary text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-205"}`}>
                  Client Plans
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Plans ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-10 h-10 border-4 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">Loading plans…</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-sm font-bold text-slate-400 dark:text-slate-550">No plans available yet.</p>
            </div>
          ) : (
            <div className={`grid gap-6 items-center ${colClass}`}>
              {plans.map((plan, idx) => {
                const price = parseFloat(String(plan.price || "0"));
                const isFree = price === 0;
                const isActive = activePlanId === plan.plan_id;
                const isPopular = plan.is_popular;
                const features = buildFeatures(plan);
                const delay = `${idx * 0.12}s`;

                // Card themes
                const isLight = idx === 0;

                return (
                  <div
                    key={plan.plan_id}
                    className={`card-enter relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                      isPopular
                        ? "card-popular z-10"
                        : "hover:scale-[1.02] hover:shadow-xl"
                    } ${
                      isLight
                        ? "bg-white dark:bg-slate-900/85 ring-2 ring-slate-200 dark:ring-slate-800/80 shadow-md"
                        : isPopular
                        ? "bg-[#063c38] ring-2 ring-teal-400 dark:ring-teal-500 shadow-2xl"
                        : "bg-[#0f172a] ring-2 ring-slate-700 shadow-xl"
                    }`}
                    style={{ animationDelay: delay }}
                  >
                    {/* Popular special top glow bar */}
                    {isPopular && (
                      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#14b8a6,#22c55e,#14b8a6)", backgroundSize: "200% auto", animation: "shimmer 2s linear infinite" }} />
                    )}

                    {/* Popular badge */}
                    {isPopular && (
                      <div className="flex justify-center pt-3 pb-0">
                        <span className="shimmer-badge rotateBadge flex items-center gap-1.5 bg-teal-800 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                          <FiStar className="w-2.5 h-2.5" style={{ animation: "rotateBadge 2s ease-in-out infinite" }} />
                          Most Popular
                        </span>
                      </div>
                    )}
                    {isActive && !isPopular && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-teal-700 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow">✓ Active</span>
                      </div>
                    )}

                    {/* Header */}
                    <div className={`px-7 pt-7 pb-6 ${isPopular ? "bg-teal-700 text-white" : isLight ? "bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80" : "bg-[#1e293b] border-b border-slate-700/50"}`}>
                      {plan.badge_image && (
                        <img src={plan.badge_image} alt={plan.name} className="w-9 h-9 rounded-xl object-cover mb-3 border border-white/20 shadow"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                      )}
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isPopular ? "text-white/90" : isLight ? "text-teal-700" : "text-amber-400"}`}>
                        {plan.name}
                      </p>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className={`text-4xl font-black tracking-tight ${isPopular ? "text-white" : isLight ? "text-slate-900 dark:text-white" : "text-white"}`}>
                          {isFree ? "Free" : `$${price % 1 === 0 ? Math.round(price) : price.toFixed(2)}`}
                        </span>
                        {!isFree && (
                          <span className={`text-xs font-bold ${isPopular ? "text-slate-200" : isLight ? "text-slate-450 dark:text-slate-400" : "text-slate-300"}`}>
                            {plan.plan_duration ? `/ ${plan.plan_duration} days` : `/ ${plan.period || "mo"}`}
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className={`text-[11px] font-semibold mt-1.5 leading-relaxed ${isPopular ? "text-slate-200" : isLight ? "text-slate-400 dark:text-slate-400" : "text-slate-300"}`}>
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex-1 px-7 py-5 flex flex-col gap-3">
                      {features.length > 0
                        ? features.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3"
                              style={{
                                animationName: "fadeUp",
                                animationDuration: "0.4s",
                                animationTimingFunction: "cubic-bezier(.22,1,.36,1)",
                                animationFillMode: "both",
                                animationDelay: `${parseFloat(delay) + i * 0.06}s`,
                              }}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? "bg-teal-50" : isLight ? "bg-teal-50" : "bg-slate-700"}`}>
                                <FiCheck className={`w-3 h-3 ${isPopular ? "text-teal-700" : isLight ? "text-teal-700" : "text-amber-400"}`} />
                              </span>
                              <span className={`text-[11px] font-semibold ${isPopular ? "text-slate-100" : isLight ? "text-slate-700 dark:text-slate-300" : "text-slate-300"}`}>{f}</span>
                            </div>
                          ))
                        : <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Basic access included</p>
                      }
                    </div>

                    {/* CTA */}
                    <div className="px-7 pb-7 pt-2">
                      <Link
                        href={`/pricing/${plan.plan_id}`}
                        className={`btn-shine w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
                          isActive
                            ? "bg-teal-50 border border-teal-200 text-teal-700"
                            : isPopular
                            ? "bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/30"
                            : "bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
                        }`}
                      >
                        {isActive ? "Current Plan" : isFree ? "Get Started Free" : plan.button_text || `Choose ${plan.name}`}
                        {!isActive && <FiArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && plans.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-12" style={{ animation: "fadeUp 0.6s 0.5s both" }}>
              <FiShield className="w-3.5 h-3.5 text-teal-650 dark:text-teal-400" />
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                Secure checkout &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Instant activation
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
