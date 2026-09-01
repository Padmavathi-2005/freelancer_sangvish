"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useAdmin } from "@/app/admin/AdminContext";
import { useLanguage } from "@/context/LanguageContext";

interface PaypalKeys {
  client_id: string;
  secret_key: string;
}

export default function PaymentSettingsTab() {
  const { t } = useLanguage();
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecretKey, setPaypalSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Stripe Gateway state
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [stripeMsg, setStripeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // UPI / Bank details stored per platform admin
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: any[] = await res.json();
          const paypal = data.find((s: any) => s.setting_key === "paypal_keys");
          const stripe = data.find((s: any) => s.setting_key === "stripe_keys");
          const upi   = data.find((s: any) => s.setting_key === "upi_id");
          const bank  = data.find((s: any) => s.setting_key === "bank_details");

          if (paypal?.setting_value) {
            const v: PaypalKeys = typeof paypal.setting_value === "string"
              ? JSON.parse(paypal.setting_value)
              : paypal.setting_value;
            setPaypalClientId(v.client_id || "");
            setPaypalSecretKey(v.secret_key || "");
          } else {
            setPaypalClientId("your_paypal_client_id");
            setPaypalSecretKey("your_paypal_secret_key");
          }

          if (stripe?.setting_value) {
            const v = typeof stripe.setting_value === "string"
              ? JSON.parse(stripe.setting_value)
              : stripe.setting_value;
            setStripePublicKey(v.public_key || "");
            setStripeSecretKey(v.secret_key || "");
          } else {
            setStripePublicKey("your_stripe_public_key");
            setStripeSecretKey("your_stripe_secret_key");
          }
          if (upi?.setting_value) {
            const v = typeof upi.setting_value === "string"
              ? JSON.parse(upi.setting_value)
              : upi.setting_value;
            setUpiId(v.upi_id || "");
          }
          if (bank?.setting_value) {
            const v = typeof bank.setting_value === "string"
              ? JSON.parse(bank.setting_value)
              : bank.setting_value;
            setBankName(v.bank_name || "");
            setAccountNumber(v.account_number || "");
            setIfsc(v.ifsc || "");
            setAccountHolder(v.account_holder || "");
          }
        }
      } catch (e) {
        console.error("Failed to load payment settings:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSetting = async (key: string, value: object) => {
    const token = localStorage.getItem("adminToken");
    await fetch(`${API_URL}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category: "payment", setting_key: key, setting_value: value }),
    });
  };

  const handleSavePaypal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalClientId.trim() || !paypalSecretKey.trim()) {
      setSaveMsg({ type: "error", text: t("admin_both_paypal_required", "Both PayPal Client ID and Secret Key are required.") });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveSetting("paypal_keys", { client_id: paypalClientId.trim(), secret_key: paypalSecretKey.trim() });
      setSaveMsg({ type: "success", text: t("admin_paypal_success", "PayPal API credentials saved successfully.") });
    } catch {
      setSaveMsg({ type: "error", text: t("admin_paypal_error", "Failed to save PayPal settings. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripePublicKey.trim() || !stripeSecretKey.trim()) {
      setStripeMsg({ type: "error", text: t("admin_both_stripe_required", "Both Stripe Public Key and Secret Key are required.") });
      return;
    }
    setSavingStripe(true);
    setStripeMsg(null);
    try {
      await saveSetting("stripe_keys", { public_key: stripePublicKey.trim(), secret_key: stripeSecretKey.trim() });
      setStripeMsg({ type: "success", text: t("admin_stripe_success", "Stripe API credentials saved successfully.") });
    } catch {
      setStripeMsg({ type: "error", text: t("admin_stripe_error", "Failed to save Stripe settings. Please try again.") });
    } finally {
      setSavingStripe(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMsg(null);
    try {
      if (upiId.trim()) {
        await saveSetting("upi_id", { upi_id: upiId.trim() });
      }
      await saveSetting("bank_details", {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc: ifsc.trim(),
        account_holder: accountHolder.trim(),
      });
      setBankMsg({ type: "success", text: t("admin_payout_success", "Payout account details saved successfully.") });
    } catch {
      setBankMsg({ type: "error", text: t("admin_payout_error", "Failed to save bank details. Please try again.") });
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400">{t("admin_loading_payment", "Loading payment configuration...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left rtl:text-right">

      {/* HEADER */}
      <div className="space-y-1 text-left rtl:text-right">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 flex-row rtl:flex-row-reverse text-left rtl:text-right">
          <span>💳</span> {t("admin_payment_settings_title", "Payment Settings")}
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider text-left rtl:text-right">
          {t("admin_payment_settings_desc", "Configure platform payment gateways, payout account details, and future integrations.")}
        </p>
      </div>

      {/* ───── PAYPAL GATEWAY ───── */}
      <div className={`border rounded-xl shadow-sm overflow-hidden ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"} text-left rtl:text-right`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
          <div className="flex items-center gap-3 flex-row rtl:flex-row-reverse text-left rtl:text-right">
            <div className="w-8 h-8 rounded-xl payment-logo-bg border border-slate-200/80 flex items-center justify-center shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.072 6.587c0 3.968-3.06 6.75-7.391 6.75H9.6l-1.077 6.81h-3.41l2.223-14.07h6.666c4.053 0 6.07 1.84 6.07 4.51z" fill="#00457C" />
                <path d="M17.848 9.087c0 3.968-3.06 6.75-7.392 6.75H7.376l-1.077 6.81H2.889l2.223-14.07h6.666c4.054 0 6.07 1.84 6.07 4.51z" fill="#0079C1" opacity="0.85" />
              </svg>
            </div>
            <div className="text-left rtl:text-right">
              <h2 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"} text-left rtl:text-right`}>{t("admin_paypal_gateway", "PayPal Gateway")}</h2>
              <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">{t("admin_paypal_gateway_desc", "Sandbox / Live API credentials for PayPal payment processing.")}</p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-black uppercase shrink-0">Sandbox</span>
        </div>

        <form onSubmit={handleSavePaypal} className="p-6 space-y-5 text-left rtl:text-right">
          <div className="grid grid-cols-1 gap-5 text-left rtl:text-right">
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left rtl:text-right">
                {t("admin_paypal_client_id", "PayPal Client ID")}
              </label>
              <input
                type="text"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="ATz535WHbPQjJg..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right"
              />
            </div>

            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left rtl:text-right">
                {t("admin_paypal_secret_key", "PayPal Secret Key")}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={paypalSecretKey}
                  onChange={(e) => setPaypalSecretKey(e.target.value)}
                  placeholder="ELbaeu4ByL74re4E..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 pr-10 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer border-none bg-transparent"
                >
                  {showSecret ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {saveMsg && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
              {saveMsg.text}
            </div>
          )}

          <div className={`flex items-center justify-between pt-2 border-t ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
            <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">
              {t("admin_paypal_keys_stored_desc", "Keys are stored securely in the platform settings database.")}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-800 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 border border-slate-700 dark:border-slate-600"
            >
              {saving ? t("admin_saving_btn", "Saving...") : t("admin_save_paypal_keys", "Save PayPal Keys")}
            </button>
          </div>
        </form>
      </div>

      {/* ───── STRIPE GATEWAY ───── */}
      <div className={`border rounded-xl shadow-sm overflow-hidden ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"} text-left rtl:text-right`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
          <div className="flex items-center gap-3 flex-row rtl:flex-row-reverse text-left rtl:text-right">
            <div className="w-8 h-8 rounded-xl payment-logo-bg border border-slate-200/80 flex items-center justify-center shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#635BFF] fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.962 10.3c0-1.03-.616-1.54-1.637-1.54-.925 0-1.492.42-1.492 1.22 0 .97 1.002 1.25 2.158 1.57 1.295.36 2.673.74 2.673 2.37 0 1.94-1.572 2.76-3.15 2.76-1.742 0-3.238-.72-3.238-2.61v-.15h1.76c.077.85.74 1.18 1.478 1.18 1.002 0 1.48-.48 1.48-1.09 0-.96-.913-1.2-2.073-1.52-1.32-.36-2.587-.76-2.587-2.31 0-1.8 1.39-2.59 3.017-2.59 1.492 0 2.91.56 2.91 2.3v.19h-1.83z" />
              </svg>
            </div>
            <div className="text-left rtl:text-right">
              <h2 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"} text-left rtl:text-right`}>{t("admin_stripe_gateway", "Stripe Gateway")}</h2>
              <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">{t("admin_stripe_gateway_desc", "Sandbox / Live API credentials for Stripe payment processing.")}</p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-black uppercase shrink-0">Sandbox</span>
        </div>

        <form onSubmit={handleSaveStripe} className="p-6 space-y-5 text-left rtl:text-right">
          <div className="grid grid-cols-1 gap-5 text-left rtl:text-right">
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left rtl:text-right">
                {t("admin_stripe_public_key", "Stripe Public Key")}
              </label>
              <input
                type="text"
                value={stripePublicKey}
                onChange={(e) => setStripePublicKey(e.target.value)}
                placeholder="pk_test_51OuCU4..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right"
              />
            </div>

            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left rtl:text-right">
                {t("admin_stripe_secret_key", "Stripe Secret Key")}
              </label>
              <div className="relative">
                <input
                  type={showStripeSecret ? "text" : "password"}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder="sk_test_51OuCU4..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 pr-10 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right"
                />
                <button
                  type="button"
                  onClick={() => setShowStripeSecret(!showStripeSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer border-none bg-transparent"
                >
                  {showStripeSecret ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {stripeMsg && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg ${stripeMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
              {stripeMsg.text}
            </div>
          )}

          <div className={`flex items-center justify-between pt-2 border-t ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
            <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">
              {t("admin_paypal_keys_stored_desc", "Keys are stored securely in the platform settings database.")}
            </p>
            <button
              type="submit"
              disabled={savingStripe}
              className="bg-slate-800 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 border border-slate-700 dark:border-slate-600"
            >
              {savingStripe ? t("admin_saving_btn", "Saving...") : t("admin_save_stripe_keys", "Save Stripe Keys")}
            </button>
          </div>
        </form>
      </div>

      {/* ───── ADMIN PAYOUT ACCOUNT ───── */}
      <div className={`border rounded-xl shadow-sm overflow-hidden ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"} text-left rtl:text-right`}>
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border ${isDark ? "bg-slate-900 border-slate-800 text-teal-400" : "bg-teal-50 border-teal-100 text-teal-700"} shrink-0`}>🏦</div>
          <div className="text-left rtl:text-right">
            <h2 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"} text-left rtl:text-right`}>{t("admin_payout_account", "Admin Payout Account Details")}</h2>
            <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">{t("admin_payout_account_desc", "UPI and Bank account where real user withdrawal payments are received.")}</p>
          </div>
        </div>

        <form onSubmit={handleSaveBankDetails} className="p-6 space-y-5 text-left rtl:text-right">
          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left rtl:text-right">{t("admin_upi_id_label", "UPI ID (GPay / PhonePe / Paytm)")}</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="admin@okhdfcbank"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right"
            />
          </div>

          <div className={`border-t pt-5 space-y-1.5 ${isDark ? "border-slate-850" : "border-slate-100"} text-left rtl:text-right`}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 text-left rtl:text-right">{t("admin_bank_wire_details", "Bank Wire Transfer Details")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left rtl:text-right">
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left rtl:text-right">{t("admin_acc_holder_label", "Account Holder Name")}</label>
                <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="John Doe" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right" />
              </div>
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left rtl:text-right">{t("admin_bank_name_label", "Bank Name")}</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right" />
              </div>
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left rtl:text-right">{t("admin_acc_number_label", "Account Number")}</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="XXXX XXXX XXXX" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right" />
              </div>
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left rtl:text-right">{t("admin_ifsc_code_label", "IFSC Code")}</label>
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 transition text-left rtl:text-right" />
              </div>
            </div>
          </div>

          {bankMsg && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg ${bankMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
              {bankMsg.text}
            </div>
          )}

          <div className={`flex items-center justify-between pt-2 border-t ${isDark ? "border-slate-850" : "border-slate-100"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
            <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">
              {t("admin_payout_details_desc", "These details appear when users request withdrawals.")}
            </p>
            <button
              type="submit"
              disabled={savingBank}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-5 py-2 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 border border-teal-600 dark:border-teal-500"
            >
              {savingBank ? t("admin_saving_btn", "Saving...") : t("admin_save_bank_details", "Save Bank Details")}
            </button>
          </div>
        </form>
      </div>

      {/* ───── FUTURE INTEGRATIONS ───── */}
      <div className={`border rounded-xl shadow-sm overflow-hidden ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"} text-left rtl:text-right`}>
        <div className={`px-6 py-4 border-b ${isDark ? "border-slate-850" : "border-slate-100"} text-left rtl:text-right`}>
          <h2 className={`text-sm font-extrabold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
            <span>🔮</span> {t("admin_future_payment_integrations", "Future Payment Integrations")}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 text-left rtl:text-right">
            {t("admin_future_payment_integrations_desc", "Additional payment gateways planned for future integration.")}
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left rtl:text-right">
          {[
            { name: "Stripe", icon: "⚡", desc: t("admin_stripe_desc", "Card payments & subscriptions"), status: t("admin_coming_soon", "Coming Soon") },
            { name: "Razorpay", icon: "🇮🇳", desc: t("admin_razorpay_desc", "India-first payment gateway"), status: t("admin_coming_soon", "Coming Soon") },
            { name: "Crypto / USDT", icon: "₿", desc: t("admin_crypto_desc", "Blockchain wallet transfers"), status: t("admin_planned", "Planned") },
          ].map((gw) => (
            <div key={gw.name} className={`flex items-center gap-3 p-4 border rounded-xl opacity-60 select-none ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"} flex-row rtl:flex-row-reverse text-left rtl:text-right`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg shrink-0 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"}`}>
                {gw.icon}
              </div>
              <div className="min-w-0 text-left rtl:text-right">
                <p className={`text-xs font-black ${isDark ? "text-slate-200" : "text-slate-700"} text-left rtl:text-right`}>{gw.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold text-left rtl:text-right">{gw.desc}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black">{gw.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
