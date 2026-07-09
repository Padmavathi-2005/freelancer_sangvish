"use client";

import React, { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiAlertTriangle } from "react-icons/fi";

interface AuthModalContextProps {
  openLoginModal: (redirectUrl?: string, onSuccess?: () => void) => void;
  closeLoginModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextProps | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [onSuccess, setOnSuccess] = useState<(() => void) | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openLoginModal = (url?: string, cb?: () => void) => {
    setRedirectUrl(url || null);
    setOnSuccess(() => cb || null);
    setError(null);
    setEmail("");
    setPassword("");
    setIsOpen(true);
  };

  const closeLoginModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("https://freelancer.sangvish.com/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials. Please try again.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("onboarding_completed");
        localStorage.removeItem("onboarding_step");

        setIsOpen(false);

        if (onSuccess) {
          onSuccess();
        } else if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          // Just reload page to refresh state globally
          window.location.reload();
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to backend user service.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}

      {/* Premium Glassmorphic Login Overlay Modal */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          {/* Background Decorative Blurs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[10%] left-[20%] w-[25rem] h-[25rem] bg-teal-600/10 rounded-full filter blur-[80px]"></div>
            <div className="absolute bottom-[10%] right-[20%] w-[25rem] h-[25rem] bg-emerald-600/10 rounded-full filter blur-[80px]"></div>
          </div>

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200/85 rounded-[2.2rem] p-6 sm:p-10 shadow-2xl shadow-slate-950/20 flex flex-col gap-6 text-slate-800 animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={closeLoginModal}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-850 transition-all cursor-pointer z-20 flex items-center justify-center"
              aria-label="Close login modal"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center sm:text-left pr-8">
              <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase mb-1 block">Shortcut Login</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                Sign In to Continue
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1.5 leading-relaxed">
                Log in directly from this screen to unlock actions without leaving the page.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-2 animate-shake">
                  <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-1.5 text-left font-sans">
                <label htmlFor="modal-email" className="text-xxs font-bold text-slate-500">
                  Email Address
                </label>
                <input
                  id="modal-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5 text-left font-sans">
                <label htmlFor="modal-password" className="text-xxs font-bold text-slate-500">
                  Password
                </label>
                <div className="relative font-sans">
                  <input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 transition-colors p-1 flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <circle cx={12} cy={12} r={3} />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Log In & Continue</span>
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-xs font-bold text-slate-500">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-teal-700 hover:text-teal-850 font-black hover:underline font-sans">
                Register Now
              </a>
            </p>
          </div>
        </div>
      , document.body)}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
