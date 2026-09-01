"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { FiCpu, FiPhone, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

interface ApiIntegrationsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

// Reusable masked input with show/hide toggle
function SecretInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "••••••••••••••••"}
        autoComplete="new-password"
        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
      />
      {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
    </div>
  );
}

export default function ApiIntegrationsTab({ handleSaveSetting }: ApiIntegrationsTabProps) {
  const { t } = useLanguage();
  // Gemini API
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [geminiEnabled, setGeminiEnabled] = useState(false);

  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [twilioMessagingServiceSid, setTwilioMessagingServiceSid] = useState("");

  const [saving, setSaving] = useState<"gemini" | "twilio" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; text: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, text: string) => {
    setToast({ type, title, text });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (!res.ok) return;
        const data = await res.json();

        const parse = (key: string) => {
          const item = data.find((s: any) => s.setting_key === key);
          if (!item?.setting_value) return null;
          const val = item.setting_value;
          if (typeof val === "string") { try { return JSON.parse(val); } catch { return val; } }
          return val;
        };

        const gemini = parse("gemini_api_settings");
        if (gemini && typeof gemini === "object") {
          if (gemini.api_key) setGeminiApiKey(gemini.api_key);
          if (gemini.model) setGeminiModel(gemini.model);
          if (typeof gemini.enabled === "boolean") setGeminiEnabled(gemini.enabled);
        }

        const twilio = parse("twilio_settings");
        if (twilio && typeof twilio === "object") {
          if (twilio.account_sid) setTwilioAccountSid(twilio.account_sid);
          if (twilio.auth_token) setTwilioAuthToken(twilio.auth_token);
          if (twilio.from_number) setTwilioFromNumber(twilio.from_number);
          if (typeof twilio.enabled === "boolean") setTwilioEnabled(twilio.enabled);
          if (twilio.messaging_service_sid) setTwilioMessagingServiceSid(twilio.messaging_service_sid);
        }
      } catch (e) {
        console.error("Failed to load API integration settings:", e);
      }
    };
    load();
  }, []);

  const saveGemini = async () => {
    setSaving("gemini");
    try {
      await handleSaveSetting("gemini_api_settings", {
        api_key: geminiApiKey,
        model: geminiModel,
        enabled: geminiEnabled,
      }, "gemini_api_settings");
      showToast("success", t("admin_api_gemini_saved_title", "Gemini API Saved"), t("admin_api_gemini_saved_desc", "Gemini API configuration updated successfully."));
    } catch {
      showToast("error", t("admin_api_save_failed_title", "Save Failed"), t("admin_api_gemini_failed_desc", "Could not save Gemini API settings. Try again."));
    } finally {
      setSaving(null);
    }
  };

  const saveTwilio = async () => {
    setSaving("twilio");
    try {
      await handleSaveSetting("twilio_settings", {
        account_sid: twilioAccountSid,
        auth_token: twilioAuthToken,
        from_number: twilioFromNumber,
        messaging_service_sid: twilioMessagingServiceSid,
        enabled: twilioEnabled,
      }, "twilio_settings");
      showToast("success", t("admin_api_twilio_saved_title", "Twilio Saved"), t("admin_api_twilio_saved_desc", "Twilio SMS configuration updated successfully."));
    } catch {
      showToast("error", t("admin_api_save_failed_title", "Save Failed"), t("admin_api_twilio_failed_desc", "Could not save Twilio settings. Try again."));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left text-slate-800">

      {/* ─── GEMINI API SECTION ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 text-left rtl:text-right">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 text-left rtl:text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <FiCpu className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-left rtl:text-right">
              <h3 className="text-sm font-black text-slate-800 text-left rtl:text-right">{t("admin_api_gemini_title", "Gemini API Integration")}</h3>
              <p className="text-xs text-slate-500 mt-0.5 text-left rtl:text-right">{t("admin_api_gemini_desc", "Power AI-based features like talent matching, summaries, and smart search using Google Gemini.")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-row rtl:flex-row-reverse">
            {/* Enable toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none flex-row rtl:flex-row-reverse">
              <div
                onClick={() => setGeminiEnabled((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 cursor-pointer ${geminiEnabled ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${geminiEnabled ? "translate-x-5" : ""}`} />
              </div>
              <span className={`text-xs font-bold ${geminiEnabled ? "text-teal-700" : "text-slate-400"}`}>
                {geminiEnabled ? t("admin_api_enabled", "Enabled") : t("admin_api_disabled", "Disabled")}
              </span>
            </label>
            <button
              onClick={saveGemini}
              disabled={saving === "gemini"}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer border-none whitespace-nowrap"
            >
              {saving === "gemini" ? t("admin_api_saving", "Saving…") : t("admin_api_save_gemini", "Save Gemini")}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SecretInput
            label={t("admin_api_gemini_key", "Gemini API Key")}
            hint={t("admin_api_gemini_key_hint", "Obtain from Google AI Studio → API Keys. Keep this secret.")}
            value={geminiApiKey}
            onChange={setGeminiApiKey}
            placeholder="AIza••••••••••••••••••••••••••••••••••••"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("admin_api_model", "Model")}</span>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition cursor-pointer"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Latest)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Powerful)</option>
              <option value="gemini-1.0-pro">gemini-1.0-pro (Stable)</option>
            </select>
            <p className="text-[10px] text-slate-400 font-medium">{t("admin_api_model_hint", "Choose the model based on speed vs. capability needs.")}</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5 flex items-start gap-2.5 text-left rtl:text-right">
          <FiCpu className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
          <div className="text-left rtl:text-right">
            <p className="text-xs font-black text-violet-700 mb-0.5 text-left rtl:text-right">{t("admin_api_get_gemini_key", "How to get your Gemini API Key")}</p>
            <p className="text-[11px] text-violet-600 font-medium text-left rtl:text-right">
              {t("admin_api_visit", "Visit")}{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-black hover:text-violet-900">
                aistudio.google.com/app/apikey
              </a>{" "}
              {t("admin_api_gemini_instructions", "→ Sign in with Google → Click \"Create API Key\" → Copy and paste above.")}
            </p>
          </div>
        </div>
      </div>

      {/* ─── TWILIO SMS SECTION ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 text-left rtl:text-right">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 text-left rtl:text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <FiPhone className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-left rtl:text-right">
              <h3 className="text-sm font-black text-slate-800 text-left rtl:text-right">{t("admin_api_twilio_title", "Twilio SMS Integration")}</h3>
              <p className="text-xs text-slate-505 mt-0.5 text-left rtl:text-right">{t("admin_api_twilio_desc", "Send OTP, verification, and notification SMS to users worldwide via Twilio.")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-row rtl:flex-row-reverse">
            <label className="flex items-center gap-2 cursor-pointer select-none flex-row rtl:flex-row-reverse">
              <div
                onClick={() => setTwilioEnabled((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 cursor-pointer ${twilioEnabled ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${twilioEnabled ? "translate-x-5" : ""}`} />
              </div>
              <span className={`text-xs font-bold ${twilioEnabled ? "text-teal-700" : "text-slate-400"}`}>
                {twilioEnabled ? t("admin_api_enabled", "Enabled") : t("admin_api_disabled", "Disabled")}
              </span>
            </label>
            <button
              onClick={saveTwilio}
              disabled={saving === "twilio"}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer border-none"
            >
              {saving === "twilio" ? t("admin_api_saving", "Saving…") : t("admin_api_save_twilio", "Save Twilio")}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SecretInput
            label={t("admin_api_twilio_sid", "Account SID")}
            hint={t("admin_api_twilio_sid_hint", "Found on your Twilio Console Dashboard.")}
            value={twilioAccountSid}
            onChange={setTwilioAccountSid}
            placeholder="AC••••••••••••••••••••••••••••••••"
          />

          <SecretInput
            label={t("admin_api_twilio_token", "Auth Token")}
            hint={t("admin_api_twilio_token_hint", "Secret auth token — never share this publicly.")}
            value={twilioAuthToken}
            onChange={setTwilioAuthToken}
            placeholder="••••••••••••••••••••••••••••••••"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("admin_api_twilio_from", "From Phone Number")}</span>
            <input
              type="text"
              value={twilioFromNumber}
              onChange={(e) => setTwilioFromNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition font-mono"
            />
            <p className="text-[10px] text-slate-400 font-medium">{t("admin_api_twilio_from_hint", "Include country code. e.g. +14155552671")}</p>
          </div>

          <SecretInput
            label={t("admin_api_twilio_msg_sid", "Messaging Service SID (Optional)")}
            hint={t("admin_api_twilio_msg_sid_hint", "Use a Messaging Service instead of a phone number for better deliverability.")}
            value={twilioMessagingServiceSid}
            onChange={setTwilioMessagingServiceSid}
            placeholder="MG••••••••••••••••••••••••••••••••"
          />
        </div>

        {/* Info banner */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5 text-left rtl:text-right">
          <FiPhone className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-left rtl:text-right">
            <p className="text-xs font-black text-red-700 mb-0.5 text-left rtl:text-right">{t("admin_api_get_twilio", "How to get Twilio credentials")}</p>
            <p className="text-[11px] text-red-650 font-medium text-left rtl:text-right">
              {t("admin_api_visit", "Visit")}{" "}
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-black hover:text-red-900">
                console.twilio.com
              </a>{" "}
              {t("admin_api_twilio_instructions", "→ Log in → Your Account SID and Auth Token appear on the Dashboard homepage. Buy a phone number under Phone Numbers → Manage → Buy a number.")}
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-fadeIn max-w-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">{toast.title || "Notification"}</span>
            {toast.text && (
              <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toast.text}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
