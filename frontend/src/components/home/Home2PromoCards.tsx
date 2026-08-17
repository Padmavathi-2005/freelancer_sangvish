"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, API_BASE_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { FiChevronRight } from "react-icons/fi";
import { checkAndSwitchRole } from "@/utils/roleRedirect";

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/images/")) return url;
  const baseBackendUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export interface PromoCard {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  link_url: string;
  image_url: string;
  card_theme?: "slate" | "amber" | string;
}

const DEFAULT_CARDS: PromoCard[] = [
  {
    id: "card_1",
    eyebrow: "Explore the talent pool",
    title: "Post a New Project",
    description: "Give a boost to your project with the hand picked and verified talent.",
    link_url: "/dashboard/proposals?action=create",
    image_url: "/images/promo_card_man.png",
    card_theme: "slate"
  },
  {
    id: "card_2",
    eyebrow: "Meet the top brands",
    title: "Work on a Best Project",
    description: "Discover the top brand projects and boost your professional visibility.",
    link_url: "/projects",
    image_url: "/images/promo_card_woman.png",
    card_theme: "amber"
  }
];

export default function Home2PromoCards() {
  const { t } = useLanguage();
  const router = useRouter();
  const [cards, setCards] = useState<PromoCard[]>(DEFAULT_CARDS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const item = data.find((s: any) => s.setting_key === "home2_promo_cards");
          if (item && item.setting_value) {
            let val = item.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch (e) {}
            }
            if (Array.isArray(val) && val.length > 0) {
              setCards(val);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load promo cards settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleCardClick = async (e: React.MouseEvent, card: PromoCard, index: number) => {
    e.preventDefault();
    let isLoggedIn = false;
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        isLoggedIn = true;
      }
    }

    const defaultUrl = index === 0 ? "/dashboard/proposals?action=create" : "/projects";
    const targetUrl = card.link_url || defaultUrl;

    if (isLoggedIn) {
      if (index === 0) {
        const result = await checkAndSwitchRole("client", "/dashboard/proposals?action=create");
        router.push(result.targetUrl);
      } else {
        const result = await checkAndSwitchRole("freelancer", "/projects");
        router.push(result.targetUrl);
      }
    } else {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  if (!cards || cards.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => {
          const isSlate = card.card_theme === "slate" || index === 0;
          return (
            <div
              key={card.id || index}
              onClick={(e) => handleCardClick(e, card, index)}
              className={`group relative rounded-3xl p-6 sm:p-8 border border-dashed transition-all duration-300 shadow-xs hover:shadow-md flex items-center justify-between gap-4 overflow-hidden cursor-pointer ${
                isSlate
                  ? "bg-[#e2e8f0]/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-slate-400"
                  : "bg-[#eadecc]/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60 hover:border-amber-400"
              }`}
            >
              <div className="flex flex-col justify-center text-left max-w-xs z-10">
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 tracking-wide uppercase mb-1">
                  {t(card.eyebrow, card.eyebrow)}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight font-display mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t(card.title, card.title)}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {t(card.description, card.description)}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 z-10">
                {card.image_url && (
                  <div className="relative w-32 sm:w-40 h-28 sm:h-32 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={resolveImageUrl(card.image_url)}
                      alt={card.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-slate-700/80 group-hover:bg-emerald-500 group-hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs group-hover:scale-110 transition-all shrink-0">
                  <FiChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
