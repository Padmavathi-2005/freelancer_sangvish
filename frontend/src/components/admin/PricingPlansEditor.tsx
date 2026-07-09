"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

interface PricingPlansEditorProps {
  triggerToast: (title: string, text: string) => void;
}

export default function PricingPlansEditor({ triggerToast }: PricingPlansEditorProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/subscription-plans`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (e) {
      console.error("Failed to load subscription plans", e);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePlanFieldChange = (planId: number, field: string, value: any) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.plan_id === planId) {
          return { ...p, [field]: value };
        }
        if (field === "is_popular" && value === true && p.plan_id !== planId) {
          return { ...p, is_popular: false };
        }
        return p;
      })
    );
  };

  const handleSavePlan = async (plan: any) => {
    setSavingPlanId(plan.plan_id);
    try {
      let parsedFeatures = plan.features;
      if (typeof plan.features === "string") {
        parsedFeatures = plan.features.split("\n").map((f: string) => f.trim()).filter(Boolean);
      }
      const res = await fetch(`${API_URL}/admin/subscription-plans/${plan.plan_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          price: parseFloat(plan.price || 0),
          period: plan.period,
          features: parsedFeatures,
          button_text: plan.button_text,
          is_popular: plan.is_popular,
          is_current: plan.is_current,
          gig_discount_percent: plan.gig_discount_percent,
          proposal_limit: plan.proposal_limit,
          job_posting_limit: plan.job_posting_limit,
          transaction_fee_percent: plan.transaction_fee_percent,
          featured_job_allowance: plan.featured_job_allowance,
          plan_role: plan.plan_role,
          plan_type: "Day(s)",
          plan_duration: parseInt(plan.plan_duration || 30),
          credits: plan.credits,
          profile_featured_duration: plan.profile_featured_duration,
          featured_project_limit: plan.featured_project_limit,
          featured_project_duration: plan.featured_project_duration,
          badge_image: plan.badge_image
        })
      });
      if (res.ok) {
        triggerToast("Plan Saved", `Subscription plan "${plan.name}" updated successfully!`);
        fetchPlans();
      } else {
        triggerToast("Error Saving", "Failed to save subscription plan.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Saving", "Error updating plan.");
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleAddPlan = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/admin/subscription-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({
          name: `Custom tier ${plans.length + 1}`,
          description: "New subscription tier package details.",
          price: "$29",
          period: "/month",
          features: ["Talent matching support", "Standard customer success dashboard"],
          button_text: "Upgrade Now",
          is_popular: false,
          is_current: false,
          gig_discount_percent: 5,
          proposal_limit: 10,
          job_posting_limit: 5,
          transaction_fee_percent: 3.5,
          featured_job_allowance: false,
          plan_role: "seller",
          plan_type: "Month(s)",
          plan_duration: 1,
          credits: 10,
          profile_featured_duration: 0,
          featured_project_limit: 0,
          featured_project_duration: 0,
          badge_image: null
        })
      });
      if (res.ok) {
        triggerToast("Plan Created", "Created new custom subscription tier successfully!");
        fetchPlans();
      } else {
        triggerToast("Error Creating", "Failed to create subscription plan.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Creating", "Error generating new plan.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlan = async (planId: number, planName: string) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${planName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/subscription-plans/${planId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("Plan Deleted", `Subscription plan "${planName}" removed successfully.`);
        fetchPlans();
      } else {
        triggerToast("Error Deleting", "Failed to delete subscription plan.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Deleting", "Error deleting plan.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-base font-bold text-slate-800">Subscription Pricing Plans</h4>
          <p className="text-xs text-slate-500 mt-1">Configure pricing tier plans displayed on the home page premium section. Toggle which plan is featured/highlighted in green.</p>
        </div>
        <button
          onClick={handleAddPlan}
          disabled={creating}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          {creating ? "Creating..." : "Add New Plan"}
        </button>
      </div>

      {plansLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isRecommended = plan.is_popular;
            return (
              <div
                key={plan.plan_id}
                className={`border rounded-3xl p-6 flex flex-col justify-between gap-5 transition bg-white relative ${
                  isRecommended 
                    ? "border-teal-700 shadow-lg shadow-teal-500/5 ring-1 ring-teal-700" 
                    : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-3.5 left-6 bg-teal-700 text-white font-extrabold text-[9px] tracking-wider uppercase py-1 px-3.5 rounded-full shadow-sm">
                    Recommended Plan
                  </span>
                )}
                
                <div className="flex flex-col gap-4">
                  {/* Plan name & switch */}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 flex-1 pr-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "name", e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition w-full"
                      />
                    </div>
                    
                    {/* Popular Toggle */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Highlight</span>
                      <button
                        type="button"
                        onClick={() => handlePlanFieldChange(plan.plan_id, "is_popular", !plan.is_popular)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                          isRecommended ? "bg-teal-700" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          isRecommended ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description (Subtitle)</label>
                    <input
                      type="text"
                      value={plan.description || ""}
                      onChange={(e) => handlePlanFieldChange(plan.plan_id, "description", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
                      placeholder="e.g. For individuals and small teams."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={plan.price}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "price", parseFloat(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                        placeholder="Add price"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Period</label>
                      <input
                        type="text"
                        value={plan.period || ""}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "period", e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
                        placeholder="e.g. /month, empty for free"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gig Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={plan.gig_discount_percent || 0}
                      onChange={(e) => handlePlanFieldChange(plan.plan_id, "gig_discount_percent", parseInt(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                    />
                  </div>

                  {/* Package target role */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Package For</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`plan_role_${plan.plan_id}`}
                          value="buyer"
                          checked={plan.plan_role === "buyer"}
                          onChange={() => handlePlanFieldChange(plan.plan_id, "plan_role", "buyer")}
                          className="text-teal-700 focus:ring-teal-700"
                        />
                        Client
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`plan_role_${plan.plan_id}`}
                          value="seller"
                          checked={plan.plan_role === "seller" || !plan.plan_role}
                          onChange={() => handlePlanFieldChange(plan.plan_id, "plan_role", "seller")}
                          className="text-teal-700 focus:ring-teal-700"
                        />
                        Freelancer
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Package Duration (in days)</label>
                    <input
                      type="number"
                      min="1"
                      value={plan.plan_duration || 30}
                      onChange={(e) => handlePlanFieldChange(plan.plan_id, "plan_duration", parseInt(e.target.value) || 30)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Number of Credits</label>
                      <input
                        type="number"
                        min="0"
                        value={plan.credits || 0}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "credits", parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Profile Featured (Days)</label>
                      <input
                        type="number"
                        min="0"
                        value={plan.profile_featured_duration || 0}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "profile_featured_duration", parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Projects to Post</label>
                      <input
                        type="number"
                        min="0"
                        value={plan.job_posting_limit || 0}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "job_posting_limit", parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Featured Projects</label>
                      <input
                        type="number"
                        min="0"
                        value={plan.featured_project_limit || 0}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "featured_project_limit", parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Featured Duration</label>
                      <input
                        type="number"
                        min="0"
                        value={plan.featured_project_duration || 0}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "featured_project_duration", parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Badge Image URL</label>
                    <input
                      type="text"
                      value={plan.badge_image || ""}
                      onChange={(e) => handlePlanFieldChange(plan.plan_id, "badge_image", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
                      placeholder="e.g. https://example.com/platinum-badge.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Button Text</label>
                      <input
                        type="text"
                        value={plan.button_text}
                        onChange={(e) => handlePlanFieldChange(plan.plan_id, "button_text", e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
                      />
                    </div>
                    <div className="flex flex-col items-start gap-1 shrink-0">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Featured Job Allow</label>
                      <button
                        type="button"
                        onClick={() => handlePlanFieldChange(plan.plan_id, "featured_job_allowance", !plan.featured_job_allowance)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                          plan.featured_job_allowance ? "bg-teal-700" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          plan.featured_job_allowance ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Access</span>
                      <span className="text-xxs text-slate-500 font-semibold mt-0.5">Toggle default current plan state.</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePlanFieldChange(plan.plan_id, "is_current", !plan.is_current)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                          plan.is_current ? "bg-teal-700" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          plan.is_current ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Features (one per line)</label>
                    <textarea
                      rows={5}
                      value={Array.isArray(plan.features) ? plan.features.join("\n") : (plan.features || "")}
                      onChange={(e) => handlePlanFieldChange(plan.plan_id, "features", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y font-semibold w-full"
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSavePlan(plan)}
                    disabled={savingPlanId === plan.plan_id}
                    className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer text-center"
                  >
                    {savingPlanId === plan.plan_id ? "Saving..." : `Save`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.plan_id, plan.name)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-2.5 rounded-xl transition duration-150 border border-rose-200 cursor-pointer flex items-center justify-center shrink-0"
                    title="Delete subscription plan"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
