"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiGift, FiCheckCircle, FiDollarSign, FiX } from "react-icons/fi";

interface BallParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

const BALL_COLORS = [
  "#10b981", // Emerald
  "#0d9488", // Teal
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export default function ReferralCelebrationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [bonusAmount, setBonusAmount] = useState<string>("2.00");
  const [particles, setParticles] = useState<BallParticle[]>([]);

  useEffect(() => {
    // Check if referral welcome trigger exists in localStorage or URL search params
    const trigger = localStorage.getItem("show_referral_welcome");
    const storedBonus = localStorage.getItem("referral_bonus_amount") || "2.00";
    setBonusAmount(storedBonus);

    if (trigger === "true" || (typeof window !== "undefined" && window.location.search.includes("ref_welcome=true"))) {
      setIsOpen(true);
      // Clean up trigger so it only pops up once
      localStorage.removeItem("show_referral_welcome");

      // Generate 28 explosion particles with random directions and sizes
      const newParticles: BallParticle[] = Array.from({ length: 30 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2; // Random 360 degree angle
        const distance = 90 + Math.random() * 160; // Radial distance from center
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 8 + Math.floor(Math.random() * 18), // Sizes between 8px and 26px
          color: BALL_COLORS[i % BALL_COLORS.length],
          delay: Math.random() * 0.25,
          duration: 1.2 + Math.random() * 0.8,
        };
      });
      setParticles(newParticles);

      // Auto-close after 4.5 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[2px]">
        {/* Particle Container Explosion originating from center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, 1.4, 1, 0.4, 0],
                opacity: [1, 1, 0.9, 0.5, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.175, 0.885, 0.32, 1.275], // Custom elastic spring bounce
              }}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 12px ${p.color}aa`,
              }}
              className="absolute rounded-full shrink-0"
            />
          ))}
        </div>

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Animated Glowing Icon Header */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.25, 1], rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30 relative"
          >
            <FiGift className="w-10 h-10 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
              $
            </span>
          </motion.div>

          {/* Title & Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 flex flex-col items-center"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <FiCheckCircle className="w-3 h-3 text-emerald-600" />
              Referral Applied
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign-Up Bonus Unlocked! 🎉
            </h3>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2 leading-relaxed"
          >
            Welcome to Buy2Lancer! Because you signed up via a friend's referral link, your <strong className="text-emerald-600 dark:text-emerald-400">${bonusAmount} Sign-Up Bonus</strong> is pending approval and will be credited to your wallet upon setup!
          </motion.p>

          {/* Bonus Amount Display Pill */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center shrink-0">
                <FiDollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Bonus</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">${bonusAmount} USD</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Verification Audit
            </span>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-2xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
            >
              Awesome! Got It
            </button>
          </motion.div>

          {/* Auto-closing Progress Bar at bottom */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 bg-emerald-500/80"
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
