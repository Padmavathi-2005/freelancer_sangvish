"use client";

import React, { useState, useEffect } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If admin is already authenticated, redirect to admin dashboard
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      if (token) {
        window.location.href = "/admin";
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all security fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid administrative credentials or key.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend administration service.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-center items-center px-4 relative overflow-hidden">
      
      {/* Background Matrix/Grid Overlay and Glowing Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,118,110,0.06)_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-70"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[45rem] h-[45rem] bg-primary/5 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[45rem] h-[45rem] bg-primary/5 rounded-full filter blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-8">
        
        {/* Top Header */}
        <div className="text-center">
          <a href="/" className="inline-block text-3xl font-extrabold tracking-tight text-primary font-display mb-1 select-none">
            Freelancer <span className="text-slate-500 text-lg font-bold">Admin</span>
          </a>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest mt-2 select-none">
            ⚠️ SECURE TERMINAL - AUTHORIZED ONLY
          </div>
        </div>

        {/* Card Frame */}
        <div className="bg-white border border-slate-200/80 rounded-[2.2rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 flex flex-col gap-6">
          <div className="text-center sm:text-left border-b border-slate-100 pb-5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight font-display">
              Admin Login
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Provide authorization key and security credentials
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200/60 text-rose-600 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Username/Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Admin Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Password/Key Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Access Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1 flex items-center justify-center cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye Off SVG
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <circle cx={12} cy={12} r={3} />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-primary/10 active:scale-[0.98] mt-4 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Initializing Admin Session...
                </>
              ) : (
                "Verify Security Credentials"
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <p className="text-center text-xs text-slate-500 font-semibold select-none">
          Not an administrator?{" "}
          <a href="/" className="text-primary hover:underline font-bold">
            Return to Homepage
          </a>
        </p>
      </div>
    </div>
  );
}
