import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiZap, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config/api";

interface UpgradeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

interface Plan {
  plan_id: number;
  name: string;
  description: string;
  price: string | number;
  period: string;
  features: string[] | string;
  button_text: string;
  is_popular: boolean;
  plan_role: string;
  plan_type?: string;
  plan_duration?: number;
  badge_image?: string | null;
}

export default function UpgradeOverlay({ isOpen, onClose, message }: UpgradeOverlayProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const [plansRes, userRes] = await Promise.all([
          fetch(`${API_URL}/subscription-plans`),
          token ? fetch(`${API_URL}/users/profile`, { headers }) : Promise.resolve(null)
        ]);

        let activeId: number | null = null;
        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          activeId = userData.active_plan_id ?? null;
          setActivePlanId(activeId);
        }

        if (plansRes.ok) {
          const data = await plansRes.json();
          const role = localStorage.getItem("onboarding_role") || "seller";
          const targetRole = role === "client" ? "buyer" : "seller";

          // Filter to show only paid plans matching the user's active role
          const rolePlans = data.filter(
            (p: Plan) => p.plan_role === targetRole && parseFloat(p.price.toString()) > 0
          );

          // Only display plans that are higher tier than the user's current plan
          const displayedPlans = activeId
            ? rolePlans.filter((p: Plan) => p.plan_id > activeId)
            : rolePlans;

          setPlans(displayedPlans);
        }
      } catch (err) {
        console.error("Failed to load plans in overlay", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-slate-50 z-[99999] overflow-y-auto p-6 md:p-12 animate-fadeIn flex flex-col text-slate-800">
      <div className="w-full max-w-5xl mx-auto flex flex-col relative z-10 flex-1 justify-center">
        
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2.5 rounded-full border border-slate-200/60 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 border-none"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shadow-sm mb-4">
            <FiZap className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
            Upgrade Your Membership Plan
          </h2>
          <p className="text-slate-500 text-xs font-semibold mt-2.5 max-w-md">
            Unlock additional proposal credits, discounted fees, and premium tools to accelerate your freelancing career.
          </p>

          {/* Warning box showing current limit msg */}
          {message && (
            <div className="mt-5 bg-amber-50 border border-amber-200/70 rounded-xl p-4 flex items-start gap-3 text-left max-w-lg shadow-sm">
              <FiAlertCircle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-850 uppercase tracking-wide">Proposal Limit Reached</h4>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spinner or Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 z-10">
            <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xxs text-slate-400 font-extrabold uppercase tracking-widest">Loading membership tiers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full z-10 flex-1 justify-center items-stretch mt-2 animate-scaleUp">
            {plans.map((plan) => {
              const isEnterprise = plan.name.toLowerCase().includes("enterprise");
              
              let featuresList: string[] = [];
              if (plan.features) {
                try {
                  featuresList = typeof plan.features === "string"
                    ? JSON.parse(plan.features)
                    : plan.features;
                } catch (e) {
                  featuresList = typeof plan.features === "string"
                    ? plan.features.split("\n").map((f) => f.trim()).filter(Boolean)
                    : [];
                }
              }

              const formattedPrice = parseFloat(plan.price.toString()).toFixed(2);
              
              // Dynamic Duration String
              const durationStr = plan.plan_duration 
                ? `/${plan.plan_duration} ${plan.plan_type || "Day(s)"}`
                : "";

              return (
                <div 
                  key={plan.plan_id}
                  className={`rounded-xl p-8 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all group duration-300 border ${
                    isEnterprise 
                      ? "bg-slate-900 text-white border-slate-800" 
                      : "bg-white text-slate-800 border-slate-200"
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute top-5 right-5 bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Popular
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isEnterprise ? "text-teal-400" : "text-slate-400"}`}>
                          {plan.name} Tier
                        </span>
                        <h3 className="text-2xl font-black mt-1">{plan.name}</h3>
                      </div>
                      {plan.badge_image && (
                        <img 
                          src={plan.badge_image} 
                          alt={plan.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200/40 shadow-sm shrink-0" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <p className={`text-xs font-medium mt-2 ${isEnterprise ? "text-slate-400" : "text-slate-500"}`}>
                      {plan.description || `Get access to our ${plan.name} package features.`}
                    </p>
                    
                    <div className="my-6">
                      <span className="text-4xl font-black">${formattedPrice}</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                        {durationStr}
                      </span>
                    </div>

                    <div className={`border-t my-6 ${isEnterprise ? "border-slate-800" : "border-slate-100"}`}></div>

                    <ul className="space-y-4">
                      {featuresList.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isEnterprise ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-700"
                          }`}>
                            <FiCheck className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-xs font-bold ${isEnterprise ? "text-slate-200" : "text-slate-700"}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/pricing/${plan.plan_id}`);
                    }}
                    className={`w-full rounded-xl py-3 text-xs font-black transition-all cursor-pointer shadow-md mt-8 group-hover:scale-[1.02] border-none ${
                      isEnterprise 
                        ? "bg-white hover:bg-slate-100 text-slate-900" 
                        : "bg-teal-700 hover:bg-teal-800 text-white hover:shadow-teal-900/10"
                    }`}
                  >
                    {plan.button_text && plan.button_text !== "Contact Sales" ? plan.button_text : "Buy Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Maybe Later Link */}
        <div className="text-center mt-10 z-10">
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 text-xs font-bold transition cursor-pointer bg-transparent border-none"
          >
            Maybe Later, keep browsing
          </button>
        </div>

      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
