"use client";
import { API_URL } from "@/config/api";


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { 
  FiCheckCircle, 
  FiArrowLeft, 
  FiCreditCard, 
  FiFolderPlus, 
  FiMessageSquare, 
  FiTag, 
  FiPercent, 
  FiZap, 
  FiCheck,
  FiShoppingBag,
  FiDollarSign
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
  badge_image?: string | null;
}

export default function PlanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const currencySymbol = "$";
  const { openLoginModal } = useAuthModal();
  const planIdStr = params?.id;
  const planId = planIdStr ? parseInt(planIdStr as string) : null;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Checkout/Payment states
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "stripe" | "paypal">("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Stripe Card form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // PayPal Sandbox checkout states
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("sandbox-buyer@lancerflow.com");
  const [paypalPassword, setPaypalPassword] = useState("12345678");

  useEffect(() => {
    if (!planId) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch all subscription plans
        const resPlans = await fetch(`${API_URL}/subscription-plans`);
        if (resPlans.ok) {
          const dataPlans = await resPlans.json();
          setPlans(dataPlans);
          const found = dataPlans.find((p: Plan) => p.plan_id === planId);
          if (found) setPlan(found);
        }

        // 2. Fetch logged in user details (for current plan & wallet)
        if (token) {
          const resUser = await fetch(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resUser.ok) {
            const dataUser = await resUser.json();
            setActivePlanId(dataUser.active_plan_id);
            setWalletBalance(parseFloat(dataUser.wallet_balance || "0"));
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred fetching subscription details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  // Handle Stripe redirect back success verification
  useEffect(() => {
    if (typeof window === "undefined" || !planId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_success") === "1") {
      const sessionId = params.get("session_id");
      if (!sessionId) return;

      // Clean the URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      const confirmStripeSubscription = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/users/subscribe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ 
              plan_id: planId, 
              payment_method: "stripe",
              session_id: sessionId 
            })
          });

          const data = await res.json();
          if (res.ok) {
            setSuccess(true);
            setActivePlanId(planId);
            setTimeout(() => {
              router.push("/dashboard/settings");
            }, 2200);
          } else {
            alert(data.message || "Stripe payment verification failed.");
          }
        } catch (err) {
          console.error(err);
          alert("Network error confirming Stripe subscription.");
        } finally {
          setLoading(false);
        }
      };
      confirmStripeSubscription();
    }
  }, [planId]);

  const getCardType = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (clean.startsWith("5")) return "Mastercard";
    if (clean.startsWith("3")) return "Amex";
    return "Unknown";
  };

  const handlePaypalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !plan) return;

    const token = localStorage.getItem("token");
    if (!token) {
      openLoginModal();
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/users/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId, payment_method: "paypal" })
      });

      const data = await res.json();
      if (res.ok) {
        setShowPaypalModal(false);
        setSuccess(true);
        setActivePlanId(planId);
        setTimeout(() => {
          router.push("/dashboard/settings");
        }, 2200);
      } else {
        alert(data.message || "Failed to process PayPal sandbox subscription.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error processing PayPal checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !plan) return;

    const token = localStorage.getItem("token");
    if (!token) {
      openLoginModal();
      return;
    }

    const priceVal = parseFloat((plan.price || 0).toString().replace(/[^0-9.]/g, "") || "0");

    if (paymentMethod === "wallet" && priceVal > walletBalance) {
      alert(`Insufficient Escrow Wallet balance. You need ${currencySymbol}${priceVal.toFixed(2)} but currently have ${currencySymbol}${walletBalance.toFixed(2)}.`);
      return;
    }

    if (paymentMethod === "stripe") {
      try {
        setIsSubmitting(true);
        const res = await fetch(`${API_URL}/payments/stripe/create-subscription-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ plan_id: planId })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        } else {
          alert(data.message || "Failed to create Stripe payment session.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error connecting to Stripe.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/users/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setActivePlanId(planId);
        setTimeout(() => {
          router.push("/dashboard/settings");
        }, 2200);
      } else {
        alert(data.message || "Failed to process membership subscription upgrade.");
      }
    } catch (err) {
      console.error(err);
      alert("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-extrabold tracking-wider uppercase">Loading plan benefits...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl p-8 max-w-md text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-450 text-2xl">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Plan Error</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{error || "Subscription tier details are unavailable."}</p>
          <Link href="/" className="px-6 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl shadow hover:bg-teal-800 transition">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const priceVal = parseFloat((plan.price || 0).toString().replace(/[^0-9.]/g, "") || "0");
  const isCurrentActive = activePlanId === plan.plan_id;
  const displayPlans = plans.filter(p => (p.plan_role || "seller") === (plan?.plan_role || "seller"));

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#09090b] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
      {/* Main Website Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {success ? (
          <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/30 shadow-2xl rounded-xl p-12 max-w-2xl mx-auto text-center flex flex-col items-center gap-6 py-20 animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl animate-bounce">
              🎉
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Subscription Active!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
              Congratulations! Your account has successfully upgraded to the <strong>{plan.name} Plan</strong>. Redirecting you to your settings console...
            </p>
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mt-4"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Inline Back Link */}
            <div className="flex items-center gap-1.5 mb-1">
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Pricing</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-1">
            <div className="lg:col-span-7 flex flex-col gap-10">
              
              {/* Premium Plan Banner */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex gap-4 items-start">
                    {plan.badge_image && (
                      <img 
                        src={plan.badge_image} 
                        alt={plan.name} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 mt-1" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-black text-teal-850 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 py-1.5 px-4 rounded-full border border-teal-100/80 dark:border-teal-900/40 shadow-sm inline-block">
                        {plan.name} Membership
                      </span>
                      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-3">{plan.name} Plan Upgrade</h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 max-w-xl leading-relaxed">
                        {plan.description || "Unlock elevated permissions, lower commission fees, and dynamic benefits."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end shrink-0 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {parseFloat((plan.price || 0).toString()) === 0 
                        ? "Free" 
                        : `$${parseFloat((plan.price || 0).toString())}`
                      }
                    </span>
                    <span className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5`}>
                      {plan.plan_duration ? `/${plan.plan_duration} DAYS` : ""}
                    </span>
                  </div>
                </div>

                {isCurrentActive && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-xl p-4 text-xs font-bold flex items-center gap-2 animate-fadeIn mt-2 shadow-sm">
                    <span>🌟 This is your current active subscription plan</span>
                  </div>
                )}
              </div>

              {/* Dynamic Benefits breakdown list (Borderless divide list) */}
              <div className="flex flex-col gap-6">
                <h2 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                  Included Plan Privileges & Features
                </h2>
                
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-start gap-4 py-5 first:pt-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 text-lg shrink-0 shadow-sm">
                      <FiTag />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Gig Purchase Savings</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">
                        {plan.gig_discount_percent > 0 
                          ? `Enjoy a guaranteed ${plan.gig_discount_percent}% membership discount applied automatically on every freelance service checkout.` 
                          : "Subject to standard baseline catalog prices on all freelance gig orders without membership savings."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 py-5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 text-lg shrink-0 shadow-sm">
                      <FiFolderPlus />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Monthly Bid Proposals</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">
                        {(plan.credits ?? 0) >= 9999 
                          ? "Submit unlimited project bid applications to pitch your services to clients without monthly caps." 
                          : `Submit up to ${plan.credits ?? 0} project bid proposal applications monthly to find suitable remote contracts.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 py-5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 text-lg shrink-0 shadow-sm">
                      <FiMessageSquare />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Active Job Listings</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">
                        {plan.job_posting_limit >= 9999 
                          ? "Publish unlimited client job openings per month to request custom bids from the freelancer community." 
                          : `Publish up to ${plan.job_posting_limit} client job listings per month to hire top-tier freelance experts.`}
                      </p>
                    </div>
                  </div>


                </div>
              </div>

              {/* Side by side Matrix Table (Soft Container) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md rounded-xl p-8 overflow-hidden">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Subscription Tiers Comparison</h2>
                <div 
                  className="overflow-x-auto cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={(e) => {
                    const el = e.currentTarget;
                    const startX = e.pageX - el.offsetLeft;
                    const scrollLeft = el.scrollLeft;
                    
                    const onMouseMove = (ev: MouseEvent) => {
                      ev.preventDefault();
                      const x = ev.pageX - el.offsetLeft;
                      const walk = (x - startX) * 1.5;
                      el.scrollLeft = scrollLeft - walk;
                    };
                    
                    const onMouseUp = () => {
                      window.removeEventListener("mousemove", onMouseMove);
                      window.removeEventListener("mouseup", onMouseUp);
                    };
                    
                    window.addEventListener("mousemove", onMouseMove);
                    window.addEventListener("mouseup", onMouseUp);
                  }}
                >
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 pr-4">Benefit Field</th>
                        {displayPlans.map(p => (
                          <th key={p.plan_id} className={`py-3 px-3 text-center ${p.plan_id === plan.plan_id ? "text-teal-700 dark:text-teal-400 font-black bg-teal-50/30 dark:bg-teal-950/40 rounded-t-xl" : ""}`}>
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-200">Gig Order Discount</td>
                        {displayPlans.map(p => (
                          <td key={p.plan_id} className={`py-3 px-3 text-center ${p.plan_id === plan.plan_id ? "bg-teal-50/30 dark:bg-teal-950/40 font-extrabold text-teal-700 dark:text-teal-400" : ""}`}>
                            {p.gig_discount_percent > 0 ? `${p.gig_discount_percent}% off` : "-"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-200">Monthly Bid Limits</td>
                        {displayPlans.map(p => (
                          <td key={p.plan_id} className={`py-3 px-3 text-center ${p.plan_id === plan.plan_id ? "bg-teal-50/30 dark:bg-teal-950/40 font-extrabold text-teal-700 dark:text-teal-400" : ""}`}>
                            {(p.credits ?? 0) >= 9999 ? "Unlimited" : `${p.credits ?? 0} Bids`}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-200">Monthly Job Posts</td>
                        {displayPlans.map(p => (
                          <td key={p.plan_id} className={`py-3 px-3 text-center ${p.plan_id === plan.plan_id ? "bg-teal-50/30 dark:bg-teal-950/40 font-extrabold text-teal-700 dark:text-teal-400" : ""}`}>
                            {p.job_posting_limit >= 9999 ? "Unlimited" : `${p.job_posting_limit} Posts`}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b-0">
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-200">Featured Job Badge</td>
                        {displayPlans.map(p => (
                          <td key={p.plan_id} className={`py-3 px-3 text-center rounded-b-xl ${p.plan_id === plan.plan_id ? "bg-teal-50/30 dark:bg-teal-950/40 font-extrabold text-teal-700 dark:text-teal-400" : ""}`}>
                            {p.featured_job_allowance ? <FiCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" /> : "-"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Payment & Checkout Panel (lg:col-span-5) */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-white border border-slate-150 shadow-xl rounded-xl p-8 flex flex-col gap-6">
                
                <div>
                  <h3 className="text-md font-black text-slate-900 uppercase tracking-wide">Checkout Summary</h3>
                  <p className="text-[9px] text-slate-400 font-black tracking-wider uppercase mt-0.5">Secure platform membership setup</p>
                </div>

                <form onSubmit={handleSubscribe} className="flex flex-col gap-6">
                           {/* Select Payment Method */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Payment Method</label>
                    <div className="bg-slate-100 p-1.5 rounded-full flex gap-1 border border-slate-200/50">
                      {(["wallet", "stripe", "paypal"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex-1 text-center py-2.5 rounded-full text-[10px] font-black capitalize transition-all cursor-pointer ${
                            paymentMethod === method
                              ? "bg-[#063c38] text-white shadow-md"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {method === "wallet" ? "Wallet" : method === "stripe" ? "Stripe Pay" : "PayPal Sandbox"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallet Balance Display */}
                  {paymentMethod === "wallet" && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Active Wallet Balance</span>
                        <span className="text-lg font-black text-slate-900 mt-0.5">{currencySymbol}{walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        {priceVal > walletBalance ? (
                          <span className="bg-rose-50 text-rose-700 text-[9px] font-black py-1 px-3 rounded-full border border-rose-100">
                            Insufficient Funds
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black py-1 px-3 rounded-full border border-emerald-100">
                            Sufficient
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stripe Checkout redirection info */}
                  {paymentMethod === "stripe" && (
                    <div className="flex flex-col gap-4 items-center justify-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 animate-fadeIn">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 text-lg shrink-0 shadow-sm animate-pulse">
                        <FiCreditCard />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Secure Stripe checkout portal</span>
                        <p className="text-[10px] text-slate-650 font-semibold mt-1 max-w-xs leading-normal">
                          You will be securely redirected to the off-site Stripe portal to complete your transaction with Visa, Mastercard, or Amex.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PayPal Sandbox Checkout Option */}
                  {paymentMethod === "paypal" && (
                    <div className="flex flex-col gap-4 items-center justify-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => setShowPaypalModal(true)}
                        className="w-full bg-[#ffc439] hover:bg-[#f2ba36] text-[#003087] font-black text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
                      >
                        <span className="italic font-extrabold text-sm">PayPal</span>
                        <span className="text-[9px] font-black tracking-widest uppercase bg-[#003087] text-white px-2 py-0.5 rounded">
                          Sandbox Checkout
                        </span>
                      </button>
                      <p className="text-[10px] text-slate-450 font-bold text-center leading-normal">
                        Click the button above to authorize payment via a secure PayPal account popup window.
                      </p>
                    </div>
                  )}

                  {/* Final Pricing breakdown */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Subscription Tier</span>
                      <span className="font-bold text-slate-700">{plan.name}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Cycle Price</span>
                      <span className="font-bold text-slate-700">
                        {parseFloat((plan.price || 0).toString()) === 0 
                          ? "Free" 
                          : `$${parseFloat((plan.price || 0).toString()).toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-dashed border-slate-150 pt-3 mt-1.5">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Total Due</span>
                      <span className="text-2xl font-black text-slate-900">{currencySymbol}{priceVal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  {paymentMethod !== "paypal" ? (
                    <button
                      type="submit"
                      disabled={isSubmitting || isCurrentActive}
                      className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <FiShoppingBag className="w-4 h-4 shrink-0" />
                      <span>
                        {isSubmitting 
                          ? "Processing Checkout..." 
                          : isCurrentActive 
                            ? "Current Active Plan" 
                            : `Subscribe & Pay ${currencySymbol}${priceVal.toFixed(2)}`
                        }
                      </span>
                    </button>
                  ) : (
                    <div className="w-full text-center py-3 bg-slate-100 text-slate-400 font-black text-xs rounded-xl border border-slate-200 select-none">
                      🔒 Authorize payment via PayPal button above
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 text-center font-bold leading-normal">
                    🔒 SSL SECURE SUBSCRIPTION CHECKOUT
                    <br />
                    You can cancel or change subscription parameters at any time from your settings panel.
                  </p>
                </form>

              </div>
            </div>

          </div>
        </div>
      )}
      </main>

      {/* PayPal Sandbox Pop-up Modal Simulation */}
      {showPaypalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl overflow-y-auto max-h-[90vh] w-full max-w-md animate-scaleUp">
            
            {/* Paypal Modal Header */}
            <div className="bg-[#003087] text-white px-6 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="italic font-black text-lg">PayPal</span>
                <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">Sandbox</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPaypalModal(false)}
                className="text-white/80 hover:text-white font-extrabold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Paypal Modal Content */}
            <form onSubmit={handlePaypalSubmit} className="p-6 flex flex-col gap-5" autoComplete="off">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Purchase Details</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">LancerFlow {plan.name} Plan Membership Upgrade</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-150 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300">Checkout Price</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{currencySymbol}{priceVal.toFixed(2)}</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Sandbox Email Address</label>
                  <input
                    type="email"
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="sandbox-buyer@lancerflow.com"
                    autoComplete="off"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-700 transition w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">PayPal Password</label>
                  <input
                    type="password"
                    required
                    value={paypalPassword}
                    onChange={(e) => setPaypalPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-700 transition w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition cursor-pointer text-center"
              >
                {isSubmitting ? "Authorizing sandbox checkout..." : "Agree & Pay Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
