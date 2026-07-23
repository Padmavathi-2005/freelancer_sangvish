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
  FiAward
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
  const { currency } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(true);
        // Fetch plans
        const resPlans = await fetch(`${API_URL}/subscription-plans`);
        if (!resPlans.ok) throw new Error("Failed to load plans.");
        const plansData = await resPlans.json();
        setPlans(plansData);

        // Fetch user active plan if logged in
        const token = localStorage.getItem("token");
        if (token) {
          const resSub = await fetch(`${API_URL}/users/me/subscription`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resSub.ok) {
            const subData = await resSub.json();
            setActivePlanId(subData.active_plan_id);
          }
        }
      } catch (e) {
        console.error("Pricing page data loading error:", e);
      } finally {
        setLoading(false);
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
    ? "w-full sm:w-[calc(50%-12px)] max-w-[360px]" 
    : "w-full md:w-[calc(33.33%-16px)] min-w-[280px] max-w-[340px]";

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
          <p className="text-xxs text-slate-400 font-extrabold uppercase tracking-widest">Loading membership tiers...</p>
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="w-full bg-[#fafbfc] border-t border-slate-200/40 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-teal-50 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-50/70 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="bg-teal-50 border border-teal-100 text-teal-800 text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-3">
            LancerFlow SaaS Memberships
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
            Maximize Earnings & Savings
          </h2>
          <p className="text-sm text-slate-500 mt-4 max-w-xl mx-auto font-semibold leading-relaxed">
            Choose a plan tailored to your volume. Reduce platform fees, secure dynamic gig discounts, and boost visibility.
          </p>
        </div>



        {/* Toggle Tiers Group */}
        <div className="flex justify-center items-center gap-2 mb-10 bg-slate-100 p-1.5 rounded-xl w-fit mx-auto border border-slate-200">
          <button
            onClick={() => setSelectedRole("seller")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
              selectedRole === "seller"
                ? "bg-primary text-white shadow-md"
                : "bg-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Freelancer Plans
          </button>
          <button
            onClick={() => setSelectedRole("buyer")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
              selectedRole === "buyer"
                ? "bg-primary text-white shadow-md"
                : "bg-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Client Plans
          </button>
        </div>

        {/* SECTION 2: Dynamic Plan Cards Grid */}
        <div className={`flex flex-wrap justify-center gap-6 items-stretch mx-auto ${containerMaxWidth} mb-16`}>
          {filteredPlans.map((dbPlan) => {
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
            if (credits > 0) realFeatures.push(credits >= 9999 ? "Unlimited bids / month" : `${credits} bids / month`);
            if (jobLimit > 0) realFeatures.push(jobLimit >= 9999 ? "Unlimited job postings / month" : `${jobLimit} job postings / month`);
            if (discountValue > 0) realFeatures.push(`${discountValue}% gig order discount`);
            if (featuredAllowance) realFeatures.push("Featured job badge");
            const fee = dbPlan.transaction_fee_percent;
            if (fee != null && fee !== "") realFeatures.push(`${fee}% transaction fee`);

            return (
              <div 
                key={planId} 
                className={`relative rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] border ${cardWidthClass} ${
                  isPopular 
                    ? "pricing-popular-card bg-primary text-white border-transparent shadow-2xl shadow-primary/30 z-10 lg:-translate-y-4" 
                    : "bg-white text-slate-900 border-slate-200/60 shadow-lg shadow-slate-100/50"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-hover text-white font-extrabold text-[10px] tracking-wider uppercase py-1.5 px-5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPopular ? "text-white/90" : "text-primary"}`}>
                      {dbPlan.name} Plan
                    </span>
                    <p className={`text-xxs mt-1 font-semibold leading-relaxed ${isPopular ? "text-slate-200" : "text-slate-405"}`}>
                      {dbPlan.description}
                    </p>
                  </div>

                  {/* Card Pricing */}
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-4xl font-black tracking-tight">
                      {parseFloat((dbPlan.price || 0).toString()) === 0 
                        ? "Free" 
                        : convertPrice(parseFloat((dbPlan.price || 0).toString().replace(/[^0-9.]/g, "") || "0"), currency).formatted
                      }
                    </span>
                    <span className={`text-xxs font-black uppercase tracking-wider ${isPopular ? "text-slate-350" : "text-slate-400"}`}>
                      {dbPlan.plan_duration ? `/${dbPlan.plan_duration} DAYS` : ""}
                    </span>
                  </div>

                  {/* Card Features list */}
                  <ul className="flex flex-col gap-3 border-t border-slate-100/10 pt-6">
                    {realFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                        <FiCheck className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? "text-white" : "text-primary"}`} />
                        <span className={isPopular ? "text-slate-100" : "text-slate-650"}>
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
                      className="w-full bg-slate-100 border border-slate-200/50 text-slate-400 font-black text-xs py-3.5 rounded-xl cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <Link 
                      href={`/pricing/${planId}`}
                      className={`w-full font-black text-xs py-3.5 rounded-xl block text-center transition active:scale-[0.98] cursor-pointer ${
                        isPopular
                          ? "bg-white text-slate-900 hover:bg-slate-100 shadow-md"
                          : "bg-primary text-white hover:bg-primary-hover"
                      }`}
                    >
                      {parseFloat((dbPlan.price || 0).toString()) === 0 ? "Get Started Free" : "Buy Plan"}
                    </Link>
                  )}
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
