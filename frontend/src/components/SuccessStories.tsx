"use client";

import React, { useState, useEffect, useRef } from "react";

export default function SuccessStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const testimonials = [
    {
      name: "Elena Rodriguez",
      role: "CTO, TechStart Inc.",
      avatar: "/sarah-avatar.png",
      rating: 5,
      quote: "Finding the right developer for our core platform was daunting. Freelancer matched us with David within 24 hours. His expertise accelerated our launch by 2 months.",
    },
    {
      name: "Marcus Vance",
      role: "Founder, Apex Systems",
      avatar: "/david-avatar.png",
      rating: 5,
      quote: "We needed a complete redesign of our SaaS portal under a tight deadline. The designer Freelancer found was spectacular—delivering pixel-perfect Figma prototypes ahead of schedule.",
    },
    {
      name: "Priya Patel",
      role: "Product Lead, CloudScale",
      avatar: null, // renders initials placeholder
      initials: "PP",
      rating: 5,
      quote: "The AI automation engineer we hired through Freelancer integrated a custom LLM pipeline into our product in just two weeks. Outstanding talent pool and seamless payments.",
    },
  ];

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 6000); // 6 seconds delay for comfortable reading
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    resetTimer(); // resets auto-slide timer on manual click
  };

  return (
    <section className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12">
          Success Stories
        </h2>

        {/* Carousel Card Container */}
        <div className="max-w-4xl mx-auto relative bg-slate-50/40 border border-slate-200/60 rounded-[2rem] shadow-lg shadow-slate-100/50 overflow-hidden">
          
          <div 
            className="flex transition-transform duration-700 ease-in-out w-full"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="w-full shrink-0 flex flex-col md:flex-row items-center gap-6 sm:gap-10 p-6 sm:p-10 min-h-[320px] sm:min-h-[260px]"
              >
                {/* Left Column: Avatar with Quote mark badge */}
                <div className="relative shrink-0 select-none">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#e6f0ef] text-[#0a5a54] flex items-center justify-center font-extrabold text-2xl border-2 border-white shadow-md">
                      {testimonial.initials}
                    </div>
                  )}
                  {/* Quote green icon overlay */}
                  <div className="absolute -bottom-1 -right-1 bg-[#0a5a54] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                </div>

                {/* Right Column: Quote detail */}
                <div className="flex-1 text-center md:text-left min-w-0">
                  {/* 5-Star Ratings */}
                  <div className="flex items-center justify-center md:justify-start gap-0.5 text-emerald-600 mb-4 select-none">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote Text */}
                  <blockquote className="text-[#063c38] text-sm sm:text-base md:text-lg font-medium italic leading-relaxed mb-6 font-display break-words">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  {/* Author Info */}
                  <div>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                      {testimonial.name}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5 leading-none">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide Dots Indicator */}
        <div className="flex items-center justify-center gap-3 mt-8 select-none">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === index ? "w-6 bg-[#0a5a54]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
