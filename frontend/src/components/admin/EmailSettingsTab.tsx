"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";

interface EmailSettingsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function EmailSettingsTab({
  handleSaveSetting
}: EmailSettingsTabProps) {

  // Email SMTP states
  const [emailId, setEmailId] = useState("noreply@buy2lancer.com");
  const [smtpHost, setSmtpHost] = useState("smtp");
  const [smtpPort, setSmtpPort] = useState(2525);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // Email Branding states
  const [emailLogo, setEmailLogo] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [emailCopyright, setEmailCopyright] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastTitle, setToastTitle] = useState("Settings Saved");
  const [toastText, setToastText] = useState("Email configuration updated successfully.");

  const triggerToast = (title: string, text: string) => {
    setToastTitle(title);
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const rawEmail = data.find((s: any) => s.setting_key === "email_settings")?.setting_value;

          const parseVal = (val: any) => {
            if (typeof val === "string") {
              try {
                return JSON.parse(val);
              } catch (e) {
                console.error("Failed to parse settings value:", e);
              }
            }
            return val || {};
          };

          const email = parseVal(rawEmail);

          if (email.email_id) setEmailId(email.email_id);
          if (email.smtp_host) setSmtpHost(email.smtp_host);
          if (email.smtp_port) setSmtpPort(Number(email.smtp_port));
          if (email.smtp_user) setSmtpUser(email.smtp_user);
          if (email.smtp_pass) setSmtpPass(email.smtp_pass);
          if (email.email_logo) setEmailLogo(email.email_logo);
          if (email.email_signature) setEmailSignature(email.email_signature);
          if (email.email_copyright) setEmailCopyright(email.email_copyright);
        }
      } catch (e) {
        console.error("Failed to load settings options", e);
      }
    };
    loadOptions();
  }, []);

  const handleBulkSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setShowToast(false);

    try {
      // Save settings to DB under category 'email_settings'
      await handleSaveSetting("email_settings", {
        email_id: emailId,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        email_logo: emailLogo,
        email_signature: emailSignature,
        email_copyright: emailCopyright
      }, "email_settings");

      triggerToast("Settings Saved", "Email settings saved successfully!");
      setSaveStatus({ type: "success", text: "✓ Email settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left">
      
      {/* HEADER SECTION with Save Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-850">Email SMTP Gateway Settings</h3>
          <p className="text-slate-505 text-xs mt-0.5">Configure SMTP parameters and default sender address to trigger real automated emails to users.</p>
        </div>
        <button
          onClick={handleBulkSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Save Success/Error Alert banner */}
      {saveStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition animate-fadeIn ${
          saveStatus.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}>
          {saveStatus.text}
        </div>
      )}

      {/* Email settings: Sender, SMTP Host, Port, User, Pass */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Email SMTP Config</h4>
          <p className="text-xs text-slate-505 mt-1">Specify sender identity and connection credentials to dispatch system notifications.</p>
        </div>
        
        <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sender Email Address</span>
            <input
              type="email"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              placeholder="noreply@buy2lancer.com"
              className="w-full sm:w-[220px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SMTP Host</span>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp"
              className="w-full sm:w-[220px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SMTP Port</span>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(Number(e.target.value))}
              placeholder="2525"
              className="w-full sm:w-[220px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SMTP Username</span>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="username"
              className="w-full sm:w-[220px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SMTP Password</span>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 my-2"></div>

      {/* Email Branding settings: Logo, Signature, Copyright */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start gap-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Email Branding & Templates</h4>
          <p className="text-xs text-slate-505 mt-1 font-medium">Customize the visual identity, signatures, and footer copyright displayed on outgoing emails.</p>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col gap-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Logo URL</span>
            <input
              type="text"
              value={emailLogo}
              onChange={(e) => setEmailLogo(e.target.value)}
              placeholder="e.g. https://yourdomain.com/logo.png"
              className="w-full lg:w-[456px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Sender Signature</span>
            <textarea
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder="Best regards,&#10;The Buy2Lancer Team"
              rows={3}
              className="w-full lg:w-[456px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition resize-none font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Footer Copyright Text</span>
            <input
              type="text"
              value={emailCopyright}
              onChange={(e) => setEmailCopyright(e.target.value)}
              placeholder="© {{year}} {{site_name}}. All rights reserved."
              className="w-full lg:w-[456px] bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Use <code>&#123;&#123;year&#125;&#125;</code> and <code>&#123;&#123;site_name&#125;&#125;</code> for dynamic values.</p>
          </div>
        </div>
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-slideIn max-w-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            ✓
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">{toastTitle || "Notification"}</span>
            {toastText && (
              <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toastText}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
