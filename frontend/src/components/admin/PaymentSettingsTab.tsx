"use client";

import React, { useState, useEffect } from "react";

interface PaypalKeys {
  client_id: string;
  secret_key: string;
}

export default function PaymentSettingsTab() {
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecretKey, setPaypalSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch("http://localhost:5000/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: any[] = await res.json();
          const paypal = data.find((s: any) => s.setting_key === "paypal_keys");
          const upi   = data.find((s: any) => s.setting_key === "upi_id");
          const bank  = data.find((s: any) => s.setting_key === "bank_details");

          if (paypal?.setting_value) {
            const v: PaypalKeys = typeof paypal.setting_value === "string"
              ? JSON.parse(paypal.setting_value)
              : paypal.setting_value;
            setPaypalClientId(v.client_id || "");
            setPaypalSecretKey(v.secret_key || "");
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
    await fetch("http://localhost:5000/api/admin/settings", {
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
      setSaveMsg({ type: "error", text: "Both PayPal Client ID and Secret Key are required." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveSetting("paypal_keys", { client_id: paypalClientId.trim(), secret_key: paypalSecretKey.trim() });
      setSaveMsg({ type: "success", text: "PayPal API credentials saved successfully." });
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save PayPal settings. Please try again." });
    } finally {
      setSaving(false);
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
      setBankMsg({ type: "success", text: "Payout account details saved successfully." });
    } catch {
      setBankMsg({ type: "error", text: "Failed to save bank details. Please try again." });
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400">Loading payment configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-slate-50/50">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <span>💳</span> Payment Settings
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          Configure platform payment gateways, payout account details, and future integrations.
        </p>
      </div>

      {/* ───── PAYPAL GATEWAY ───── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-base">🅿</div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">PayPal Gateway</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Sandbox / Live API credentials for PayPal payment processing.</p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-black uppercase">Sandbox</span>
        </div>

        <form onSubmit={handleSavePaypal} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                PayPal Client ID
              </label>
              <input
                type="text"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="ATz535WHbPQjJg..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                PayPal Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={paypalSecretKey}
                  onChange={(e) => setPaypalSecretKey(e.target.value)}
                  placeholder="ELbaeu4ByL74re4E..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
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

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold">
              Keys are stored securely in the platform settings database.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 py-2 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save PayPal Keys"}
            </button>
          </div>
        </form>
      </div>

      {/* ───── ADMIN PAYOUT ACCOUNT ───── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-base">🏦</div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Admin Payout Account Details</h2>
            <p className="text-[10px] text-slate-400 font-semibold">UPI and Bank account where real user withdrawal payments are received.</p>
          </div>
        </div>

        <form onSubmit={handleSaveBankDetails} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">UPI ID (GPay / PhonePe / Paytm)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="admin@okhdfcbank"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Bank Wire Transfer Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Holder Name</label>
                <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="XXXX XXXX XXXX" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">IFSC Code</label>
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-700 transition" />
              </div>
            </div>
          </div>

          {bankMsg && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg ${bankMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
              {bankMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold">
              These details appear when users request withdrawals.
            </p>
            <button
              type="submit"
              disabled={savingBank}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-5 py-2 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {savingBank ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>

      {/* ───── FUTURE INTEGRATIONS ───── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>🔮</span> Future Payment Integrations
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Additional payment gateways planned for future integration.
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Stripe", icon: "⚡", desc: "Card payments & subscriptions", status: "Coming Soon" },
            { name: "Razorpay", icon: "🇮🇳", desc: "India-first payment gateway", status: "Coming Soon" },
            { name: "Crypto / USDT", icon: "₿", desc: "Blockchain wallet transfers", status: "Planned" },
          ].map((gw) => (
            <div key={gw.name} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60 select-none">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">
                {gw.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700">{gw.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{gw.desc}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 font-black">{gw.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
