"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiX, FiSend, FiMaximize, FiMinimize } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import { API_URL, API_BASE_URL } from "@/config/api";

interface CheckoutWidgetProps {
  gigId: number;
  title: string;
  price: number;
  currencyId?: number;
  onSuccess: (msg: string) => void;
}

function CheckoutWidget({ gigId, title, price, currencyId = 1, onSuccess }: CheckoutWidgetProps) {
  const [requirements, setRequirements] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "stripe">("wallet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!requirements.trim()) {
      setError("Please describe your project requirements.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to place an order.");
        setLoading(false);
        return;
      }

      // Step 1: Create application
      const applyRes = await fetch(`${API_URL}/freelancer/client/gigs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: gigId,
          requirements: `[AI Chatbot Checkout Order]\n\n${requirements.trim()}`,
          price: price,
          currency_id: currencyId,
          milestones: []
        })
      });

      const applyData = await applyRes.json();
      if (!applyRes.ok) {
        throw new Error(applyData.message || "Failed to create gig order.");
      }

      const applicationId = applyData.application.application_id;

      // Step 2: Transition status to 'Accepted' immediately so payment is allowed
      const acceptRes = await fetch(`${API_URL}/freelancer/gigs/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Accepted"
        })
      });

      if (!acceptRes.ok) {
        const acceptData = await acceptRes.json().catch(() => ({}));
        throw new Error(acceptData.message || "Failed to accept gig order status.");
      }

      // Step 3: Trigger payment
      if (payMethod === "stripe") {
        const stripeRes = await fetch(`${API_URL}/payments/stripe/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            application_id: applicationId,
            amount_usd: price,
            label: `AI Chatbot Escrow - ${title}`
          })
        });

        const stripeData = await stripeRes.json();
        if (stripeRes.ok && stripeData.url) {
          // Redirect user to Stripe payment session
          window.location.href = stripeData.url;
        } else {
          throw new Error(stripeData.message || "Failed to create Stripe payment session.");
        }
      } else {
        // Direct Wallet Payment
        const payRes = await fetch(`${API_URL}/payments/wallet/pay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            application_id: applicationId,
            method: "wallet"
          })
        });

        const payData = await payRes.json();
        if (payRes.ok) {
          setSuccess(true);
          onSuccess(`Order placed and paid for via wallet! Contract is now active.`);
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/dashboard/orders";
            }
          }, 1000);
        } else {
          throw new Error(payData.message || "Wallet payment failed. Please make sure you have sufficient funds.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during order checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mt-2 text-center select-none">
        <i className="fa-solid fa-circle-check text-emerald-500 text-2xl mb-2"></i>
        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">Payment Confirmed!</h4>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
          Your order has been placed and escrow funds have been secured. The contract is now active.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 mt-2 shadow-inner select-none">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="text-left">
          <span className="text-[9px] font-black uppercase bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-150 dark:border-teal-900/50 px-2 py-0.5 rounded">
            AI Escrow Checkout
          </span>
          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-1.5 leading-snug">{title}</h4>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-black text-teal-650 dark:text-teal-400">${parseFloat(price.toString()).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg text-[10px] font-bold mb-3 text-left">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1 text-left">
            Project Requirements
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe what you need the freelancer to deliver..."
            rows={2}
            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-850 dark:text-white focus:outline-none focus:border-teal-700"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 text-left">Payment Method</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPayMethod("wallet")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer border ${
                payMethod === "wallet"
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white dark:bg-zinc-850 text-slate-650 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => setPayMethod("stripe")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer border ${
                payMethod === "stripe"
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white dark:bg-zinc-850 text-slate-650 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
              }`}
            >
              Stripe Card
            </button>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-teal-750 hover:bg-teal-850 text-white font-black text-xs py-2 rounded-xl border-none shadow-md cursor-pointer transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              Processing...
            </>
          ) : (
            `Proceed & Fund Escrow ($${parseFloat(price.toString()).toFixed(2)})`
          )}
        </button>
      </div>
    </div>
  );
}

const resolveChatLogoUrl = (url: string) => {
  if (!url) return "";
  let cleanUrl = url;
  const publicIdx = cleanUrl.indexOf("/public/");
  if (publicIdx !== -1) {
    cleanUrl = cleanUrl.substring(publicIdx);
  }
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }
  const baseBackendUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackendUrl}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};

export default function AIChatbot() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [siteLogo, setSiteLogo] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteFavicon, setSiteFavicon] = useState("");
  const [siteChatbotAvatar, setSiteChatbotAvatar] = useState("");
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [btnImageFailed, setBtnImageFailed] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<any>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openLoginModal } = useAuthModal();

  // Set mounted true on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load site brand logo/name on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteLogo(localStorage.getItem("cached_site_logo") || "");
      setSiteName(localStorage.getItem("cached_site_name") || "");
      setSiteFavicon(localStorage.getItem("cached_site_favicon") || "");
      setSiteChatbotAvatar(localStorage.getItem("cached_site_chatbot_avatar") || "");
    }
    const fetchBrand = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "site_settings") {
              let val = setting.setting_value;
              if (typeof val === "string") {
                try { val = JSON.parse(val); } catch (e) {}
              }
              if (val?.site_logo) {
                setSiteLogo(val.site_logo);
                localStorage.setItem("cached_site_logo", val.site_logo);
              }
              if (val?.site_logo_dark) {
                localStorage.setItem("cached_site_logo_dark", val.site_logo_dark);
              }
              if (val?.site_name) {
                setSiteName(val.site_name);
                localStorage.setItem("cached_site_name", val.site_name);
              }
              if (val?.site_favicon) {
                setSiteFavicon(val.site_favicon);
                localStorage.setItem("cached_site_favicon", val.site_favicon);
              }
              if (val?.site_chatbot_avatar || val?.chatbot_avatar) {
                const botAvatar = val.site_chatbot_avatar || val.chatbot_avatar;
                setSiteChatbotAvatar(botAvatar);
                localStorage.setItem("cached_site_chatbot_avatar", botAvatar);
              }
            }
          });
        }
      } catch (err) {
        console.error("Failed to load brand logo in AI chatbot:", err);
      }
    };
    fetchBrand();
  }, []);

  // Load auth state
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };
    
    checkAuth();
    // Periodically sync auth status
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active user context details when logged in
  useEffect(() => {
    if (!isAuthenticated) {
      setUserContext(null);
      return;
    }

    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch user profile
        const profRes = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!profRes.ok) return;
        const profData = await profRes.json();

        // Fetch wallet balance
        const walletRes = await fetch(`${API_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let balance = 0.00;
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          balance = parseFloat(walletData.balance) || 0.00;
        }

        // Map into unified context object
        setUserContext({
          isAuthenticated: true,
          name: profData.first_name ? `${profData.first_name} ${profData.last_name || ""}`.trim() : "Member",
          walletBalance: balance,
          subscriptionPlan: profData.membership_name || "Free Tier",
          postingCredits: profData.project_credits ?? 0,
          biddingCredits: profData.proposal_credits ?? 0,
          isSubscribed: !!profData.membership_id
        });
      } catch (err: any) {
        // Suppress network/fetch failures to prevent spamming the browser console when backend restarts
        if (err instanceof TypeError || (err && err.message && err.message.toLowerCase().includes("fetch"))) {
          console.warn("AI Chatbot user context: Backend server is temporarily unreachable.");
        } else {
          console.error("Failed to load AI chatbot user context:", err);
        }
      }
    };

    fetchUserStats();
    // Refresh user context every 8 seconds to reflect new purchases/balances
    const interval = setInterval(fetchUserStats, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! 👋 I'm the Buy2Lancer AI Assistant. How can I help you today?"
      }
    ]);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Hide main page scrollbar when chatbot is open in fullscreen mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOpen && isFullscreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, isFullscreen]);

  // Autofocus the input field when the chatbot opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage = text.trim();
    setInput("");
    
    // Refocus input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    
    // Add user message to state
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: userMessage,
          threadId: threadId || undefined,
          userContext: userContext || undefined
        })
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Limit Exceeded. Please try again later.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to communicate with AI Agent.");
      }

      const data = await res.json();
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      console.error("AI chatbot error:", err);
      const isLimit = err.message?.toLowerCase().includes("limit") || 
                      err.message?.toLowerCase().includes("quota") || 
                      err.message?.toLowerCase().includes("rate");
      const cleanErrorMsg = isLimit 
        ? "Limit Exceeded. Please try again later or wait a moment." 
        : (err.message || "Could not connect to Gemini API. Please make sure backend is running.");
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: `⚠️ Error: ${cleanErrorMsg}` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      "bg-indigo-50 text-indigo-700 border-indigo-100/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50",
      "bg-teal-50 text-teal-700 border-teal-100/50 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50",
      "bg-cyan-50 text-cyan-700 border-cyan-100/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/50",
      "bg-violet-50 text-violet-700 border-violet-100/50 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50",
      "bg-rose-50 text-rose-700 border-rose-100/50 dark:bg-rose-950/40 dark:text-rose-455 dark:border-rose-900/50",
      "bg-amber-50 text-amber-700 border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Match bold, italics, code, markdown links, or raw links
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|https?:\/\/[^\s\)]+)/g;
    let match;
    let keyIdx = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];
      
      // Push text before match
      if (matchIndex > currentIndex) {
        parts.push(<span key={`txt-${keyIdx++}`}>{text.substring(currentIndex, matchIndex)}</span>);
      }
      
      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-slate-900 dark:text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={`italic-${keyIdx++}`} className="italic text-slate-800 dark:text-zinc-350">
            {matchText.slice(1, -1)}
          </em>
        );
      } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code key={`code-${keyIdx++}`} className="bg-slate-100 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 px-1 py-0.5 rounded font-mono text-[10px] font-bold">
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith("[") && matchText.includes("](")) {
        const mdLinkMatch = matchText.match(/\[(.*?)\]\((.*?)\)/);
        if (mdLinkMatch) {
          const label = mdLinkMatch[1];
          const url = mdLinkMatch[2];
          parts.push(
            <a
              key={`link-${keyIdx++}`}
              href={url}
              className="text-teal-700 hover:text-teal-850 dark:text-teal-400 dark:hover:text-teal-350 font-extrabold underline transition select-text"
            >
              {label}
            </a>
          );
        } else {
          parts.push(<span key={`txt-${keyIdx++}`}>{matchText}</span>);
        }
      } else if (matchText.startsWith("http://") || matchText.startsWith("https://")) {
        const cleanLabel = matchText.replace("http://localhost:3000", "") || "/";
        parts.push(
          <a
            key={`link-${keyIdx++}`}
            href={matchText}
            className="text-teal-700 hover:text-teal-850 dark:text-teal-400 dark:hover:text-teal-350 font-extrabold underline transition select-text"
          >
            {cleanLabel}
          </a>
        );
      }
      
      currentIndex = regex.lastIndex;
    }
    
    // Push remaining text
    if (currentIndex < text.length) {
      parts.push(<span key={`txt-${keyIdx++}`}>{text.substring(currentIndex)}</span>);
    }
    
    return parts.length > 0 ? parts : text;
  };

  const parseMarkdownBlocks = (content: string) => {
    const lines = content.split("\n");
    const blocks: any[] = [];
    let currentList: any[] | null = null;

    const flushList = () => {
      if (currentList) {
        blocks.push({ type: 'list', items: currentList });
        currentList = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip redundant links
      if (
        (/link/i.test(trimmed) && (/https?:\/\//i.test(trimmed) || /\/(jobs|gigs|talent|freelancer|projects)\//i.test(trimmed))) ||
        /\[View (Job|Gig|Profile)\]/i.test(trimmed)
      ) {
        flushList();
        continue;
      }

      // 1. Detect Gig Card match
      const gigCardMatch = line.match(/^[-*•]?\s*\*\*Gig\s+#(\d+):\s*(.*?)\*\*\s*\(Price:\s*\$([\d\.]+)(?:,\s*Image:\s*(.*?))?\)/i);
      if (gigCardMatch) {
        flushList();
        blocks.push({
          type: "card",
          cardType: "gig",
          id: gigCardMatch[1],
          title: gigCardMatch[2],
          price: gigCardMatch[3],
          imageUrl: gigCardMatch[4] || ""
        });
        continue;
      }

      // 2. Detect Job Card match
      const jobCardMatch = line.match(/^[-*•]?\s*\*\*Job\s+#(\d+):\s*(.*?)\*\*\s*\(Budget:\s*\$([\d\.]+)(?:,\s*Location:\s*(.*?))?\)/i);
      if (jobCardMatch) {
        flushList();
        blocks.push({
          type: "card",
          cardType: "job",
          id: jobCardMatch[1],
          title: jobCardMatch[2],
          budget: jobCardMatch[3],
          location: jobCardMatch[4] || "Remote"
        });
        continue;
      }

      // 3. Detect Freelancer Card match
      const freelancerCardMatch = line.match(/^[-*•]?\s*\*\*Freelancer\s+#(\d+):\s*(.*?)\*\*\s*\(Title:\s*(.*?),\s*Hourly\s+Rate:\s*\$([\d\.]+)(?:,\s*Image:\s*(.*?))?\)/i);
      if (freelancerCardMatch) {
        flushList();
        blocks.push({
          type: "card",
          cardType: "freelancer",
          id: freelancerCardMatch[1],
          name: freelancerCardMatch[2],
          title: freelancerCardMatch[3],
          rate: freelancerCardMatch[4],
          imageUrl: freelancerCardMatch[5] || ""
        });
      }

      // 4. Detect Plan Card match
      const planCardMatch = line.match(/^[-*•]?\s*\*\*Plan\s+#(\d+):\s*(.*?)\*\*\s*\(Price:\s*\$([\d\.]+)(.*?),\s*Role:\s*(.*?)\)/i);
      if (planCardMatch) {
        flushList();
        blocks.push({
          type: "card",
          cardType: "plan",
          id: planCardMatch[1],
          name: planCardMatch[2],
          price: planCardMatch[3],
          period: planCardMatch[4].trim(),
          role: planCardMatch[5].trim()
        });
        continue;
      }

      // 5. Detect headings: e.g. ### Heading text
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        blocks.push({
          type: "heading",
          level: headingMatch[1].length,
          text: headingMatch[2]
        });
        continue;
      }

      // 5. Detect bullet lists (allow leading spaces)
      const bulletMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        const item = { listType: 'bullet', text: bulletMatch[2], indent };
        if (currentList) {
          currentList.push(item);
        } else {
          currentList = [item];
        }
        continue;
      }

      // 6. Detect ordered lists (allow leading spaces)
      const numberMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (numberMatch) {
        const indent = numberMatch[1].length;
        const item = { listType: 'ordered', text: numberMatch[2], indent };
        if (currentList) {
          currentList.push(item);
        } else {
          currentList = [item];
        }
        continue;
      }

      // 7. Handle blank lines
      if (trimmed === "") {
        flushList();
        blocks.push({ type: "empty-space" });
        continue;
      }

      // 8. Handle regular paragraphs
      flushList();
      blocks.push({ type: "paragraph", text: line });
    }

    flushList();
    return blocks;
  };

  const renderContent = (content: string) => {
    const blocks = parseMarkdownBlocks(content);
    return blocks.map((block, idx) => {
      switch (block.type) {
        case "card":
          if (block.cardType === "gig") {
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 my-3 shadow-sm hover:shadow-md hover:border-teal-500/30 transition duration-300 text-left select-none animate-fadeIn">
                <div className="flex gap-3.5 items-start">
                  {block.imageUrl ? (
                    <img 
                      src={resolveChatLogoUrl(block.imageUrl)} 
                      alt={block.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-105 dark:border-zinc-800 shrink-0 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center shrink-0 border border-teal-150/50 dark:border-teal-900/50">
                      <i className="fa-solid fa-gem text-teal-600 dark:text-teal-400 text-lg"></i>
                    </div>
                  )}
                  <div className="flex-grow min-w-0 flex flex-col justify-between min-h-[56px]">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/50 px-2 py-0.5 rounded-md">
                        GIG #{block.id}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1.5 leading-snug truncate" title={block.title}>
                        {block.title}
                      </h5>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-455">${parseFloat(block.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <a 
                  href={`/gigs/${block.id}`}
                  className="mt-3.5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-[10px] font-black py-2 rounded-xl border-none cursor-pointer transition select-none no-underline flex items-center justify-center gap-1.5 shadow-xs"
                >
                  View Details <i className="fa-solid fa-chevron-right text-[7px] opacity-70"></i>
                </a>
              </div>
            );
          }
          if (block.cardType === "job") {
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 my-3 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition duration-300 text-left select-none animate-fadeIn">
                <div className="flex gap-3.5 items-start">
                  <div className="w-14 h-14 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center shrink-0 border border-cyan-150/50 dark:border-cyan-900/50">
                    <i className="fa-solid fa-briefcase text-cyan-600 dark:text-cyan-400 text-lg"></i>
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-between min-h-[56px]">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100/50 dark:border-cyan-900/50 px-2 py-0.5 rounded-md">
                        PROJECT #{block.id}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1.5 leading-snug truncate" title={block.title}>
                        {block.title}
                      </h5>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 min-w-0">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-455">${parseFloat(block.budget).toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-extrabold flex items-center gap-1">
                        <i className="fa-solid fa-location-dot text-[8px]"></i> {block.location}
                      </span>
                    </div>
                  </div>
                </div>
                <a 
                  href={`/projects/${block.id}`}
                  className="mt-3.5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-[10px] font-black py-2 rounded-xl border-none cursor-pointer transition select-none no-underline flex items-center justify-center gap-1.5 shadow-xs"
                >
                  View Details <i className="fa-solid fa-chevron-right text-[7px] opacity-70"></i>
                </a>
              </div>
            );
          }
          if (block.cardType === "freelancer") {
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 my-3 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-300 text-left select-none animate-fadeIn">
                <div className="flex gap-3.5 items-start">
                  {block.imageUrl && block.imageUrl !== "!Image" && !failedImages[block.imageUrl] ? (
                    <img 
                      src={resolveChatLogoUrl(block.imageUrl)} 
                      alt={block.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-105 dark:border-zinc-800 shrink-0 shadow-xs"
                      onError={() => {
                        setFailedImages(prev => ({ ...prev, [block.imageUrl]: true }));
                      }}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border text-xs font-black select-none ${getAvatarBgColor(block.name)}`}>
                      {getInitials(block.name)}
                    </div>
                  )}
                  <div className="flex-grow min-w-0 flex flex-col justify-between min-h-[56px]">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50 px-2 py-0.5 rounded-md">
                        TALENT #{block.id}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1.5 leading-snug truncate" title={block.name}>
                        {block.name}
                      </h5>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 min-w-0">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold truncate max-w-[60%]">{block.title}</span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-455">${parseFloat(block.rate).toFixed(2)}/hr</span>
                    </div>
                  </div>
                </div>
                <a 
                  href={`/freelancer/${block.id}`}
                  className="mt-3.5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-[10px] font-black py-2 rounded-xl border-none cursor-pointer transition select-none no-underline flex items-center justify-center gap-1.5 shadow-xs"
                >
                  View Profile <i className="fa-solid fa-chevron-right text-[7px] opacity-70"></i>
                </a>
              </div>
            );
          }
          if (block.cardType === "plan") {
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 my-3 shadow-sm hover:shadow-md hover:border-violet-500/30 transition duration-300 text-left select-none animate-fadeIn">
                <div className="flex gap-3.5 items-start">
                  <div className="w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0 border border-violet-150/50 dark:border-violet-900/50">
                    <i className="fa-solid fa-crown text-violet-600 dark:text-violet-400 text-lg"></i>
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-between min-h-[56px]">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/50 px-2 py-0.5 rounded-md">
                        {block.name.toUpperCase()}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1.5 leading-snug truncate" title={block.name}>
                        {block.role.toUpperCase()} MEMBERSHIP
                      </h5>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-455">${parseFloat(block.price).toFixed(2)}{block.period || ""}</span>
                    </div>
                  </div>
                </div>
                <a 
                  href="/pricing"
                  className="mt-3.5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-[10px] font-black py-2 rounded-xl border-none cursor-pointer transition select-none no-underline flex items-center justify-center gap-1.5 shadow-xs"
                >
                  View Details <i className="fa-solid fa-chevron-right text-[7px] opacity-70"></i>
                </a>
              </div>
            );
          }
          return null;

        case "heading":
          const headingSizeClass = 
            block.level === 1 ? "text-lg font-black mt-3 mb-1" :
            block.level === 2 ? "text-base font-black mt-2.5 mb-1" :
            "text-xs font-bold mt-2 mb-1";
          return (
            <h4 key={idx} className={`${headingSizeClass} text-slate-900 dark:text-white text-left`}>
              {renderInlineMarkdown(block.text)}
            </h4>
          );

        case "list":
          let orderedCounter = 0;
          return (
            <div key={idx} className="my-2.5 flex flex-col gap-1.5 text-left select-text">
              {block.items.map((item: any, itemIdx: number) => {
                if (item.listType === 'ordered') {
                  orderedCounter++;
                }
                const isBullet = item.listType === 'bullet';
                const paddingLeft = item.indent > 0 ? `${item.indent * 8}px` : "0px";
                return (
                  <div 
                    key={itemIdx} 
                    className="flex items-start gap-2 text-slate-800 dark:text-zinc-200 text-xs leading-relaxed"
                    style={{ paddingLeft }}
                  >
                    {isBullet ? (
                      <span className="text-teal-600 dark:text-teal-400 font-bold select-none shrink-0 mt-0.5">•</span>
                    ) : (
                      <span className="text-teal-700 dark:text-teal-450 font-black select-none shrink-0 min-w-[14px]">
                        {orderedCounter}.
                      </span>
                    )}
                    <span className="flex-grow">
                      {renderInlineMarkdown(item.text)}
                    </span>
                  </div>
                );
              })}
            </div>
          );

        case "empty-space":
          return <div key={idx} className="h-2.5" />;

        case "paragraph":
        default:
          return (
            <p key={idx} className="my-1.5 text-left text-slate-855 dark:text-zinc-200 leading-relaxed text-xs">
              {renderInlineMarkdown(block.text)}
            </p>
          );
      }
    });
  };

  const extractCheckoutData = (content: string) => {
    const match = content.match(/\[CHECKOUT_WIDGET:\s*(\{.*?\})\]/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const cleanContent = content.replace(/\[CHECKOUT_WIDGET:\s*(\{.*?\})\]/, "").trim();
        return { cleanContent, widgetData: data };
      } catch (e) {
        console.error("Failed to parse checkout widget data:", e);
      }
    }
    return { cleanContent: content, widgetData: null };
  };

  const presetSuggestions = [
    "Browse top freelancer gigs & products",
    "Find skilled freelancers for hire",
    "Show active projects & job listings"
  ];

  const pathname = usePathname();

  if (!mounted || pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-2xl hover:shadow-teal-900/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-teal-600/40 p-2 cursor-pointer group"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <div className="w-full h-full rounded-full bg-teal-700 text-white flex items-center justify-center">
            <FiX className="w-6 h-6 animate-fadeIn" />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {!btnImageFailed && (siteChatbotAvatar || siteFavicon || siteLogo || !mounted) ? (
              <img 
                src={siteChatbotAvatar ? resolveChatLogoUrl(siteChatbotAvatar) : siteFavicon ? resolveChatLogoUrl(siteFavicon) : siteLogo ? resolveChatLogoUrl(siteLogo) : "/favicon.ico"} 
                alt="AI Assistant" 
                className="w-full h-full object-contain animate-fadeIn group-hover:scale-105 transition-transform"
                onError={() => setBtnImageFailed(true)}
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                alt="AI Chat"
                className="w-full h-full object-contain animate-fadeIn group-hover:scale-105 transition-transform"
              />
            )}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-sm"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={isFullscreen 
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-white dark:bg-[#121214] flex flex-col overflow-hidden animate-fadeIn font-sans"
          : "fixed bottom-24 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#121214] border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp transition-all duration-300 font-sans"
        }>
          
          {/* Header */}
          <div className="bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800 px-5 py-4 flex justify-between items-center relative shrink-0">
            <div className="flex items-center gap-3 z-10 min-w-0">
              {/* Logo */}
              <div className="h-8 flex items-center shrink-0">
                {isFullscreen && siteLogo ? (
                  <img 
                    src={resolveChatLogoUrl(siteLogo)} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain max-w-[120px]" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                    {!faviconFailed && (siteFavicon || !mounted) ? (
                      <img 
                        src={siteFavicon ? resolveChatLogoUrl(siteFavicon) : "/favicon.ico"} 
                        alt="Favicon" 
                        className="h-5.5 h-5.5 object-contain"
                        onError={() => {
                          setFaviconFailed(true);
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-robot text-primary dark:text-teal-400 text-sm"></i>
                    )}
                  </div>
                )}
              </div>
              
              {/* Title & Status */}
              <div className="text-left">
                <h4 className="text-sm font-black tracking-tight leading-none text-slate-800 dark:text-zinc-100">AI Assistant</h4>
              </div>
            </div>
            
            <div className="flex items-center gap-1 z-10 shrink-0">
              {/* Fullscreen Toggle Button */}
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-zinc-100 bg-transparent border-none cursor-pointer transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <FiMinimize className="w-4 h-4" />
                ) : (
                  <FiMaximize className="w-4 h-4" />
                )}
              </button>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-zinc-100 bg-transparent border-none cursor-pointer transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                aria-label="Close Chat"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-[#09090b] scrollbar-thin">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const { cleanContent, widgetData } = extractCheckoutData(msg.content);
              return (
                <div 
                  key={idx} 
                  className={`flex ${isUser ? "justify-end" : "justify-start"} flex-col ${isUser ? "items-end" : "items-start"} gap-1.5 animate-fadeIn`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed ${
                    isUser 
                      ? "bg-teal-700 text-white rounded-br-none shadow-md shadow-teal-900/5 text-right" 
                      : "bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-bl-none text-left"
                  }`}>
                    {/* Simplified markdown format rendering */}
                    <div className="select-text">
                      {renderContent(cleanContent)}
                    </div>
                  </div>
                  {!isUser && widgetData && (
                    <div className="w-[85%]">
                      <CheckoutWidget
                        gigId={widgetData.gig_id}
                        title={widgetData.title}
                        price={widgetData.price}
                        currencyId={widgetData.currency_id}
                        onSuccess={(successMsg) => {
                          setMessages(prev => [...prev, { role: "assistant", content: successMsg }]);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions and Input Section */}
          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#121214] p-3 space-y-3">
            
            {/* Suggestion Chips */}
            {messages.length === 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-left select-none">
                {presetSuggestions.map((text, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(text)}
                    className="shrink-0 bg-slate-50 hover:bg-teal-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-500/30 rounded-xl px-3 py-1.5 text-[10px] font-extrabold transition-all duration-200 cursor-pointer"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI anything about Buy2Lancer..."
                disabled={loading}
                className="flex-grow bg-slate-50 dark:bg-zinc-850 dark:text-white border border-slate-200/80 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-teal-700 hover:bg-teal-850 disabled:bg-slate-200 disabled:dark:bg-zinc-800 text-white disabled:text-slate-400 dark:disabled:text-zinc-600 rounded-xl p-2.5 border-none cursor-pointer transition active:scale-95 shrink-0 flex items-center justify-center"
                aria-label="Send Message"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
