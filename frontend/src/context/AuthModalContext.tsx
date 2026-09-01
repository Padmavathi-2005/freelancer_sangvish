"use client";
import { API_URL } from "@/config/api";


import React, { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

interface AuthModalContextProps {
  openLoginModal: (redirectUrl?: string, onSuccess?: () => void) => void;
  closeLoginModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextProps | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [onSuccess, setOnSuccess] = useState<(() => void) | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Social settings state
  const [socialSettings, setSocialSettings] = React.useState({
    googleEnabled: false,
    googleClientId: "",
    facebookEnabled: false,
    facebookAppId: "",
    loaded: false,
  });

  const openLoginModal = (url?: string, cb?: () => void) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        if (cb) {
          cb();
        } else {
          window.location.href = url || "/dashboard";
        }
        return;
      }
    }
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

  // Fetch social settings when modal opens
  React.useEffect(() => {
    if (!isOpen || socialSettings.loaded) return;
    const fetchSocial = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const s = { googleEnabled: false, googleClientId: "", facebookEnabled: false, facebookAppId: "", loaded: true };
          data.forEach((item: any) => {
            if (item.setting_key === "google_login_enabled") {
              const val = typeof item.setting_value === "string" ? JSON.parse(item.setting_value) : item.setting_value;
              s.googleEnabled = val === true || String(val) === "true";
            }
            if (item.setting_key === "google_client_id") {
              s.googleClientId = typeof item.setting_value === "string" && item.setting_value.startsWith('"') ? JSON.parse(item.setting_value) : item.setting_value;
            }
            if (item.setting_key === "facebook_login_enabled") {
              const val = typeof item.setting_value === "string" ? JSON.parse(item.setting_value) : item.setting_value;
              s.facebookEnabled = val === true || String(val) === "true";
            }
            if (item.setting_key === "facebook_app_id") {
              s.facebookAppId = typeof item.setting_value === "string" && item.setting_value.startsWith('"') ? JSON.parse(item.setting_value) : item.setting_value;
            }
          });
          setSocialSettings(s);
        }
      } catch (err) {
        console.error("Failed to load social settings:", err);
      }
    };
    fetchSocial();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsOpen(false);
      setEmail("");
      setPassword("");

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = redirectUrl || "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch social login settings from backend once mounted
  React.useEffect(() => {
    if (!isOpen) return;
    const fetchSocialSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/site-settings/social-login`);
        if (res.ok) {
          const data = await res.json();
          setSocialSettings({
            googleEnabled: !!data.googleEnabled,
            googleClientId: data.googleClientId || "",
            facebookEnabled: !!data.facebookEnabled,
            facebookAppId: data.facebookAppId || "",
            loaded: true,
          });
        }
      } catch (err) {
        console.error("Failed to load social login configurations:", err);
      }
    };
    fetchSocialSettings();
  }, [isOpen]);

  return (
    <AuthModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}

      {/* Premium Glassmorphic Login Overlay Modal */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          {/* Background Decorative Blurs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[10%] left-[20%] w-[25rem] h-[25rem] bg-teal-600/10 rounded-full filter blur-[80px]"></div>
            <div className="absolute bottom-[10%] right-[20%] w-[25rem] h-[25rem] bg-emerald-600/10 rounded-full filter blur-[80px]"></div>
          </div>

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200/85 rounded-xl p-5 sm:p-8 shadow-2xl shadow-slate-950/20 flex flex-col gap-5 text-slate-800 animate-scaleUp my-auto max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeLoginModal}
              className="absolute top-6 right-6 rtl:right-auto rtl:left-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-850 transition-all cursor-pointer z-20 flex items-center justify-center"
              aria-label="Close login modal"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center sm:text-left rtl:sm:text-right pr-8 rtl:pr-0 rtl:pl-8">
              <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase mb-1 block">{t("shortcut_login_header", "Shortcut Login")}</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {t("signin_continue_title", "Sign In to Continue")}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1.5 leading-relaxed">
                {t("shortcut_login_desc", "Log in directly from this screen to unlock actions without leaving the page.")}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-2 animate-shake">
                  <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t(error.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""), error)}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-1.5 text-left rtl:text-right font-sans">
                <label htmlFor="modal-email" className="text-xxs font-bold text-slate-500">
                  {t("email_address_label", "Email Address")}
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
              <div className="flex flex-col gap-1.5 text-left rtl:text-right font-sans">
                <label htmlFor="modal-password" className="text-xxs font-bold text-slate-500">
                  {t("password_label", "Password")}
                </label>
                <div className="relative font-sans">
                  <input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 rounded-xl pl-4 pr-12 rtl:pl-12 rtl:pr-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 transition-colors p-1 flex items-center justify-center cursor-pointer"
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
                    <span>{t("signing_in_status", "Signing in...")}</span>
                  </>
                ) : (
                  <span>{t("login_continue_btn", "Log In & Continue")}</span>
                )}
              </button>
            </form>

            {/* Social Login Buttons — shown only when enabled in Admin */}
            {(socialSettings.googleEnabled || socialSettings.facebookEnabled) && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("or_continue_with_label", "Or Continue With")}</span>
                  <hr className="flex-1 border-slate-100" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {socialSettings.googleEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        const client_id = socialSettings.googleClientId;
                        if (!client_id) {
                          alert("Google Client ID is not configured in Admin settings.");
                          return;
                        }
                        const redirectUri = window.location.origin + "/auth/callback/google";
                        const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile`;
                        window.location.href = googleUrl;
                      }}
                      className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700 bg-white cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>{t("google_label", "Google")}</span>
                    </button>
                  )}
                  {socialSettings.facebookEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        const client_id = socialSettings.facebookAppId;
                        if (!client_id) {
                          alert("Facebook App ID is not configured in Admin Site Settings.");
                          return;
                        }
                        const redirectUri = window.location.origin + "/auth/callback/facebook";
                        const facebookUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email,public_profile`;
                        window.location.href = facebookUrl;
                      }}
                      className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700 bg-white cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>{t("facebook_label", "Facebook")}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Register Link */}
            <p className="text-center text-xs font-bold text-slate-500">
              {t("dont_have_account_msg", "Don't have an account?")}{" "}
              <a href="/register" className="text-teal-700 hover:text-teal-855 font-black hover:underline font-sans">
                {t("register_now_btn", "Register Now")}
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
    return {
      openLoginModal: (redirectUrl?: string, onSuccess?: () => void) => {},
      closeLoginModal: () => {}
    };
  }
  return context;
}
