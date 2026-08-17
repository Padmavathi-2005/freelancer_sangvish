"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

export interface ChatMessage {
  id: string;
  side: "left" | "right";
  avatar: string;
  avatarColor: string;
  text: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { id: "1",  side: "left",  avatar: "SJ", avatarColor: "bg-gradient-to-br from-violet-500 to-indigo-600",  text: "Hi! I need a React developer for 3 months." },
  { id: "2",  side: "right", avatar: "DM", avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "Sure! I specialize in React & Next.js 🚀" },
  { id: "3",  side: "left",  avatar: "SJ", avatarColor: "bg-gradient-to-br from-violet-500 to-indigo-600",  text: "E-commerce with real-time updates." },
  { id: "4",  side: "right", avatar: "DM", avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "Perfect, available immediately!" },
  { id: "5",  side: "left",  avatar: "SJ", avatarColor: "bg-gradient-to-br from-violet-500 to-indigo-600",  text: "What's your hourly rate?" },
  { id: "6",  side: "right", avatar: "DM", avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "$85/hr. Starting this Monday." },
  { id: "7",  side: "left",  avatar: "SJ", avatarColor: "bg-gradient-to-br from-violet-500 to-indigo-600",  text: "Sounds good, sending contract now." },
  { id: "8",  side: "right", avatar: "DM", avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "Got it! Signed & ready ✅" },
  { id: "9",  side: "left",  avatar: "SJ", avatarColor: "bg-gradient-to-br from-violet-500 to-indigo-600",  text: "Milestone 1 approved. Payment released 💸" },
  { id: "10", side: "right", avatar: "DM", avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "Thank you! Onto Milestone 2 🎯" },
];

const CHAT_TRANSLATIONS: Record<string, Record<string, string>> = {
  AR: {
    "Hi! I need a React developer for 3 months.": "مرحباً! أحتاج إلى مطور React لمدة 3 أشهر.",
    "Sure! I specialize in React & Next.js 🚀": "بالتأكيد! أنا متخصص في React و Next.js 🚀",
    "E-commerce with real-time updates.": "متجر إلكتروني مع تحديثات مباشرة.",
    "Perfect, available immediately!": "ممتاز، متاح فوراً!",
    "What's your hourly rate?": "ما هو سعرك بالساعة؟",
    "$85/hr. Starting this Monday.": "85$/ساعة. سأبدأ هذا الاثنين.",
    "Sounds good, sending contract now.": "يبدو جيداً، سأرسل العقد الآن.",
    "Got it! Signed & ready ✅": "تم الاستلام! تم التوقيع والجاهزية ✅",
    "Milestone 1 approved. Payment released 💸": "تمت الموافقة على المرحلة الأولى. تم تحرير الدفعة 💸",
    "Thank you! Onto Milestone 2 🎯": "شكراً لك! ننتقل إلى المرحلة الثانية 🎯",
  },
  FR: {
    "Hi! I need a React developer for 3 months.": "Salut ! J'ai besoin d'un développeur React pour 3 mois.",
    "Sure! I specialize in React & Next.js 🚀": "Bien sûr ! Je suis spécialisé en React & Next.js 🚀",
    "E-commerce with real-time updates.": "E-commerce avec mises à jour en temps réel.",
    "Perfect, available immediately!": "Parfait, disponible immédiatement !",
    "What's your hourly rate?": "Quel est votre tarif horaire ?",
    "$85/hr. Starting this Monday.": "85 $/h. Je commence ce lundi.",
    "Sounds good, sending contract now.": "Parfait, j'envoie le contrat maintenant.",
    "Got it! Signed & ready ✅": "Reçu ! Signé & prêt ✅",
    "Milestone 1 approved. Payment released 💸": "Étape 1 approuvée. Paiement libéré 💸",
    "Thank you! Onto Milestone 2 🎯": "Merci ! En route pour l'Étape 2 🎯",
  },
  DE: {
    "Hi! I need a React developer for 3 months.": "Hallo! Ich brauche einen React-Entwickler für 3 Monate.",
    "Sure! I specialize in React & Next.js 🚀": "Sicher! Ich bin auf React & Next.js spezialisiert 🚀",
    "E-commerce with real-time updates.": "E-Commerce mit Echtzeit-Updates.",
    "Perfect, available immediately!": "Perfekt, sofort verfügbar!",
    "What's your hourly rate?": "Was ist Ihr Stundensatz?",
    "$85/hr. Starting this Monday.": "85 $/Std. Beginnend diesen Montag.",
    "Sounds good, sending contract now.": "Klingt gut, ich sende den Vertrag jetzt.",
    "Got it! Signed & ready ✅": "Erhalten! Unterzeichnet & bereit ✅",
    "Milestone 1 approved. Payment released 💸": "Meilenstein 1 genehmigt. Zahlung freigegeben 💸",
    "Thank you! Onto Milestone 2 🎯": "Vielen Dank! Weiter zu Meilenstein 2 🎯",
  }
};

