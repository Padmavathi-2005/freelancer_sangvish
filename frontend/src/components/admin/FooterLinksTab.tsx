"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useAdmin } from "@/app/admin/AdminContext";

export default function FooterLinksTab() {
  const { handleSaveSetting } = useAdmin();

  const [appStoreUrl, setAppStoreUrl] = useState("https://apps.apple.com");
  const [googlePlayUrl, setGooglePlayUrl] = useState("https://play.google.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com");
  const [appMockupImage, setAppMockupImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((s: any) => {
            if (s.setting_key === "app_store_url") setAppStoreUrl(s.setting_value);
            if (s.setting_key === "google_play_url") setGooglePlayUrl(s.setting_value);
            if (s.setting_key === "instagram_url") setInstagramUrl(s.setting_value);
            if (s.setting_key === "linkedin_url") setLinkedinUrl(s.setting_value);
            if (s.setting_key === "app_mockup_image") setAppMockupImage(s.setting_value);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload?category=settings&type=settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      setAppMockupImage(data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      await handleSaveSetting("app_store_url", appStoreUrl, "site_settings");
      await handleSaveSetting("google_play_url", googlePlayUrl, "site_settings");
      await handleSaveSetting("instagram_url", instagramUrl, "site_settings");
      await handleSaveSetting("linkedin_url", linkedinUrl, "site_settings");
      await handleSaveSetting("app_mockup_image", appMockupImage, "site_settings");

      setSaveStatus({ type: "success", text: "✓ Footer & app links saved successfully!" });
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
          <h3 className="text-lg font-bold text-slate-800">Footer & Mobile App Settings</h3>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Control mobile app download badges, custom mockup screen graphic, and social media connect URLs.</p>
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
          saveStatus.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-rose-50 border border-rose-255 text-rose-700"
        }`}>
          {saveStatus.text}
        </div>
      )}

      {/* Grid: Inputs left, Mockup Image right */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Input fields */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">App Store URL</span>
            <input
              type="text"
              value={appStoreUrl}
              onChange={(e) => setAppStoreUrl(e.target.value)}
              placeholder="https://apps.apple.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Google Play URL</span>
            <input
              type="text"
              value={googlePlayUrl}
              onChange={(e) => setGooglePlayUrl(e.target.value)}
              placeholder="https://play.google.com/store/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Instagram URL</span>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">LinkedIn URL</span>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>
        </div>

        {/* Right: Graphic / Mockup Upload */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">App Phone Mockup Screen</span>
          
          <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded-3xl border border-slate-200 overflow-hidden relative group bg-white shadow-inner flex items-center justify-center">
            {appMockupImage ? (
              <img src={appMockupImage} className="w-full h-full object-cover" alt="Mockup Preview" />
            ) : (
              <span className="text-[10px] text-slate-400 font-bold">No Image Selected</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white z-10">
                <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="bg-teal-700 hover:bg-teal-800 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl text-center cursor-pointer transition select-none flex items-center justify-center gap-2 shadow-sm">
              {uploading ? "Uploading..." : "Upload Mockup Screen"}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={appMockupImage}
              onChange={(e) => setAppMockupImage(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-mono text-slate-500 focus:outline-none"
              placeholder="/public/images/settings/mockup.png"
            />
            <span className="text-[9px] text-slate-400 leading-normal font-bold">
              Recommended format: Portrait JPG/PNG. Images are stored inside <code>public/images/settings</code>.
            </span>
          </div>
        </div>

      </form>
    </div>
  );
}
