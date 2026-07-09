"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FiSearch, FiChevronDown, FiHelpCircle, FiMail, FiMapPin, FiClock, FiBriefcase, FiActivity, FiSliders } from "react-icons/fi";

interface BuilderBlock {
  id: string;
  type: string;
  data: Record<string, any>;
}

function CarouselSection({ blockId, slides }: { blockId: string; slides: any[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  if (!slides || slides.length === 0) return null;

  return (
    <section key={blockId} className="relative w-full h-[450px] overflow-hidden bg-slate-900 text-white flex items-center">
      {/* Slides */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIdx;
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image with overlay */}
            <div className="absolute inset-0 bg-black/60 z-10" />
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
            {/* Slide Content */}
            <div className="relative z-20 max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl opacity-90 leading-relaxed font-medium">
                {slide.description}
              </p>
              {slide.buttonText && (
                <a
                  href={slide.buttonLink || "/login"}
                  className="bg-teal-600 hover:bg-teal-550 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg mt-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  {slide.buttonText}
                </a>
              )}
            </div>
          </div>
        );
      })}

      {/* Navigation Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentIdx ? "bg-teal-500 w-6" : "bg-white/45 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setSubmitStatus({ type: "error", message: "Email and message are required fields." });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitStatus(null);
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      });

      if (res.ok) {
        setSubmitStatus({ type: "success", message: "Thank you! Your inquiry has been submitted successfully." });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        const errData = await res.json();
        setSubmitStatus({ type: "error", message: errData.error || "Failed to submit inquiry. Please try again." });
      }
    } catch (err) {
      console.error("Submit inquiry error:", err);
      setSubmitStatus({ type: "error", message: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-3xl flex flex-col gap-5 text-left">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-2 select-none">Send Message</h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">Our team will respond back shortly</p>
      </div>

      {submitStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold leading-normal ${
          submitStatus.type === "success" 
            ? "bg-primary/5 text-primary border border-primary/20" 
            : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {submitStatus.message}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-primary rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition-all"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Email Address <span className="text-rose-500">*</span></label>
        <input
          type="email"
          required
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-primary rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition-all"
        />
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Subject</label>
        <input
          type="text"
          placeholder="Business Inquiry / Partnership"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-primary rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition-all"
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Your Message <span className="text-rose-500">*</span></label>
        <textarea
          required
          rows={4}
          placeholder="Write your inquiry details here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-primary rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none resize-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2 border-none"
      >
        {submitting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending Inquiry...</span>
          </>
        ) : (
          <span>Submit Inquiry</span>
        )}
      </button>
    </form>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setSubmitStatus({ type: "error", message: "Email address is required." });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitStatus(null);
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSubmitStatus({ type: "success", message: "Successfully subscribed to our newsletter!" });
        setEmail("");
      } else {
        const errData = await res.json();
        setSubmitStatus({ type: "error", message: errData.error || "Failed to subscribe. Please try again." });
      }
    } catch (err) {
      console.error("Newsletter subscribe error:", err);
      setSubmitStatus({ type: "error", message: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-3xl flex flex-col gap-5 text-left font-sans">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-2 select-none">Subscribe</h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none font-sans">Get remote jobs & marketplace trends</p>
      </div>

      {submitStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold leading-normal font-sans ${
          submitStatus.type === "success" 
            ? "bg-primary/5 text-primary border border-primary/20" 
            : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {submitStatus.message}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5 font-sans">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Email Address <span className="text-rose-500">*</span></label>
        <input
          type="email"
          required
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-primary rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2 border-none font-sans"
      >
        {submitting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Subscribing...</span>
          </>
        ) : (
          <span>Subscribe Now</span>
        )}
      </button>
    </form>
  );
}

export default function DynamicCmsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [pageData, setPageData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // FAQ state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/pages/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPageData(data);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load CMS page:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center">
          <h1 className="text-7xl font-black text-slate-200 tracking-tight font-display select-none">404</h1>
          <h2 className="text-xl font-extrabold text-slate-800 mt-4">Page Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            The page you are looking for does not exist or has not been published yet.
          </p>
          <a
            href="/"
            className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-teal-750/20 transition-all transform active:scale-95"
          >
            Go Back Home
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  // Intercept contact page layout to render dynamic form
  if (slug === "contact") {
    let pageTitle = "Contact Us";
    let pageSubtitle = "Have an inquiry? We would love to hear from you.";
    let pageHtml = "";

    if (pageData.content_type === "Builder") {
      try {
        const parsed = JSON.parse(pageData.content);
        const titleBlock = parsed.find((b: any) => b.type === "Title");
        const richBlock = parsed.find((b: any) => b.type === "RichText");
        if (titleBlock?.data) {
          pageTitle = titleBlock.data.title || pageTitle;
          pageSubtitle = titleBlock.data.subtitle || pageSubtitle;
        }
        if (richBlock?.data) {
          pageHtml = richBlock.data.content || "";
        }
      } catch (e) {
        console.error("Failed to parse Builder contact page:", e);
      }
    } else {
      pageTitle = pageData.title?.replace(/-/g, " ") || pageTitle;
      pageHtml = pageData.content || "";
    }

    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 font-sans w-full max-w-full relative">
        <Header />
        
        {/* Full-Width Premium Light Hero Header */}
        <section className="relative w-full bg-gradient-to-b from-primary/5 via-primary/[0.01] to-[#f8fafc] py-20 px-4 overflow-hidden text-center border-b border-slate-100">
          {/* Ambient Decorative grids and blurs */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] z-0 text-primary/[0.03]" />
          <div className="absolute top-[-20%] left-[-10%] w-[35rem] h-[35rem] bg-primary/8 rounded-full filter blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[35rem] h-[35rem] bg-secondary/6 rounded-full filter blur-[120px] pointer-events-none z-0" />
          
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-4">
            <span className="bg-primary/5 border border-primary/10 text-primary text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-1 select-none">
              Reach Out To Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none font-display text-slate-800">
              Let's Start a Conversation
            </h1>
            <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
              Have an inquiry about partnerships, enterprise scaling, or standard account support? We're here to help.
            </p>
          </div>
        </section>

        {/* Main Fluid Grid Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Side: Dynamic Contact Cards */}
            <div className="lg:col-span-5 space-y-8 text-left">
              <div>
                <span className="text-[10px] font-black text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full uppercase tracking-wider select-none">
                  Get In Touch
                </span>
                <h2 className="text-2xl font-black text-slate-800 mt-4 tracking-tight leading-tight select-none">
                  Headquarters & Relations
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                  Our operations team coordinates support coverage globally. Use the form or details below to contact us.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Customer Support */}
                <div className="flex gap-4.5 p-5.5 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 select-none">Support & Business</h4>
                    <p className="text-xs text-slate-500 font-semibold">
                      Client Support: <a href="mailto:support@buy2lancer.com" className="text-primary hover:underline font-bold">support@buy2lancer.com</a>
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Partnerships: <a href="mailto:partners@buy2lancer.com" className="text-primary hover:underline font-bold">partners@buy2lancer.com</a>
                    </p>
                  </div>
                </div>

                {/* HQ Office */}
                <div className="flex gap-4.5 p-5.5 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                    <FiMapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 select-none">HQ Office Address</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      100 Pine Street, San Francisco,<br />CA 94111, United States
                    </p>
                  </div>
                </div>

                {/* Expected Response Times */}
                <div className="flex gap-4.5 p-5.5 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 select-none">SLA response time</h4>
                    <p className="text-xs text-slate-500 font-semibold">
                      Under 4 hours response for verified standard accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Contact Form Card */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/60 shadow-xl rounded-[2rem] p-6 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl pointer-events-none" />
                <ContactForm />
              </div>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Intercept newsletter page layout to render dynamic form
  if (slug === "newsletter") {
    let pageTitle = "Newsletter Subscription";
    let pageSubtitle = "Subscribe to stay updated with latest insights, remote jobs, and marketplace stats.";
    let pageHtml = "";

    if (pageData.content_type === "Builder") {
      try {
        const parsed = JSON.parse(pageData.content);
        const titleBlock = parsed.find((b: any) => b.type === "Title");
        const richBlock = parsed.find((b: any) => b.type === "RichText");
        if (titleBlock?.data) {
          pageTitle = titleBlock.data.title || pageTitle;
          pageSubtitle = titleBlock.data.subtitle || pageSubtitle;
        }
        if (richBlock?.data) {
          pageHtml = richBlock.data.content || "";
        }
      } catch (e) {
        console.error("Failed to parse Builder newsletter page:", e);
      }
    } else {
      pageTitle = pageData.title?.replace(/-/g, " ") || pageTitle;
      pageHtml = pageData.content || "";
    }

    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 font-sans w-full max-w-full relative">
        <Header />
        
        {/* Full-Width Premium Light Hero Header */}
        <section className="relative w-full bg-gradient-to-b from-primary/5 via-primary/[0.01] to-[#f8fafc] py-20 px-4 overflow-hidden text-center border-b border-slate-100">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] z-0 text-primary/[0.03]" />
          <div className="absolute top-[-20%] left-[-10%] w-[35rem] h-[35rem] bg-primary/8 rounded-full filter blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[35rem] h-[35rem] bg-secondary/6 rounded-full filter blur-[120px] pointer-events-none z-0" />
          
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-4">
            <span className="bg-primary/5 border border-primary/10 text-primary text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-1 select-none">
              Stay Informed
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none font-display text-slate-800">
              {pageTitle}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
              {pageSubtitle}
            </p>
          </div>
        </section>

        {/* Main One-Column Workspace */}
        <main className="flex-1 w-full max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-12">
          
          {/* Centered Subscription Box */}
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white border border-slate-200/60 shadow-xl rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="max-w-md mx-auto relative z-10 flex flex-col gap-6">
                <NewsletterForm />
              </div>
            </div>
          </div>

          {/* Horizontal Benefit Columns */}
          <div className="w-full mt-4">
            <div className="text-center mb-8">
              <span className="text-[10px] font-black text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full uppercase tracking-wider select-none">
                Subscribers Privileges
              </span>
              <h2 className="text-2xl font-black text-slate-800 mt-4 tracking-tight leading-tight select-none">
                Exclusive Weekly Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weekly curated remote jobs */}
              <div className="flex flex-col gap-4 p-6 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm text-left">
                <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                  <FiBriefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-2 select-none">Curated Job Lists</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Get premium, hand-picked remote opportunities matching your skills directly in your inbox.
                  </p>
                </div>
              </div>

              {/* Freelancing Guides */}
              <div className="flex flex-col gap-4 p-6 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm text-left">
                <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                  <FiActivity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-2 select-none">Guides & Tips</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Learn interviewing success strategies, contract best practices, and rate negotiation tips.
                  </p>
                </div>
              </div>

              {/* Marketplace stats */}
              <div className="flex flex-col gap-4 p-6 bg-white border border-slate-200/55 rounded-2xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 shadow-sm text-left">
                <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 text-lg">
                  <FiSliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-2 select-none">Marketplace Insights</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Stay updated on the latest hiring trends, average contract values, and in-demand skills.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </main>
        
        <Footer />
      </div>
    );
  }

  // Parse Builder blocks
  let blocks: BuilderBlock[] = [];
  if (pageData.content_type === "Builder") {
    try {
      blocks = JSON.parse(pageData.content);
    } catch (e) {
      console.error("Failed to parse page content JSON:", e);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {pageData.content_type === "HTML" ? (
        /* HTML Rendering Mode */
        <main className="flex-1 w-full py-16 bg-[#fafbfc] text-slate-900 relative">
          {/* Background blurs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
            <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-teal-50 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-50/70 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-white border border-slate-200/70 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-100/50">
              
              {/* Header section with page title */}
              <div className="border-b border-slate-100 pb-6 mb-8 text-left">
                <span className="bg-teal-50 border border-teal-100 text-teal-800 text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-3 select-none">
                  Information Portal
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none capitalize">
                  {pageData.title?.replace(/-/g, " ")}
                </h1>
              </div>

              {/* Rich HTML Content styling container */}
              <div 
                className="cms-html-content text-left"
                dangerouslySetInnerHTML={{ __html: pageData.content }} 
              />
            </div>
          </div>
        </main>
      ) : (
        /* Builder Element Rendering Mode */
        <div className="flex-1 flex flex-col w-full max-w-full">
          {blocks.map((block) => {
            const data = block.data;

            switch (block.type) {
              case "Hero":
                return (
                  <section key={block.id} className="relative overflow-hidden bg-slate-50 py-20 lg:py-28 border-b border-slate-200/50">
                    <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-teal-600/5 rounded-full filter blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-cyan-600/5 rounded-full filter blur-[100px] pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center gap-6">
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight font-display max-w-3xl leading-tight">
                        {data.headline}
                      </h1>
                      <p className="text-base sm:text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
                        {data.subheadline}
                      </p>
                      
                      {/* Interactive Search box mockup */}
                      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-2 shadow-lg hover:shadow-xl focus-within:ring-2 focus-within:ring-teal-500/25 transition-all duration-300 flex items-center gap-2 mt-4">
                        <FiSearch className="w-5 h-5 text-slate-400 ml-2" />
                        <input
                          type="text"
                          placeholder={data.searchPlaceholder}
                          className="flex-1 text-sm text-slate-800 placeholder-slate-450 focus:outline-none"
                        />
                        <button className="bg-teal-700 hover:bg-teal-650 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-teal-700/25 active:scale-95 transform duration-250 cursor-pointer">
                          {data.buttonText}
                        </button>
                      </div>
                    </div>
                  </section>
                );

              case "Brands":
                return (
                  <section key={block.id} className="py-10 bg-slate-100/40 border-b border-slate-200/50 text-center">
                    <div className="max-w-7xl mx-auto px-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
                        {data.title}
                      </span>
                      <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                        {data.logos?.split(",").map((logo: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-base sm:text-lg font-black text-slate-400 tracking-tight select-none opacity-70 hover:opacity-100 hover:-translate-y-0.5 hover:scale-105 transition-all duration-250 cursor-pointer"
                          >
                            {logo.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                );

              case "Title":
                return (
                  <section key={block.id} className="py-12 bg-white text-center">
                    <div className="max-w-7xl mx-auto px-4">
                      <h2 className="text-3xl font-black text-slate-850 tracking-tight font-display">
                        {data.title}
                      </h2>
                      {data.subtitle && (
                        <p className="text-sm text-slate-450 mt-2 font-medium">
                          {data.subtitle}
                        </p>
                      )}
                    </div>
                  </section>
                );

              case "RichText":
                return (
                  <section key={block.id} className="py-16 bg-white">
                    <div
                      className="max-w-4xl mx-auto px-4 prose prose-slate text-slate-650 leading-relaxed font-serif"
                      dangerouslySetInnerHTML={{ __html: data.content || "" }}
                    />
                  </section>
                );

              case "FAQ":
                return (
                  <section key={block.id} className="py-20 bg-slate-50 border-t border-b border-slate-205/50">
                    <div className="max-w-3xl mx-auto px-4">
                      <h2 className="text-3xl font-black text-center text-slate-850 tracking-tight font-display mb-10">
                        {data.title}
                      </h2>
                      
                      <div className="flex flex-col gap-3">
                        {data.items?.map((item: any, qIdx: number) => {
                          const isOpen = openFaqIdx === qIdx;
                          return (
                            <div
                              key={qIdx}
                              className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-teal-500/10 transition-all duration-200"
                            >
                              <button
                                onClick={() => setOpenFaqIdx(isOpen ? null : qIdx)}
                                className="w-full text-left p-5 flex items-center justify-between font-bold text-sm text-slate-800 hover:text-teal-750 focus:outline-none cursor-pointer transition-colors duration-150"
                              >
                                <span className="flex items-center gap-2.5">
                                  <FiHelpCircle className="w-4 h-4 text-teal-655 shrink-0" />
                                  {item.q}
                                </span>
                                <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                              </button>
                              
                              {isOpen && (
                                <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                                  {item.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );

              case "CTA":
                return (
                  <section key={block.id} className="py-20 bg-gradient-to-tr from-teal-900 to-emerald-950 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full filter blur-[100px] pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center gap-4 relative z-10">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
                        {data.title}
                      </h2>
                      <p className="text-sm sm:text-base text-teal-100 max-w-xl opacity-90 font-medium">
                        {data.description}
                      </p>
                      <a
                        href={data.buttonLink}
                        className="bg-teal-600 hover:bg-teal-550 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-teal-500/25 hover:scale-[1.02] mt-2 transition-all transform active:scale-95 cursor-pointer duration-200"
                      >
                        {data.buttonText}
                      </a>
                    </div>
                  </section>
                );

              case "Carousel":
                return (
                  <CarouselSection
                    key={block.id}
                    blockId={block.id}
                    slides={data.slides || []}
                  />
                );

              case "FeaturesGrid":
                return (
                  <section key={block.id} className="py-20 bg-slate-50 border-b border-slate-200/50">
                    <div className="max-w-7xl mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-850 tracking-tight font-display">
                          {data.title}
                        </h2>
                        {data.subtitle && (
                          <p className="text-sm text-slate-450 mt-2 font-medium">
                            {data.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {data.features?.map((feat: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white p-8 rounded-2xl border border-slate-200/80 hover:shadow-2xl hover:border-teal-500/20 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3"
                          >
                            <div className="w-10 h-10 rounded-xl bg-teal-55 border border-teal-250 flex items-center justify-center text-teal-700 font-extrabold shadow-sm shrink-0">
                              <span className="text-sm font-black">{idx + 1}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-805 text-base transition-colors group-hover:text-teal-750">
                              {feat.title}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {feat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );

              case "Pricing":
                return (
                  <section key={block.id} className="py-20 bg-white border-b border-slate-200/50">
                    <div className="max-w-7xl mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-850 tracking-tight font-display">
                          {data.title}
                        </h2>
                        {data.subtitle && (
                          <p className="text-sm text-slate-450 mt-2 font-medium">
                            {data.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {data.tiers?.map((tier: any, idx: number) => {
                          const isPromo = tier.name.toLowerCase().includes("enterprise") || tier.name.toLowerCase().includes("pro");
                          return (
                            <div
                              key={idx}
                              className={`p-8 rounded-3xl border flex flex-col gap-6 relative transition-all duration-350 hover:shadow-2xl hover:-translate-y-2 ${
                                isPromo
                                  ? "bg-gradient-to-tr from-slate-900 to-slate-950 text-white border-slate-800 hover:border-teal-500/25"
                                  : "bg-slate-50/50 border-slate-200 hover:border-teal-700/20"
                              }`}
                            >
                              {isPromo && (
                                <span className="absolute top-4 right-4 bg-teal-500 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                  Most Popular
                                </span>
                              )}
                              <div>
                                <h4 className={`text-base font-extrabold ${isPromo ? "text-teal-400" : "text-slate-805"}`}>
                                  {tier.name}
                                </h4>
                                <div className="flex items-baseline gap-1 mt-2">
                                  <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                                  <span className={`text-xs font-bold ${isPromo ? "text-slate-400" : "text-slate-500"}`}>
                                    {tier.billing}
                                  </span>
                                </div>
                              </div>
                              
                              <ul className="flex-1 flex flex-col gap-3">
                                {tier.features?.map((f: string, fIdx: number) => (
                                  <li key={fIdx} className="text-xs font-semibold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 animate-pulse" />
                                    <span className={isPromo ? "text-slate-350" : "text-slate-600"}>{f}</span>
                                  </li>
                                ))}
                              </ul>

                              <a
                                href="/login"
                                className={`w-full py-3 rounded-xl font-bold text-center text-sm transition-all transform active:scale-98 cursor-pointer duration-200 ${
                                  isPromo
                                    ? "bg-teal-500 hover:bg-teal-450 hover:shadow-lg hover:shadow-teal-500/25 text-white"
                                    : "bg-slate-850 hover:bg-slate-950 text-white hover:shadow-lg hover:shadow-slate-800/10"
                                }`}
                              >
                                Select Plan
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );

              case "Testimonials":
                return (
                  <section key={block.id} className="py-20 bg-slate-100/30 border-b border-slate-200/50">
                    <div className="max-w-7xl mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-850 tracking-tight font-display">
                          {data.title}
                        </h2>
                        {data.subtitle && (
                          <p className="text-sm text-slate-450 mt-2 font-medium">
                            {data.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.reviews?.map((rev: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white p-8 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4 hover:shadow-2xl hover:-translate-y-1.5 hover:border-teal-500/10 transition-all duration-300"
                          >
                            <p className="text-sm italic text-slate-650 leading-relaxed font-medium">
                              "{rev.quote}"
                            </p>
                            <div className="flex items-center justify-between mt-2 border-t pt-4 border-slate-100">
                              <div>
                                <h5 className="font-extrabold text-sm text-slate-805">{rev.author}</h5>
                                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{rev.role}</p>
                              </div>
                              <div className="flex gap-0.5 text-amber-400 text-xs">
                                {Array.from({ length: Number(rev.rating || 5) }).map((_, rIdx) => (
                                  <span key={rIdx}>★</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );

              case "Categories":
                return (
                  <section key={block.id} className="py-20 bg-white border-b border-slate-200/50">
                    <div className="max-w-7xl mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-850 tracking-tight font-display">
                          {data.title}
                        </h2>
                        <p className="text-sm text-slate-450 mt-2 font-medium">
                          {data.subtitle}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { name: "Website Development", count: "1,204 jobs", gradient: "from-teal-500 to-emerald-500" },
                          { name: "Graphic Designing", count: "892 jobs", gradient: "from-cyan-500 to-blue-500" },
                          { name: "Content Writer", count: "512 jobs", gradient: "from-amber-500 to-orange-500" },
                          { name: "Digital Marketing", count: "340 jobs", gradient: "from-indigo-500 to-purple-500" }
                        ].map((cat, idx) => (
                          <div
                            key={idx}
                            className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:-translate-y-1.5 hover:border-teal-500/15 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center gap-2"
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center font-black shadow-sm transform group-hover:scale-110 transition-transform duration-200`}>
                              {cat.name.charAt(0)}
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-805 mt-2 group-hover:text-teal-750 transition-colors">
                              {cat.name}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {cat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );

              default:
                return null;
            }
          })}
        </div>
      )}

      <Footer />
    </div>
  );
}