const MAX_VISIBLE = 4;

const BALL_COLORS = [
  "bg-violet-500 shadow-violet-500/50",
  "bg-emerald-500 shadow-emerald-500/50",
  "bg-amber-400 shadow-amber-400/50",
  "bg-pink-500 shadow-pink-500/50",
  "bg-sky-400 shadow-sky-400/50",
  "bg-indigo-500 shadow-indigo-500/50",
  "bg-teal-400 shadow-teal-400/50",
  "bg-rose-500 shadow-rose-500/50",
  "bg-cyan-400 shadow-cyan-400/50",
  "bg-purple-500 shadow-purple-500/50",
  "bg-fuchsia-500 shadow-fuchsia-500/50",
  "bg-emerald-400 shadow-emerald-400/50",
];

const VARIED_SIZES = [6, 20, 10, 26, 8, 16, 22, 7, 14, 24, 9, 18, 12, 25, 8, 15];

const BALL_BURSTS = Array.from({ length: 16 }).map((_, i) => {
  const angle = (i * 360) / 16 + ((i * 17) % 25 - 12);
  const distance = 40 + ((i * 13) % 45);
  const rad = (angle * Math.PI) / 180;
  const x = Math.round(Math.cos(rad) * distance);
  const y = Math.round(Math.sin(rad) * distance);
  const size = VARIED_SIZES[i % VARIED_SIZES.length];
  return { x, y, size, colorClass: BALL_COLORS[i % BALL_COLORS.length] };
});

