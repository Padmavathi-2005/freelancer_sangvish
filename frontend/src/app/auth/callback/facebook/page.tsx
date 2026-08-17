"use client";
import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FacebookCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCallback = async () => {
      // 1. Extract access token from URL hash
      const hash = window.location.hash;
      if (!hash) {
        setError("No authentication token found.");
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        setError("Failed to parse access token from Facebook.");
        return;
      }

      try {
        // 2. Fetch user profile from Facebook graph API
        const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        if (!profileRes.ok) {
          throw new Error("Failed to fetch Facebook user profile.");
        }
        const profile = await profileRes.json();
        
        const email = profile.email || `${profile.id}@facebook.com`;
        const name = profile.name || "";

        // 3. Perform backend login/register exchange
        const res = await fetch(`${API_URL}/users/social-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            first_name: name
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to log in with Facebook.");
        }
        
        // 4. Set session
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("onboarding_completed");
        localStorage.removeItem("onboarding_step");
        localStorage.removeItem("onboarding_role");

        // Check onboarding status
        const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        
        if (checkRes.ok) {
          const onboarding = await checkRes.json();
          if (!onboarding.hasFreelancerProfile && !onboarding.hasClientProfile) {
            router.push("/dashboard");
          } else {
            router.push("/dashboard?tab=workspace");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred during Facebook Sign-In.");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-sans p-6 text-center">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-xl mx-auto">
              ⚠️
            </div>
            <h2 className="text-base font-black text-slate-800">Authentication Failed</h2>
            <p className="text-xs text-slate-500 font-bold leading-normal">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-black py-2.5 rounded-xl transition cursor-pointer border-none mt-2"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-black text-slate-800">Verifying Session</h2>
            <p className="text-xs text-slate-450 font-bold leading-normal">
              Completing Facebook OAuth authentication. Please do not close this window...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
