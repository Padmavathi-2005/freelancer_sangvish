"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FiInstagram, FiLinkedin, FiDownload, FiArrowRight } from "react-icons/fi";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function DownloadPage() {
  const [links, setLinks] = useState({
    app_store_url: "https://apps.apple.com",
    google_play_url: "https://play.google.com",
    instagram_url: "https://instagram.com",
    linkedin_url: "https://linkedin.com",
    app_mockup_image: "",
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const storeLinks = { ...links };
          data.forEach((s: any) => {
            if (s.setting_key === "app_store_url") storeLinks.app_store_url = s.setting_value;
            if (s.setting_key === "google_play_url") storeLinks.google_play_url = s.setting_value;
            if (s.setting_key === "instagram_url") storeLinks.instagram_url = s.setting_value;
            if (s.setting_key === "linkedin_url") storeLinks.linkedin_url = s.setting_value;
            if (s.setting_key === "app_mockup_image") storeLinks.app_mockup_image = s.setting_value;
          });
          setLinks(storeLinks);
        }
      } catch (err) {
        console.error("Failed to load settings links:", err);
      }
    };
    fetchLinks();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 font-sans w-full max-w-full relative overflow-hidden">
      {/* Outer ambient glow and grid pattern spanning the entire screen */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] z-0 text-primary/[0.02]" />
      <div className="absolute top-[10%] left-[-10%] w-[45rem] h-[45rem] bg-primary/4 rounded-full filter blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45rem] h-[45rem] bg-secondary/3 rounded-full filter blur-[140px] pointer-events-none z-0" />

      <Header />

      {/* Hero section */}
      <section className="relative w-full py-20 px-4 text-center z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <span className="bg-primary/5 border border-primary/10 text-primary text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-1 select-none">
            Download Hub
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none font-display text-slate-800">
            Connect Everywhere
          </h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
            Get the Buy2Lancer mobile app and follow our official social network profiles to stay updated.
          </p>
        </div>
      </section>

      {/* Main Workspace content */}
      <main className="flex-1 w-full max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Mockup - Hidden on mobile/tablet, shown only on desktop */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
            {/* Ambient phone glow */}
            <div className="absolute w-72 h-72 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />
            
            {/* Styled CSS Smartphone Mockup */}
            <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 flex flex-col z-10">
              {/* Camera Notch */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
              </div>
              
              {/* Screen Content */}
              {links.app_mockup_image ? (
                <div className="flex-1 rounded-[2.3rem] overflow-hidden relative">
                  <img src={links.app_mockup_image.startsWith("/") && !links.app_mockup_image.startsWith("/public") ? `https://freelancer.sangvish.com${links.app_mockup_image}` : links.app_mockup_image} className="w-full h-full object-cover" alt="App Mockup Screen" />
                </div>
              ) : (
                <div className="flex-1 bg-gradient-to-b from-primary/10 to-slate-950 rounded-xl overflow-hidden p-6 flex flex-col justify-between items-center text-center relative pt-12">
                  <div className="w-full flex justify-between items-center text-slate-400 text-[10px] font-bold">
                    <span>9:41 AM</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3.5 h-2 border border-slate-400 rounded-sm p-0.5"><div className="w-full h-full bg-slate-400 rounded-[2px]" /></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 my-auto">
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-lg border border-slate-100">
                      <span className="font-extrabold text-2xl text-primary font-display">L</span>
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-black tracking-tight leading-none">Buy2Lancer</h3>
                      <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-1.5">App is Ready</p>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-2.5 mt-auto">
                    <div className="w-full bg-primary/20 border border-primary/30 rounded-xl py-2 px-3 text-[10px] text-primary font-bold flex items-center justify-between">
                      <span>Active contracts: 14</span>
                      <FiArrowRight />
                    </div>
                    <div className="w-full bg-white text-slate-900 rounded-xl py-3 px-4 text-xs font-black shadow-sm flex items-center justify-center gap-1.5 select-none font-sans">
                      <FiDownload />
                      <span>Download App</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Download Buttons & Socials inside separate cards */}
          <div className="col-span-1 lg:col-span-7 space-y-8 text-left">
            
            {/* Card 1: App downloads */}
            <div className="bg-white border border-slate-200/50 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-slate-250 transition-all duration-300 space-y-6">
              <div>
                <span className="bg-primary/5 border border-primary/10 text-primary text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-1 select-none">
                  Buy2Lancer App
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3 tracking-tight leading-tight select-none">
                  Download Mobile App
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                  Take your freelancing and client projects on the go. Available for both iOS and Android platforms.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {/* App Store button */}
                <a
                  href={links.app_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-950 text-white flex items-center gap-3.5 px-6 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950/20 select-none no-underline border-none active:scale-98"
                >
                  <FaApple className="w-8 h-8 text-white shrink-0" />
                  <div className="text-left leading-tight">
                    <p className="text-[9px] font-medium text-slate-405 uppercase tracking-wider m-0">Download on the</p>
                    <p className="text-sm font-black text-white m-0 font-sans">App Store</p>
                  </div>
                </a>

                {/* Google Play button */}
                <a
                  href={links.google_play_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-950 text-white flex items-center gap-3.5 px-6 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950/20 select-none no-underline border-none active:scale-98"
                >
                  <FaGooglePlay className="w-7 h-7 text-white shrink-0" />
                  <div className="text-left leading-tight">
                    <p className="text-[9px] font-medium text-slate-405 uppercase tracking-wider m-0">Get it on</p>
                    <p className="text-sm font-black text-white m-0 font-sans">Google Play</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Card 2: Social channels */}
            <div className="bg-white border border-slate-200/50 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-slate-250 transition-all duration-300 space-y-6">
              <div>
                <span className="bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-sm shrink-0 inline-block mb-1 select-none">
                  Social Channels
                </span>
                <h2 className="text-2xl font-black text-slate-800 mt-3 tracking-tight leading-tight select-none">
                  Connect With Us
                </h2>
                <p className="text-xs sm:text-sm text-slate-505 mt-2 font-medium leading-relaxed">
                  Join our communities on social channels to get news, tips, and chat with team members.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {/* Instagram */}
                <a
                  href={links.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center sm:justify-start gap-3 px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-xl hover:text-white hover:bg-gradient-to-tr hover:from-[#f9ce3f] hover:via-[#e1306c] hover:to-[#833ab4] hover:border-transparent text-slate-700 font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm no-underline font-sans active:scale-98"
                >
                  <FiInstagram className="w-5 h-5 shrink-0" />
                  <span>Instagram</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={links.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center sm:justify-start gap-3 px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-xl hover:text-white hover:bg-[#0077B5] hover:border-transparent text-slate-700 font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm no-underline font-sans active:scale-98"
                >
                  <FiLinkedin className="w-5 h-5 shrink-0" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
