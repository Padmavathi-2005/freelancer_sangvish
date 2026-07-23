"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface FAQItem {
  faq_id: number;
  key_suffix: string;
  sort_order: number;
}

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(`${API_URL}/faqs`);
        if (res.ok) {
          setFaqItems(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch FAQs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (loading) {
    return (
      <section className="w-full bg-white border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (faqItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12 font-display">
          {t("faq_header_title", "Frequently Asked Questions")}
        </h2>

        <div className="max-w-3xl mx-auto flex flex-col gap-4 select-none">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const qKey = `faq_q_${item.key_suffix}`;
            const aKey = `faq_a_${item.key_suffix}`;
            
            const question = t(qKey, "");
            const answer = t(aKey, "");

            if (!question) return null;

            return (
              <div
                key={item.faq_id}
                className={`border rounded-xl transition-all duration-300 ${
                  isOpen
                    ? "border-primary/40 bg-white shadow-md shadow-slate-100"
                    : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                {/* Accordion Header Button */}
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full flex items-center justify-between text-left p-5 font-bold text-slate-800 text-sm sm:text-base cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.faq_id}`}
                  id={`faq-btn-${item.faq_id}`}
                >
                  <span className="pr-4 leading-tight">{question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Smooth Expandable Answer Wrapper */}
                <div
                  id={`faq-answer-${item.faq_id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.faq_id}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                      {answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
