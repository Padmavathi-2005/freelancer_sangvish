"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  id: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: "vetting",
      question: "How do you vet freelancers?",
      answer: "We conduct a rigorous multi-stage screening process including identity checks, detailed portfolio verification, technical tests, and soft skills assessments. Only the top 3% of professionals who apply are admitted to ensure elite execution quality on Freelancer.",
    },
    {
      id: "escrow",
      question: "How does the escrow system work?",
      answer: "When you start a project milestone, the payment is deposited securely into our system escrow account. The funds are held safely by Freelancer and are only released to the developer once you review and approve the completed milestone deliverables.",
    },
    {
      id: "cancel",
      question: "Can I cancel a project?",
      answer: "Yes, you can cancel a contract at any point before work begins or if milestones are not met. Funds still held in escrow are returned to the client according to our cancellation policies and dispute resolution framework.",
    },
    {
      id: "satisfaction",
      question: "What if I'm not satisfied with the work?",
      answer: "Freelancer provides dedicated dispute resolution support. If any deliverable does not match the agreed-upon contract specifications, you can raise a dispute, and our review team will step in to mediate, issue refunds, or arrange revisions as appropriate.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12 font-display">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto flex flex-col gap-4 select-none">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.id}
                className={`border rounded-2xl transition-all duration-300 ${
                  isOpen
                    ? "border-[#0a5a54]/40 bg-white shadow-md shadow-slate-100"
                    : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                {/* Accordion Header Button */}
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full flex items-center justify-between text-left p-5 font-bold text-slate-800 text-sm sm:text-base cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-btn-${item.id}`}
                >
                  <span className="pr-4 leading-tight">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#0a5a54]" : ""
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
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.id}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                      {item.answer}
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
