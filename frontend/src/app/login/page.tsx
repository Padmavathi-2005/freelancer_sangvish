"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [socialSettings, setSocialSettings] = useState({
    googleEnabled: false,
    googleClientId: "",
    facebookEnabled: false,
    facebookAppId: "",
  });

  useEffect(() => {
    // If user is already logged in, redirect straight to dashboard
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        window.location.href = "/dashboard";
      }
    }

    const fetchSocialSettings = async () => {
      try {
        const res = await fetch("https://freelancer.sangvish.com/api/settings");
        if (res.ok) {
          const data = await res.json();
          const settings = {
            googleEnabled: false,
            googleClientId: "",
            facebookEnabled: false,
            facebookAppId: "",
          };
          data.forEach((s: any) => {
            if (s.setting_key === "google_login_enabled") {
              const val = typeof s.setting_value === "string" ? JSON.parse(s.setting_value) : s.setting_value;
              settings.googleEnabled = val === true || String(val) === "true";
            }
            if (s.setting_key === "google_client_id") {
              settings.googleClientId = typeof s.setting_value === "string" && s.setting_value.startsWith('"') ? JSON.parse(s.setting_value) : s.setting_value;
            }
            if (s.setting_key === "facebook_login_enabled") {
              const val = typeof s.setting_value === "string" ? JSON.parse(s.setting_value) : s.setting_value;
              settings.facebookEnabled = val === true || String(val) === "true";
            }
            if (s.setting_key === "facebook_app_id") {
              settings.facebookAppId = typeof s.setting_value === "string" && s.setting_value.startsWith('"') ? JSON.parse(s.setting_value) : s.setting_value;
            }
          });
          setSocialSettings(settings);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSocialSettings();
  }, []);



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
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to backend user service.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />
      
      <div className="flex-1 flex flex-col justify-center items-center px-4 relative py-12">
        {/* Premium background mesh blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-teal-600/10 rounded-full filter blur-[80px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-emerald-600/10 rounded-full filter blur-[80px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
          
          {/* Brand Header */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-bold tracking-wide uppercase">
              Client & Talent Login Portal
            </p>
          </div>

        {/* Card wrapper */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[2.2rem] p-6 sm:p-10 shadow-2xl shadow-slate-100/50 flex flex-col gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight font-display">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
              Enter your credentials to access your active workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-500">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0a5a54]/50 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#0a5a54]/50 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0a5a54] transition-colors p-1 flex items-center justify-center cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
              className="w-full bg-[#0a5a54] hover:bg-[#073f3a] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#0a5a54]/10 active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          {/* Social Logins */}
          {(socialSettings.googleEnabled || socialSettings.facebookEnabled) && (
            <div className="flex flex-col gap-4 mt-4 select-none">
              <div className="flex items-center gap-3">
                <hr className="flex-1 border-slate-100" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Continue With</span>
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
                    className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700 bg-white"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google</span>
                  </button>
                )}
                {socialSettings.facebookEnabled && (
                  <button
                    type="button"
                    onClick={() => alert(`Facebook authentication initiated with App ID: ${socialSettings.facebookAppId}`)}
                    className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700 bg-white"
                  >
                    <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs sm:text-sm text-slate-500 font-semibold select-none">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[#0a5a54] hover:text-[#073f3a] font-extrabold hover:underline">
            Register Now
          </a>
        </p>

      </div>
      </div>
    </div>
  );
}
