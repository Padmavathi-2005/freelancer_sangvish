"use client";

import React from "react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "For individuals and small teams.",
      price: "Free",
      period: "",
      features: [
        "Basic talent search",
        "Standard support",
        "5% transaction fee"
      ],
      buttonText: "Current Plan",
      isPopular: false,
      isCurrent: true,
    },
    {
      name: "Professional",
      description: "For growing businesses needing top talent.",
      price: "₹999",
      period: "/month",
      features: [
        "Advanced AI matching",
        "Priority 24/7 support",
        "2% transaction fee",
        "Dedicated account manager"
      ],
      buttonText: "Upgrade Now",
      isPopular: true,
      isCurrent: false,
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations.",
      price: "Custom",
      period: "",
      features: [
        "Unlimited talent search",
        "Dedicated success team",
        "0% transaction fee",
        "Custom API integration"
      ],
      buttonText: "Contact Sales",
      isPopular: false,
      isCurrent: false,
    }
  ];

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs for premium presentation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#e6f0ef] rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Upgrade to Premium
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-3 max-w-xl mx-auto font-medium leading-relaxed">
            Unlock advanced features, lower fees, and priority support to scale your business faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] border w-full max-w-md mx-auto ${
                plan.isPopular 
                  ? "bg-[#063c38] text-white border-transparent shadow-2xl shadow-[#0a5a54]/30 z-10 lg:-translate-y-4" 
                  : "bg-slate-50/70 text-slate-900 border-slate-200/60 shadow-lg shadow-slate-100/50"
              }`}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#22c55e] text-white font-extrabold text-[10px] tracking-wider uppercase py-1 px-4 rounded-full shadow-md shrink-0">
                  Most Popular
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className={`text-xl font-extrabold ${plan.isPopular ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs font-semibold mt-1 ${plan.isPopular ? "text-emerald-200/80" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Pricing Block */}
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-4xl font-extrabold tracking-tight ${plan.isPopular ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-xs font-bold ${plan.isPopular ? "text-emerald-200/70" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features Checklist */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-xs sm:text-sm font-semibold">
                      <svg 
                        className={`w-4 h-4 mt-0.5 shrink-0 ${plan.isPopular ? "text-emerald-400" : "text-emerald-600"}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2.8"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.isPopular ? "text-slate-100" : "text-slate-700"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-auto pt-4">
                {plan.isPopular ? (
                  <button 
                    onClick={() => alert(`Upgrading to Professional Plan...`)}
                    className="w-full bg-[#22c55e] hover:bg-[#1eb051] text-white font-extrabold text-xs py-3 rounded-xl transition-all duration-200 shadow-md shadow-emerald-950/20 active:scale-[0.98] cursor-pointer"
                  >
                    {plan.buttonText}
                  </button>
                ) : (
                  <button 
                    onClick={() => alert(plan.isCurrent ? "You are currently on this plan." : `Initiating action for ${plan.name} plan...`)}
                    className={`w-full font-bold text-xs py-3 rounded-xl transition-all duration-200 border active:scale-[0.98] cursor-pointer ${
                      plan.isCurrent 
                        ? "bg-transparent border-slate-300 text-slate-500 cursor-default" 
                        : "bg-transparent border-slate-300 hover:border-[#0a5a54] text-slate-700 hover:text-[#0a5a54]"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
