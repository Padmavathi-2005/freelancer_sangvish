"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { API_URL, API_BASE_URL } from "@/config/api";
import { FiChevronLeft, FiChevronRight, FiExternalLink } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

export interface Home3HeroSlide {
  id: string;
  title: string;
  highlight_text: string;
  subtitle: string;
  primary_btn_text: string;
  primary_btn_link: string;
  secondary_btn_text: string;
  secondary_btn_link: string;
  image_1: string;
  image_2: string;
  image_1_bg?: string;
  image_2_bg?: string;
}

export const DEFAULT_HOME3_HERO_SLIDES: Home3HeroSlide[] = [
  {
    id: "slide-1",
    title: "Thrive in the World of Freelance Excellence Marketplace!",
    highlight_text: "World of Freelance",
    subtitle: "Flourish in a thriving freelance ecosystem dedicated to excellence and limitless opportunities.",
    primary_btn_text: "Try it Free",
    primary_btn_link: "/talent",
    secondary_btn_text: "Learn More",
    secondary_btn_link: "/gigs",
    image_1: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    image_2: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80",
    image_1_bg: "#0d9488",
    image_2_bg: "#eab308"
  },
  {
    id: "slide-2",
    title: "Hire Vetted Experts & Scale Enterprise Projects Faster!",
    highlight_text: "Scale Enterprise Projects",
    subtitle: "Connect with top 3% global freelancers and manage milestone deliverables seamlessly.",
    primary_btn_text: "Explore Talent",
    primary_btn_link: "/talent",
    secondary_btn_text: "Post a Project",
    secondary_btn_link: "/projects",
    image_1: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
    image_2: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    image_1_bg: "#059669",
    image_2_bg: "#3b82f6"
  },
  {
    id: "slide-3",
    title: "Turn Ideas Into Reality With Instant Service Gigs!",
    highlight_text: "Instant Service Gigs",
    subtitle: "Order fixed-price custom services with guaranteed buyer protection and fast delivery.",
    primary_btn_text: "Browse Gigs",
    primary_btn_link: "/gigs",
    secondary_btn_text: "Join as Freelancer",
    secondary_btn_link: "/register",
    image_1: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
    image_2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    image_1_bg: "#7c3aed",
    image_2_bg: "#f97316"
  }
];

const AUTO_PLAY_DELAY = 6000;

const LUXURY_SPRING_PHYSICS = {
  type: "spring" as const,
  stiffness: 110,
  damping: 25,
  mass: 1.2
};

const resolveImgUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.replace(/^\/?public\//, "/");
  const baseBackend = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackend}${clean.startsWith("/") ? "" : "/"}${clean}`;
};

export default function Home3Hero() {
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";

  const [slides, setSlides] = useState<Home3HeroSlide[]>(DEFAULT_HOME3_HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [exitDistance, setExitDistance] = useState(1400);

  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Single Motion Value Source of Truth: dragX
  const dragX = useMotionValue(0);

  // Calculate full viewport exit distance on mount & resize
  useEffect(() => {
    const updateExitDist = () => {
      if (typeof window !== "undefined") {
        setExitDistance(Math.max(window.innerWidth + 300, 1400));
      }
    };
    updateExitDist();
    window.addEventListener("resize", updateExitDist);
    return () => window.removeEventListener("resize", updateExitDist);
  }, []);

  // CARD 1 (Active Front Card):
  const card1Rotate = useTransform(dragX, (value) => {
    const factor = isRtl ? -1 : 1;
    const progress = value / exitDistance;
    return progress * factor;
  });

  const card1Scale = useTransform(dragX, (value) => {
    const progress = Math.abs(value) / exitDistance;
    return 1 - progress * 0.02;
  });

  // CARD 2 (Second Card):
  const card2X = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    const startX = isRtl ? -100 : 100;
    return startX * (1 - progress);
  });

  const card2Scale = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    return 0.94 + progress * 0.06;
  });

  const card2Opacity = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    return 0.85 + progress * 0.15;
  });

  // CARD 3 (Third Card):
  const card3X = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    const startX = isRtl ? -180 : 180;
    const midX = isRtl ? -100 : 100;
    return startX * (1 - progress) + midX * progress;
  });

  const card3Scale = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    return 0.90 + progress * 0.04;
  });

  const card3Opacity = useTransform(dragX, (value) => {
    const progress = Math.min(Math.max(Math.abs(value) / exitDistance, 0), 1);
    return 0.65 + progress * 0.20;
  });

  // Check accessibility setting prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  // Fetch dynamic slides from site settings
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const slideSetting = data.find((s: any) => s.setting_key === "home3_hero_slides");
          if (slideSetting && slideSetting.setting_value) {
            let parsed = slideSetting.setting_value;
            if (typeof parsed === "string") {
              try {
                parsed = JSON.parse(parsed);
              } catch (e) {}
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSlides(parsed);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load home3 hero slides from API:", err);
      }
    };
    fetchSlides();
  }, []);

  // Helper to pause autoplay temporarily and resume after 6s of inactivity
  const triggerInteractionPause = () => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, AUTO_PLAY_DELAY);
  };

  // Unified AutoPlay Timer
  useEffect(() => {
    if (isPaused || isAnimating || prefersReducedMotion || slides.length <= 1) return;

    const intervalId = setInterval(() => {
      nextSlide();
    }, AUTO_PLAY_DELAY);

    return () => clearInterval(intervalId);
  }, [isPaused, isAnimating, prefersReducedMotion, slides.length, currentIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        triggerInteractionPause();
        prevSlide();
      } else if (e.key === "ArrowRight") {
        triggerInteractionPause();
        nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, isAnimating, currentIndex]);

  const total = slides.length;
  const card1Index = currentIndex;
  const card2Index = (currentIndex + 1) % total;
  const card3Index = (currentIndex + 2) % total;

  // Unified nextSlide transition: ONLY updates slide index inside onComplete after card has slid COMPLETELY OUTSIDE the viewport
  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    animate(dragX, isRtl ? exitDistance : -exitDistance, {
      ...LUXURY_SPRING_PHYSICS,
      onComplete: () => {
        setCurrentIndex((prev) => (prev + 1) % total);
        dragX.set(0);
        setIsAnimating(false);
      }
    });
  };

  // Unified prevSlide transition
  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    animate(dragX, isRtl ? -exitDistance : exitDistance, {
      ...LUXURY_SPRING_PHYSICS,
      onComplete: () => {
        setCurrentIndex((prev) => (prev - 1 + total) % total);
        dragX.set(0);
        setIsAnimating(false);
      }
    });
  };

  const handleDragStart = () => {
    triggerInteractionPause();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    triggerInteractionPause();
    const currentX = dragX.get();
    const velocity = info.velocity.x;

    const shouldGoNext = isRtl
      ? (currentX > 150 || velocity > 350)
      : (currentX < -150 || velocity < -350);

    const shouldGoPrev = isRtl
      ? (currentX < -150 || velocity < -350)
      : (currentX > 150 || velocity > 350);

    if (shouldGoNext) {
      setIsAnimating(true);
      animate(dragX, isRtl ? exitDistance : -exitDistance, {
        ...LUXURY_SPRING_PHYSICS,
        onComplete: () => {
          setCurrentIndex((prev) => (prev + 1) % total);
          dragX.set(0);
          setIsAnimating(false);
        }
      });
    } else if (shouldGoPrev) {
      setIsAnimating(true);
      animate(dragX, isRtl ? -exitDistance : exitDistance, {
        ...LUXURY_SPRING_PHYSICS,
        onComplete: () => {
          setCurrentIndex((prev) => (prev - 1 + total) % total);
          dragX.set(0);
          setIsAnimating(false);
        }
      });
    } else {
      // If drag < 45%, smoothly animate back to 0px
      animate(dragX, 0, LUXURY_SPRING_PHYSICS);
    }
  };

  const renderTitle = (title: string, highlight: string) => {
    if (!highlight || !title.includes(highlight)) {
      return <span style={{ unicodeBidi: "plaintext" }}>{title}</span>;
    }
    const parts = title.split(highlight);
    return (
      <span style={{ unicodeBidi: "plaintext" }}>
        {parts[0]}
        <span className="text-white relative inline-block pb-1 border-b-4 border-emerald-400 font-black mx-1">
          {highlight}
        </span>
        {parts.slice(1).join(highlight)}
      </span>
    );
  };

  const slide1 = slides[card1Index] || DEFAULT_HOME3_HERO_SLIDES[0];
  const slide2 = slides[card2Index] || DEFAULT_HOME3_HERO_SLIDES[1] || slide1;
  const slide3 = slides[card3Index] || DEFAULT_HOME3_HERO_SLIDES[2] || slide1;

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-slate-100 dark:bg-zinc-950 overflow-hidden">
      
      {/* 3-Card Table Stack Outer Container */}
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={triggerInteractionPause}
        className="w-full relative min-h-[480px] sm:min-h-[520px] flex items-center justify-center select-none"
      >
        <div className="relative w-full h-full min-h-[480px] sm:min-h-[520px] flex items-center justify-center">
          
          {/* CARD 3 (Behind Card 2 - lerp: 180px -> 100px, 0.90 -> 0.94, 0.65 -> 0.85, z-index 1) */}
          <motion.div
            key={`card-3-${slide3.id || card3Index}`}
            style={{
              x: card3X,
              scale: card3Scale,
              opacity: card3Opacity,
              zIndex: 1
            }}
            className="absolute inset-0 w-full h-full shrink-0 bg-[#1b2337] rounded-[24px] sm:rounded-[32px] p-6 sm:p-12 lg:p-14 border border-slate-800/90 shadow-lg flex flex-col justify-between origin-center overflow-hidden transform-gpu pointer-events-none"
          >
            <CardInnerContent slide={slide3} renderTitle={renderTitle} />
          </motion.div>

          {/* CARD 2 (Behind Card 1 - lerp: 100px -> 0px, 0.94 -> 1, 0.85 -> 1, z-index 2) */}
          <motion.div
            key={`card-2-${slide2.id || card2Index}`}
            style={{
              x: card2X,
              scale: card2Scale,
              opacity: card2Opacity,
              zIndex: 2
            }}
            className="absolute inset-0 w-full h-full shrink-0 bg-[#1b2337] rounded-[24px] sm:rounded-[32px] p-6 sm:p-12 lg:p-14 border border-slate-800/90 shadow-xl flex flex-col justify-between origin-center overflow-hidden transform-gpu pointer-events-none"
          >
            <CardInnerContent slide={slide2} renderTitle={renderTitle} />
          </motion.div>

          {/* CARD 1 (Active Front Card - lerp: 0 -> -exitDistance, 1 -> 0.98, rotate 0 -> -1°, z-index 3) */}
          <motion.div
            key={`card-1-${slide1.id || card1Index}`}
            style={{
              x: dragX,
              scale: card1Scale,
              rotate: card1Rotate,
              zIndex: 3
            }}
            drag={isAnimating ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileHover={isAnimating ? {} : { scale: 1.015 }}
            className="absolute inset-0 w-full h-full shrink-0 bg-[#1b2337] rounded-[24px] sm:rounded-[32px] p-6 sm:p-12 lg:p-14 border border-slate-800/90 shadow-2xl flex flex-col justify-between origin-center overflow-hidden transform-gpu cursor-grab active:cursor-grabbing"
          >
            <CardInnerContent slide={slide1} renderTitle={renderTitle} />
          </motion.div>

        </div>
      </div>


    </section>
  );
}

// Inner Layout Component for Card Content
function CardInnerContent({
  slide,
  renderTitle
}: {
  slide: Home3HeroSlide;
  renderTitle: (title: string, highlight: string) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const translatedTitle = t(slide.title, slide.title);
  const translatedHighlight = t(slide.highlight_text, slide.highlight_text);
  const translatedSubtitle = t(slide.subtitle, slide.subtitle);
  const translatedPrimaryBtn = t(slide.primary_btn_text || "Try it Free", slide.primary_btn_text || "Try it Free");
  const translatedSecondaryBtn = t(slide.secondary_btn_text || "Learn More", slide.secondary_btn_text || "Learn More");

  return (
    <>
      {/* Subtle grid accent background */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Card Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
        
        {/* Left Column: Title, Subtitle, CTA Buttons */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.16] tracking-tight font-display max-w-2xl">
            {renderTitle(translatedTitle, translatedHighlight)}
          </h1>

          <p className="text-slate-200 text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-xl">
            {translatedSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href={slide.primary_btn_link || "/talent"}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-sm sm:text-base px-7 py-3.5 rounded-xl transition duration-200 shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer no-underline border-none z-20"
            >
              {translatedPrimaryBtn}
            </a>
            <a
              href={slide.secondary_btn_link || "/gigs"}
              className="border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-xl transition duration-200 flex items-center gap-2 active:scale-95 cursor-pointer no-underline z-20"
            >
              <span>{translatedSecondaryBtn}</span>
              <FiExternalLink className="w-4 h-4 text-slate-300" />
            </a>
          </div>
        </div>

        {/* Right Column: Dual Overlapping Cutout Images + Shapes */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end py-4 lg:py-0">
          <div className="relative flex items-center justify-center">
            
            {/* Floating Decorative Accents */}
            <div className="absolute -top-6 right-6 z-20 pointer-events-none animate-bounce">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>

            <div className="absolute top-10 -left-6 z-20 w-4 h-4 rounded-full border-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-4 left-1/3 z-20 w-3 h-3 rounded-full bg-teal-400 pointer-events-none" />

            {/* Image 1: Left Circle + Person */}
            <div className="relative shrink-0 z-10">
              <div 
                style={{ backgroundColor: slide.image_1_bg || "#0d9488" }} 
                className="w-48 h-48 sm:w-60 sm:h-60 rounded-full relative shadow-2xl overflow-hidden flex items-end justify-center border-4 border-[#1b2337] transition-transform duration-500 hover:scale-105"
              >
                <img
                  src={resolveImgUrl(slide.image_1)}
                  alt="Freelancer 1"
                  className="w-full h-[115%] object-cover object-top shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
            </div>

            {/* Image 2: Right Circle + Person (Overlapping) */}
            <div className="relative shrink-0 z-20 -ml-14 sm:-ml-20">
              <div 
                style={{ backgroundColor: slide.image_2_bg || "#eab308" }} 
                className="w-52 h-52 sm:w-64 sm:h-64 rounded-full relative shadow-2xl overflow-hidden flex items-end justify-center border-4 border-[#1b2337] transition-transform duration-500 hover:scale-105"
              >
                <img
                  src={resolveImgUrl(slide.image_2)}
                  alt="Freelancer 2"
                  className="w-full h-[115%] object-cover object-top shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
