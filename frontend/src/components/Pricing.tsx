"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { convertPrice } from "@/utils/currencyHelper";
import {
  FiCheck,
  FiInfo,
  FiPercent,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiShoppingBag,
  FiCheckCircle,
  FiAward,
  FiStar
} from "react-icons/fi";

interface Plan {
  plan_id: number;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  button_text: string;
  is_popular: boolean;
  is_current: boolean;
  gig_discount_percent: number;
  proposal_limit: number;
  job_posting_limit: number;
  transaction_fee_percent: string | number;
  featured_job_allowance: boolean;
  plan_duration?: number;
  plan_role?: string;
  credits?: number;
}

export default function Pricing() {
  const { t, currency } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([
    {
      plan_id: 1,
      name: "Starter",
      description: "Ideal for emerging freelancers and individual buyers building their initial presence.",
      price: "0.00",
      period: "Month",
      features: [
        "Standard Platform Fee (5%)",
        "Up to 10 Monthly Bids/Proposals",
        "Post Up to 3 Active Jobs",
        "Community & Standard Support"
      ],
      button_text: "Get Started Free",
      is_popular: false,
      is_current: false,
      gig_discount_percent: 0,
      proposal_limit: 10,
      job_posting_limit: 3,
      transaction_fee_percent: "5.0",
      featured_job_allowance: false
    },
    {
      plan_id: 2,
      name: "Professional",
      description: "Designed for active contractors and growing agencies maximizing client outreach.",
      price: "29.00",
      period: "Month",
      features: [
        "Reduced 2.0% Transaction Fee",
        "10% Discount on Service Gigs",
        "Unlimited Bids & Proposals",
        "Featured Badge & Priority Support"
      ],
      button_text: "Upgrade to Professional",
      is_popular: true,
      is_current: false,
      gig_discount_percent: 10,
      proposal_limit: 999,
      job_posting_limit: 20,
      transaction_fee_percent: "2.0",
      featured_job_allowance: true
    },
    {
      plan_id: 3,
      name: "Enterprise",
      description: "Full-scale corporate tier with zero fees and dedicated account executive.",
      price: "99.00",
      period: "Month",
      features: [
        "0.0% Zero Transaction Fees",
        "20% Discount on Service Gigs",
        "Unlimited Job Postings & Hiring",
        "Dedicated Account Executive"
      ],
      button_text: "Contact Enterprise",
      is_popular: false,
      is_current: false,
      gig_discount_percent: 20,
      proposal_limit: 999,
      job_posting_limit: 999,
      transaction_fee_percent: "0.0",
      featured_job_allowance: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);

  // Interactive Calculator States
  const [monthlySpend, setMonthlySpend] = useState<number>(800); // expected spend on gig purchases
  const [monthlyEarnings, setMonthlyEarnings] = useState<number>(1500); // expected earnings as freelancer
  const [showCalculator, setShowCalculator] = useState(true);
  const [selectedRole, setSelectedRole] = useState<"seller" | "buyer">("seller");
  const [showMatrix, setShowMatrix] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlansAndSubscription = async () => {
      try {
        const apiUrl = API_URL || "http://localhost:5000/api";
        const resPlans = await fetch(`${apiUrl}/subscription-plans`);
        if (resPlans.ok) {
          const plansData = await resPlans.json();
          if (Array.isArray(plansData) && plansData.length > 0) {
            setPlans(plansData);
          }
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
          try {
            const resSub = await fetch(`${apiUrl}/users/me/subscription`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (resSub.ok) {
              const subData = await resSub.json();
              setActivePlanId(subData.active_plan_id);
            }
          } catch {
            // Ignore sub fetch error silently
          }
        }
      } catch {
        // Silent fallback to default plans
      }
    };
    fetchPlansAndSubscription();
  }, []);

  // Calculator logic
  // Starter: 0% gig discount, 5.0% commission
  // Professional: 10% gig discount, 2.0% commission
  // Enterprise: 20% gig discount, 0.0% commission
  const calculateSavings = (planName: string) => {
    if (planName === "Starter") return 0;

    if (planName === "Professional") {
      const gigSavings = monthlySpend * 0.10;
      const commissionSavings = monthlyEarnings * (0.05 - 0.02);
      return parseFloat((gigSavings + commissionSavings).toFixed(2));
    }

    if (planName === "Enterprise") {
      const gigSavings = monthlySpend * 0.20;
      const commissionSavings = monthlyEarnings * (0.05 - 0.00);
      return parseFloat((gigSavings + commissionSavings).toFixed(2));
    }

    return 0;
  };

  const filteredPlans = plans.filter((p: any) => (p.plan_role || "seller") === selectedRole);
  const planCount = filteredPlans.length;
  const containerMaxWidth = planCount === 2 || planCount === 4 ? "max-w-4xl" : "max-w-7xl";
  const cardWidthClass = planCount === 2 || planCount === 4
    ? "w-full md:w-[calc(50%-12px)] max-w-[360px]"
    : "w-full md:w-[calc(33.33%-16px)] min-w-[210px] max-w-[340px]";

  const FAQs = [
    {
      q: "How does the Gig Discount work?",
      a: "When you purchase services/gigs, the percentage discount is automatically deducted at checkout. Professional plan users save 10% on every order; Enterprise users save 20%."
    },
    {
      q: "What is the transaction fee benefit?",
      a: "Platform commission fees are deducted from milestone releases. Free users are charged 5.0%. Professional tier users pay a reduced 2.0% commission fee, and Enterprise users pay 0.0% commission, letting you keep more of your earnings."
    },
    {
      q: "Can I upgrade or downgrade my plan at any time?",
      a: "Yes. Upgrades take effect immediately. Downgrades or cancellations will take effect at the end of your current billing period."
    },
    {
      q: "What payment methods are supported?",
      a: "You can pay using your active LancerFlow escrow wallet balance (pre-funded) or securely via Stripe or PayPal checkout methods."
    }
  ];

  if (loading) {
    return (
      <div className="w-full py-20 flex justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xxs text-slate-400 font-extrabold uppercase tracking-widest">{t("loading_membership_tiers", "Loading membership tiers...")}</p>
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="w-full bg-[#fafbfc] border-t border-slate-200/40 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1.025); }
          50%       { transform: translateY(-10px) scale(1.025); }
        }
        @keyframes glowPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 transparent, 0 20px 40px rgba(15, 23, 42, 0.15); 
          }
          50% { 
            box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary, #0F766E) 18%, transparent), 0 25px 50px rgba(15, 23, 42, 0.22); 
          }
        }
        .card-popular {
          animation: float 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite;
        }
        .shimmer-badge {
          background: linear-gradient(90deg, #22c55e 0%, #4ade80 40%, #22c55e 60%, #16a34a 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        @keyframes rotateBadge {
          0%,100% { transform: rotate(-2deg) scale(1); }
          50%      { transform: rotate(2deg) scale(1.08); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
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
      {/* Background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-teal-50 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-50/70 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="bg-teal-50 border border-teal-100 text-teal-800 text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-3">
            {t("membership_badge", "LancerFlow SaaS Memberships")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
            {t("membership_title", "Maximize Earnings & Savings")}
          </h2>
          <p className="text-sm text-slate-500 mt-4 max-w-xl mx-auto font-semibold leading-relaxed">
            {t("membership_desc", "Choose a plan tailored to your volume. Reduce platform fees, secure dynamic gig discounts, and boost visibility.")}
          </p>
        </div>



        {/* Toggle Tiers Group */}
        <div className="flex justify-center items-center gap-2 mb-10 bg-slate-100 p-1.5 rounded-xl w-fit mx-auto border border-slate-200">
          <button
            onClick={() => setSelectedRole("seller")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${selectedRole === "seller"
                ? "bg-primary text-white shadow-md"
                : "bg-transparent text-slate-500 hover:text-primary"
              }`}
          >
            {t("freelancer_plans_tab", "Freelancer Plans")}
          </button>
          <button
            onClick={() => setSelectedRole("buyer")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${selectedRole === "buyer"
                ? "bg-primary text-white shadow-md"
                : "bg-transparent text-slate-500 hover:text-primary"
              }`}
          >
            {t("client_plans_tab", "Client Plans")}
          </button>
        </div>

        {/* SECTION 2: Dynamic Plan Cards Grid */}
        <div className={`flex flex-wrap justify-center gap-6 items-stretch mx-auto ${containerMaxWidth} mb-16`}>
          {filteredPlans.map((dbPlan, idx) => {
            const planId = dbPlan.plan_id;
            const isPopular = dbPlan.is_popular;
            const isCurrent = activePlanId ? activePlanId === planId : dbPlan.is_current;

            const discountValue = dbPlan.gig_discount_percent ? parseInt(dbPlan.gig_discount_percent as any) : 0;
            const proposalLimit = dbPlan.proposal_limit ? parseInt(dbPlan.proposal_limit as any) : 5;
            const jobLimit = dbPlan.job_posting_limit ? parseInt(dbPlan.job_posting_limit as any) : 3;
            const featuredAllowance = dbPlan.featured_job_allowance ?? false;

            // Build real feature highlights from plan fields — skip negatives
            const realFeatures: string[] = [];
            const credits = dbPlan.credits ?? 0;
            if (credits > 0) {
              realFeatures.push(
                credits >= 9999
                  ? t("unlimited_bids_month", "Unlimited bids / month")
                  : t("bids_per_month_count", "{{count}} bids / month").replace("{{count}}", String(credits))
              );
            }
            if (jobLimit > 0) {
              realFeatures.push(
                jobLimit >= 9999
                  ? t("unlimited_job_postings_month", "Unlimited job postings / month")
                  : t("job_postings_per_month_count", "{{count}} job postings / month").replace("{{count}}", String(jobLimit))
              );
            }
            if (discountValue > 0) {
              realFeatures.push(
                t("gig_order_discount_percent", "{{percent}}% gig order discount").replace("{{percent}}", String(discountValue))
              );
            }
            if (featuredAllowance) {
              realFeatures.push(t("featured_job_badge_feature", "Featured job badge"));
            }
            const fee = dbPlan.transaction_fee_percent;
            if (fee != null && fee !== "") {
              realFeatures.push(
                t("transaction_fee_percent_feature", "{{fee}}% transaction fee").replace("{{fee}}", String(fee))
              );
            }

            const price = parseFloat(String(dbPlan.price || "0"));
            const isFree = price === 0;
            const delay = `${idx * 0.12}s`;
            const isLight = idx === 0;
            return (
              <div
                key={planId}
                className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${cardWidthClass} ${isPopular
                    ? "card-popular z-10"
                    : "hover:scale-[1.025] hover:shadow-xl hover:-translate-y-1"
                  } ${isPopular
                    ? "bg-primary text-white border border-primary-hover shadow-2xl"
                    : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-lg text-slate-800 dark:text-zinc-100"
                  }`}
                style={{
                  animationDelay: delay
                }}
              >
                {/* Popular special top glow bar */}
                {isPopular && (
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,var(--color-primary,#0F766E),var(--color-secondary,#06b6d4),var(--color-primary,#0F766E))", backgroundSize: "200% auto", animation: "shimmer 2s linear infinite" }} />
                )}

                {/* Popular badge */}
                {isPopular && (
                  <div className="flex justify-center pt-5 pb-0">
                    <span className="shimmer-badge rotateBadge flex items-center gap-1.5 bg-white/15 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                      <FiStar className="w-2.5 h-2.5" style={{ animation: "rotateBadge 2s ease-in-out infinite" }} />
                      {t("most_popular_badge", "Most Popular")}
                    </span>
                  </div>
                )}

                {/* Card Content Wrapper */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Card Header */}
                    <div className="mb-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isPopular ? "text-teal-200" : isLight ? "text-primary dark:text-teal-400" : "text-amber-500 dark:text-amber-400"}`}>
                        {t("plan_name_label", "{{name}} Plan").replace("{{name}}", t(dbPlan.name, dbPlan.name))}
                      </span>
                      <p className={`text-xs mt-2 font-semibold leading-relaxed ${isPopular ? "text-white/80" : "text-slate-500 dark:text-zinc-400"}`}>
                        {t(dbPlan.description, dbPlan.description)}
                      </p>
                    </div>

                    {/* Card Pricing */}
                    <div className="flex items-baseline gap-1.5 mb-8">
                      <span className={`text-4xl sm:text-5xl font-black tracking-tight ${isPopular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {parseFloat((dbPlan.price || 0).toString()) === 0
                          ? t("plan_free", "Free")
                          : convertPrice(parseFloat((dbPlan.price || 0).toString().replace(/[^0-9.]/g, "") || "0"), currency).formatted
                        }
                      </span>
                      <span className={`text-xs font-bold ${isPopular ? "text-white/70" : "text-slate-400 dark:text-zinc-500"}`}>
                        {dbPlan.plan_duration ? `/ ${dbPlan.plan_duration} ${t("plan_duration_days", "DAYS")}` : ""}
                      </span>
                    </div>

                    {/* Card Features list */}
                    <ul className={`flex flex-col gap-3.5 pt-6 ${isPopular ? "border-t border-white/15" : "border-t border-slate-100 dark:border-zinc-800"}`}>
                      {realFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3.5 text-xs font-semibold">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-md ${isPopular
                              ? "bg-white font-black"
                              : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 font-black"
                            }`}>
                            <FiCheck className={`w-3.5 h-3.5 stroke-[3] ${isPopular ? "text-primary" : ""}`} />
                          </span>
                          <span className={isPopular ? "text-white font-bold" : "text-slate-700 dark:text-zinc-300 font-semibold"}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upgrade Button */}
                  <div className="mt-8 pt-4">
                    {isCurrent ? (
                      <button
                        disabled
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-extrabold cursor-default transition ${isPopular
                            ? "bg-white/20 border border-white/20 text-white"
                            : "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-slate-400"
                          }`}
                      >
                        {t("active_plan_btn", "Active Plan")}
                      </button>
                    ) : (
                      <Link
                        href={`/pricing/${planId}`}
                        className={`btn-shine w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${isPopular
                            ? "bg-white hover:bg-slate-100 text-slate-950 shadow-lg hover:shadow-white/15 font-black"
                            : "bg-primary hover:bg-primary-hover text-white shadow-md"
                          }`}
                      >
                        {t("choose_plan_btn", "Choose Plan")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 3: Dynamic Comparison Matrix Toggle */}




      </div>
    </section>
  );
}
