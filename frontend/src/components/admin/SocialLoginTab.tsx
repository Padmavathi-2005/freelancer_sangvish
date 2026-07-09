"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "@/app/admin/AdminContext";

export default function SocialLoginTab() {
  const { handleSaveSetting } = useAdmin();

  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookAppId, setFacebookAppId] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://freelancer.sangvish.com/api/settings");
        if (res.ok) {
          const data = await res.json();
          data.forEach((s: any) => {
            if (s.setting_key === "google_login_enabled") {
              const val = typeof s.setting_value === "string" ? JSON.parse(s.setting_value) : s.setting_value;
              setGoogleEnabled(val === true || String(val) === "true");
            }
            if (s.setting_key === "google_client_id") {
              setGoogleClientId(typeof s.setting_value === "string" && s.setting_value.startsWith('"') ? JSON.parse(s.setting_value) : s.setting_value);
            }
            if (s.setting_key === "facebook_login_enabled") {
              const val = typeof s.setting_value === "string" ? JSON.parse(s.setting_value) : s.setting_value;
              setFacebookEnabled(val === true || String(val) === "true");
            }
            if (s.setting_key === "facebook_app_id") {
              setFacebookAppId(typeof s.setting_value === "string" && s.setting_value.startsWith('"') ? JSON.parse(s.setting_value) : s.setting_value);
            }
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      await handleSaveSetting("google_login_enabled", googleEnabled, "site_settings");
      await handleSaveSetting("google_client_id", googleClientId, "site_settings");
      await handleSaveSetting("facebook_login_enabled", facebookEnabled, "site_settings");
      await handleSaveSetting("facebook_app_id", facebookAppId, "site_settings");

      setSaveStatus({ type: "success", text: "✓ Social login settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left max-w-4xl">
      {/* HEADER SECTION with Save Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-sans">Social Login Settings</h3>
          <p className="text-slate-500 text-xs mt-0.5 font-medium leading-normal">
            Configure integration parameters and client keys for third-party social auth providers (Google & Facebook).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          saveStatus.type === "success" ? "bg-emerald-50 border border-emerald-250 text-emerald-700" : "bg-rose-50 border border-rose-250 text-rose-700"
        }`}>
          {saveStatus.text}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {/* Google Authentication Settings */}
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 text-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 font-sans">Google OAuth Authentication</h4>
              <p className="text-xs text-slate-500 mt-1 leading-normal">Enable or disable Google Sign-In button on the registration and login pages.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setGoogleEnabled(!googleEnabled)}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                googleEnabled ? "bg-teal-700" : "bg-slate-200"
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                googleEnabled ? "translate-x-5.5" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Google Client ID</span>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>
        </div>

        {/* Facebook Authentication Settings */}
        <div className="flex flex-col gap-5 pb-2 text-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 font-sans">Facebook Login Integration</h4>
              <p className="text-xs text-slate-500 mt-1 leading-normal">Enable or disable Facebook login button on the registration and login pages.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setFacebookEnabled(!facebookEnabled)}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                facebookEnabled ? "bg-teal-700" : "bg-slate-200"
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                facebookEnabled ? "translate-x-5.5" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Facebook App ID</span>
            <input
              type="text"
              value={facebookAppId}
              onChange={(e) => setFacebookAppId(e.target.value)}
              placeholder="e.g. 987654321098765"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
