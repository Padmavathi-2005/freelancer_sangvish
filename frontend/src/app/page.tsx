"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/config/api";
import Home1 from "@/components/home/Home1";
import Home2 from "@/components/home/Home2";
import Home3 from "@/components/home/Home3";

function MainHomeContent() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get("preset");
  const [homeLayout, setHomeLayout] = useState<string>("home_1");

  useEffect(() => {
    // If preset query param explicitly provided, override layout immediately
    if (presetParam === "1" || presetParam === "home_1") {
      setHomeLayout("home_1");
      return;
    }
    if (presetParam === "2" || presetParam === "home_2") {
      setHomeLayout("home_2");
      return;
    }
    if (presetParam === "3" || presetParam === "home_3") {
      setHomeLayout("home_3");
      return;
    }

    // Otherwise fetch admin setting from API
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            let val = setting.setting_value;
            if (typeof val === "string") {
              try {
                const parsed = JSON.parse(val);
                if (typeof parsed === "string") val = parsed;
              } catch (e) {}
            }
            if (setting.setting_key === "default_home_page" && val) {
              setHomeLayout(val);
            }
          });
        }
      } catch (err) {
        console.error("Failed to load home page setting:", err);
      }
    };
    fetchSettings();
  }, [presetParam]);

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const res = await fetch(`${API_URL}/seo?route=/`);
        if (res.ok) {
          const seo = await res.json();
          if (seo.meta_title) document.title = seo.meta_title;
          
          let descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute("content", seo.meta_description || "");
          } else {
            descMeta = document.createElement("meta");
            descMeta.setAttribute("name", "description");
            descMeta.setAttribute("content", seo.meta_description || "");
            document.head.appendChild(descMeta);
          }
        }
      } catch (err) {
        console.error("Failed to load page SEO dynamic metadata:", err);
      }
    };
    fetchSEO();
  }, []);

  if (homeLayout === "home_2" || homeLayout === "2") {
    return <Home2 />;
  }

  if (homeLayout === "home_3" || homeLayout === "3") {
    return <Home3 />;
  }

  return <Home1 />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-slate-50 justify-center items-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    }>
      <MainHomeContent />
    </Suspense>
  );
}