function TypingBubble({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <div className={`flex items-end gap-2 ${side === "right" ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm`}>
        {side === "left" ? "SJ" : "DM"}
      </div>
      <div className="bg-white/90 dark:bg-zinc-800/90 rounded-2xl px-3.5 py-2.5 shadow-sm border border-slate-200/60 dark:border-zinc-700/60">
        <div className="flex items-center gap-1 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 inline-block"
              style={{
                animationName: "chatBounce",
                animationDuration: "1.1s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, fadeOut, translatedText }: { msg: ChatMessage; fadeOut: boolean; translatedText: string }) {
  const isRight = msg.side === "right";
  return (
    <div
      className={`flex items-end gap-2 transition-all duration-400 ${isRight ? "flex-row-reverse" : "flex-row"} ${
        fadeOut ? "opacity-0 -translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div className={`w-7 h-7 rounded-full ${msg.avatarColor} flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm`}>
        {msg.avatar}
      </div>
      <div
        className={`max-w-[170px] px-3 py-2 rounded-2xl text-[11px] font-semibold shadow-sm leading-relaxed ${
          isRight
            ? "bg-primary text-white rounded-br-sm text-right"
            : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200/70 dark:border-zinc-700/60 rounded-bl-sm text-left"
        }`}
        style={{ unicodeBidi: "plaintext" }}
      >
        {translatedText}
      </div>
    </div>
  );
}

function ScatteredBalls({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {BALL_BURSTS.map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${b.colorClass} shadow-md`}
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationName: "ballScatter",
            animationDuration: "1.2s",
            animationTimingFunction: "cubic-bezier(0.15, 0.85, 0.35, 1.2)",
            animationFillMode: "forwards",
            ["--tx" as any]: `${b.x}px`,
            ["--ty" as any]: `${b.y}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home2ChatWidget() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [window_, setWindow_] = useState<{ msg: ChatMessage; fadeOut: boolean }[]>([]);
  const [typingFor, setTypingFor] = useState<ChatMessage | null>(null);
  const [windowOpacity, setWindowOpacity] = useState(1);
  const [phase, setPhase] = useState<"running" | "fadeOut" | "scatter" | "done">("running");
  const [restartKey, setRestartKey] = useState(0);

  const getTranslatedMsg = (text: string) => {
    const langCode = (lang || "EN").toUpperCase();
    if (langCode === "EN") return t(text, text);
    return CHAT_TRANSLATIONS[langCode]?.[text] || t(text, text);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const item = data.find((s: any) => s.setting_key === "home2_chat_messages");
          if (item?.setting_value) {
            let val = item.setting_value;
            if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
            if (Array.isArray(val) && val.length > 0) setMessages(val);
          }
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      setWindow_([]);
      setTypingFor(null);
      setWindowOpacity(1);
      setPhase("running");

      await delay(600);

      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return;
        const msg = messages[i];

        setTypingFor(msg);
        await delay(1100);
        if (cancelled) return;

        setTypingFor(null);
        setWindow_((prev) => {
          const next = [...prev];
          if (next.length >= MAX_VISIBLE) {
            next[0] = { ...next[0], fadeOut: true };
          }
          next.push({ msg, fadeOut: false });
          return next;
        });

        await delay(300);
        setWindow_((prev) => prev.filter((e) => !e.fadeOut).slice(-MAX_VISIBLE));
        await delay(1100);
      }

      if (cancelled) return;

      await delay(400);
      setPhase("fadeOut");
      setWindowOpacity(0);
      await delay(400);

      setPhase("scatter");
      await delay(1300);

      if (cancelled) return;
      setPhase("done");
      await delay(600);

      if (!cancelled) setRestartKey((k) => k + 1);
    };

    run();
    return () => { cancelled = true; };
  }, [restartKey, messages]);

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes ballScatter {
          0% {
            transform: translate(0, 0) scale(0.2);
            opacity: 0;
          }
          25% {
            opacity: 1;
            transform: translate(calc(var(--tx) * 0.4), calc(var(--ty) * 0.4)) scale(1.3);
          }
          70% {
            opacity: 0.9;
            transform: translate(var(--tx), var(--ty)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(var(--tx) * 1.2), calc(var(--ty) * 1.2)) scale(0.3);
          }
        }
      `}</style>

      <div className="w-full max-w-[240px] h-[280px] flex flex-col justify-end gap-2.5 select-none pointer-events-none relative overflow-hidden p-1">

        {/* Scattered colorful balls at the end */}
        <ScatteredBalls visible={phase === "scatter"} />

        {/* Chat messages sliding window */}
        <div
          className="flex flex-col justify-end gap-2.5 transition-opacity duration-400"
          style={{ opacity: phase === "done" || phase === "scatter" ? 0 : windowOpacity }}
        >
          {window_.map((entry) => (
            <MessageBubble
              key={entry.msg.id}
              msg={entry.msg}
              fadeOut={entry.fadeOut}
              translatedText={getTranslatedMsg(entry.msg.text)}
            />
          ))}
          {typingFor && (
            <TypingBubble side={typingFor.side} color={typingFor.avatarColor} />
          )}
        </div>
      </div>
    </>
  );
}
