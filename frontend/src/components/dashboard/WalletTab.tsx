import React, { useState, useEffect } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";
import { FaStripe, FaPaypal, FaWallet, FaCreditCard } from "react-icons/fa";
import { API_URL } from "@/config/api";

export default function WalletTab() {
  const { t } = useLanguage();
  const {
    walletInfo,
    loadingWallet,
    withdrawAmount,
    setWithdrawAmount,
    withdrawMethod,
    setWithdrawMethod,
    withdrawAccount,
    setWithdrawAccount,
    depositAmount,
    setDepositAmount,
    handleWithdrawSubmit,
    handleDepositSubmit,
    userRole,
    siteName,
    triggerToast,
    fetchWalletInfo
  } = useDashboard();

  const [depositMethod, setDepositMethod] = useState<"stripe" | "paypal" | "simulated">("stripe");
  const [depositLoading, setDepositLoading] = useState(false);
  const [stripeReturnHandled, setStripeReturnHandled] = useState(false);
  const stripeLockRef = React.useRef(false);

  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accNum, setAccNum] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (setWithdrawMethod) {
      setWithdrawMethod("Bank Transfer");
    }
  }, [setWithdrawMethod]);

  useEffect(() => {
    if (typeof window === "undefined" || stripeReturnHandled || stripeLockRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_deposit_success") === "1") {
      stripeLockRef.current = true;
      setStripeReturnHandled(true);
      const sessionId = params.get("session_id");
      const amount = params.get("amount");
      if (sessionId && amount) {
        const confirmStripeDeposit = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/wallet/deposit/stripe/confirm`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ session_id: sessionId, amount })
            });
            const data = await res.json();
            if (res.ok) {
              triggerToast("success", `Fund added successfully into ${siteName || "Buy2Lancer"} wallet!`, `$${parseFloat(amount).toFixed(2)} has been credited to your active balance.`);
              // Clear search params
              window.history.replaceState({}, document.title, window.location.pathname);
              if (fetchWalletInfo) fetchWalletInfo();
            } else {
              triggerToast("error", data.message || "Failed to confirm Stripe deposit.");
            }
          } catch (e) {
            triggerToast("error", "Network error confirming Stripe deposit.");
          }
        };
        confirmStripeDeposit();
      }
    } else if (params.get("stripe_deposit_cancel") === "1") {
      setStripeReturnHandled(true);
      triggerToast("warning", "Stripe deposit cancelled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [stripeReturnHandled, triggerToast, fetchWalletInfo]);

  const handleDepositClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      triggerToast("error", "Please provide a valid deposit amount.");
      return;
    }

    setDepositLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (depositMethod === "stripe") {
        const res = await fetch(`${API_URL}/wallet/deposit/stripe/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ amount: parseFloat(depositAmount) })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return; // Redirecting
        } else {
          triggerToast("error", data.message || "Failed to initiate Stripe deposit.");
        }
      } else {
        // PayPal (simulated) or test simulated deposit
        const res = await fetch(`${API_URL}/wallet/deposit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: parseFloat(depositAmount),
            method: depositMethod
          })
        });
        const data = await res.json();
        if (res.ok) {
          if (depositMethod === "paypal") {
            triggerToast("success", `PayPal deposit of $${parseFloat(depositAmount).toFixed(2)} confirmed!`);
          } else {
            triggerToast("success", "Funds added successfully (Test Simulation)!");
          }
          setDepositAmount("");
          if (fetchWalletInfo) fetchWalletInfo();
        } else {
          triggerToast("error", data.message || "Failed to deposit funds.");
        }
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to deposit funds.");
    } finally {
      setDepositLoading(false);
    }
  };

  const translateTxDescription = (desc: string) => {
    if (!desc) return "";
    
    if (desc === "Simulated account deposit") {
      return t("simulated_account_deposit", "Simulated account deposit");
    }
    if (desc === "PayPal Deposit (Simulated)") {
      return t("paypal_deposit_simulated", "PayPal Deposit (Simulated)");
    }
    if (desc.startsWith("Stripe Deposit (Session:")) {
      const sessionId = desc.replace("Stripe Deposit (Session: ", "").replace(")", "");
      return t("stripe_deposit_session", "Stripe Deposit (Session: {{session_id}})").replace("{{session_id}}", sessionId);
    }
    if (desc.startsWith("Escrow refund due to freelancer cancelling work:")) {
      const projectName = desc.replace("Escrow refund due to freelancer cancelling work:", "").trim();
      return t("escrow_refund_cancelled_work", "Escrow refund due to freelancer cancelling work: {{projectName}}").replace("{{projectName}}", projectName);
    }
    if (desc.startsWith("Escrow payment for contract milestones:")) {
      const projectName = desc.replace("Escrow payment for contract milestones:", "").trim();
      return t("escrow_payment_milestones", "Escrow payment for contract milestones: {{projectName}}").replace("{{projectName}}", projectName);
    }
    if (desc.startsWith("Withdrawal request via")) {
      const method = desc.replace("Withdrawal request via", "").trim();
      return t("withdrawal_request_via", "Withdrawal request via {{method}}").replace("{{method}}", method);
    }
    if (desc === "Manual platform wallet release payout") {
      return t("manual_platform_payout", "Manual platform wallet release payout");
    }
    if (desc === "Referral sign-up bonus reward") {
      return t("referral_signup_bonus", "Referral sign-up bonus reward");
    }
    if (desc.startsWith("Referral reward for user_id =")) {
      const userId = desc.replace("Referral reward for user_id =", "").trim();
      return t("referral_reward_for", "Referral reward for user_id = {{userId}}").replace("{{userId}}", userId);
    }
    if (desc.startsWith("Affiliate commission reward for commission_id =")) {
      const commissionId = desc.replace("Affiliate commission reward for commission_id =", "").trim();
      return t("affiliate_commission_reward", "Affiliate commission reward for commission_id = {{commissionId}}").replace("{{commissionId}}", commissionId);
    }

    return desc;
  };

  useEffect(() => {
    if (holderName || bankName || branchName || ifsc || accNum) {
      setWithdrawAccount(
        `Holder: ${holderName.trim()} | Bank: ${bankName.trim()} | Branch: ${branchName.trim()} | IFSC: ${ifsc.trim()} | Acc: ${accNum.trim()}`
      );
    } else {
      setWithdrawAccount("");
    }
  }, [holderName, bankName, branchName, ifsc, accNum, setWithdrawAccount]);

  if (loadingWallet && !walletInfo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading wallet ledger...</p>
        </div>
      </div>
    );
  }

  const wallet = walletInfo?.wallet;
  const transactions = walletInfo?.transactions || [];
  const withdrawals = walletInfo?.withdrawals || [];
  const balance = parseFloat(wallet?.balance || "0.00");
  const minWithdrawalAmount = parseFloat(wallet?.min_withdrawal_amount || "10.00");

  const pendingTotal = withdrawals
    .filter((w: any) => w.status === "Pending")
    .reduce((acc: number, w: any) => acc + parseFloat(w.amount || "0"), 0);

  const availableBalance = Math.max(0, balance - pendingTotal);

  return (
    <div className="space-y-5 sm:space-y-8 w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-credit-card text-teal-700"></i> {t("my_digital_wallet_header", "My Digital Wallet")}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t("my_digital_wallet_desc", "Manage your virtual funds, payouts, and deposit records.")}
        </p>
      </div>

      {/* Prominent Pending Sign-Up Bonus Notification Banner */}
      {parseFloat(wallet?.pending_bonus_balance || "0") > 0 && (
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn font-sans">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-left">
                <h4 className="text-sm font-black text-white">
                  {t("signup_bonus_requested_title", "Sign-Up Bonus Requested:")} <span className="text-amber-300 font-extrabold text-base">${parseFloat(wallet.pending_bonus_balance).toFixed(2)}</span>
                </h4>
                <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md shadow-xs inline-flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse shrink-0" />
                  {t("awaiting_admin_approval_badge", "Awaiting Admin Approval")}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed text-left">
                {t("signup_bonus_desc_prefix", "Your ")}
                <strong className="text-amber-300">${parseFloat(wallet.pending_bonus_balance).toFixed(2)} {t("signup_bonus_desc_highlight", "Sign-up Bonus")}</strong>
                {t("signup_bonus_desc_suffix", " has been requested upon profile setup. Once reviewed and approved by Admin, it will be credited to your active balance!")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD MOCKUP & ACTIONS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Glassmorphic Credit Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 p-4 sm:p-6 text-white shadow-xl shadow-teal-900/10 min-h-[170px] flex flex-col justify-between">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl -ml-8 -mb-8"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/95">
                  {t("wallet_card_title", "{{siteName}} Wallet").replace("{{siteName}}", siteName || "Buy2Lancer")}
                </p>
                <h3 className="text-lg font-black tracking-tight text-white mt-1">
                  {userRole === "client" ? t("client_ledger_label", "Client Ledger") : t("freelancer_earnings_label", "Freelancer Earnings")}
                </h3>
              </div>
              <span className="text-xl font-black tracking-tight text-white/90">VISA</span>
            </div>

            <div className="z-10 mt-6">
              <p className="text-2xl font-black tracking-tight text-white select-all">
                ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-white/85 font-black uppercase tracking-wider">
                  {t("active_virtual_balance_label", "Active Virtual Balance (USD)")}
                </span>
                {pendingTotal > 0 && (
                  <span className="text-[9px] font-black bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-300/30">
                    ${pendingTotal.toFixed(2)} {t("pending_review_label", "Pending Review")}
                  </span>
                )}
              </div>
              {parseFloat(wallet?.pending_bonus_balance || "0") > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 select-none">
                  <span>🎁</span>
                  <span>{t("pending_admin_release_badge", "Pending Admin Release {amount}").replace("{amount}", "$" + parseFloat(wallet.pending_bonus_balance).toFixed(2))}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-2 flex-wrap text-[10px] text-white/90 font-black z-10 mt-3.5">
              <span className="whitespace-nowrap shrink-0">ACC #### #### {wallet?.wallet_id || "0"}</span>
              <span className="inline-flex items-center gap-1.5 uppercase bg-white !text-teal-900 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                {t("wallet_status_active", "STATUS: ACTIVE")}
              </span>
            </div>
          </div>

          {/* Test Deposit Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-teal-600"></i> {t("add_funds_header", "Add Funds")}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {t("add_funds_desc", "Add virtual funds to your wallet instantly.")}
              </p>
            </div>

            <form onSubmit={handleDepositClick} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={t("amount_placeholder_eg", "Amount (e.g. 500)")}
                  min="1"
                  step="0.01"
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                  {t("select_payment_method", "Select Deposit Method")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["stripe", "paypal", "simulated"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDepositMethod(m)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                        depositMethod === m
                          ? "border-teal-700 bg-teal-50/20 text-teal-700 shadow-xs"
                          : "border-slate-150 hover:border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {m === "stripe" && <FaStripe className={`w-8 h-4 ${depositMethod === "stripe" ? "text-teal-700" : "text-slate-400"}`} />}
                      {m === "paypal" && <FaPaypal className={`w-4 h-4 mb-0.5 ${depositMethod === "paypal" ? "text-teal-700" : "text-slate-400"}`} />}
                      {m === "simulated" && <FaWallet className={`w-4 h-4 mb-0.5 ${depositMethod === "simulated" ? "text-teal-700" : "text-slate-400"}`} />}
                      <span className="text-[9px] font-black mt-0.5 capitalize">
                        {m === "simulated" ? t("simulated_method", "Simulated") : m}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-md shadow-teal-700/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {depositLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{t("processing", "Processing...")}</span>
                  </>
                ) : (
                  <>
                    {depositMethod === "stripe" && <FaCreditCard className="w-3.5 h-3.5" />}
                    {depositMethod === "paypal" && <FaPaypal className="w-3.5 h-3.5" />}
                    {depositMethod === "simulated" && <FaWallet className="w-3.5 h-3.5" />}
                    <span>
                      {depositMethod === "stripe"
                        ? t("btn_deposit_stripe", "Pay with Stripe")
                        : depositMethod === "paypal"
                        ? t("btn_deposit_paypal", "Pay with PayPal")
                        : t("btn_add_funds", "Add Funds")}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* WITHDRAWAL FORM */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm h-full space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-money-bill-transfer text-slate-700"></i> {t("request_withdrawal_header", "Request Fund Withdrawal / Payout")}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {t("request_withdrawal_desc", "Enter bank account details and payout amount. Admin will review the request and process it.")}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const errors: { [key: string]: string } = {};

                const numAmount = parseFloat(withdrawAmount);
                if (!withdrawAmount || isNaN(numAmount) || numAmount <= 0) {
                  errors.withdrawAmount = "Please enter a valid withdrawal amount.";
                } else if (numAmount > availableBalance) {
                  errors.withdrawAmount = pendingTotal > 0
                    ? `Amount ($${numAmount.toFixed(2)}) exceeds available balance ($${availableBalance.toFixed(2)}). You have $${pendingTotal.toFixed(2)} in pending requests.`
                    : `Amount ($${numAmount.toFixed(2)}) exceeds available balance ($${availableBalance.toFixed(2)}).`;
                } else if (numAmount < minWithdrawalAmount) {
                  errors.withdrawAmount = `Minimum withdrawal amount is $${minWithdrawalAmount.toFixed(2)}.`;
                }

                if (!holderName.trim()) {
                  errors.holderName = "Account holder name is required.";
                } else if (holderName.trim().length < 2) {
                  errors.holderName = "Holder name must be at least 2 characters.";
                } else if (holderName.trim().length > 50) {
                  errors.holderName = "Holder name cannot exceed 50 characters.";
                } else if (!/^[a-zA-Z\s.'-]+$/.test(holderName.trim())) {
                  errors.holderName = "Holder name should only contain letters and spaces.";
                }

                if (!bankName.trim()) {
                  errors.bankName = "Bank name is required.";
                } else if (bankName.trim().length < 2) {
                  errors.bankName = "Bank name must be at least 2 characters.";
                } else if (bankName.trim().length > 50) {
                  errors.bankName = "Bank name cannot exceed 50 characters.";
                }

                if (!accNum.trim()) {
                  errors.accNum = "Account number is required.";
                } else if (!/^\d{5,30}$/.test(accNum.trim())) {
                  errors.accNum = "Account number must be between 5 and 30 digits.";
                }

                if (!ifsc.trim()) {
                  errors.ifsc = "IFSC/SWIFT code is required.";
                } else if (!/^[A-Z0-9]{4,11}$/i.test(ifsc.trim())) {
                  errors.ifsc = "IFSC/SWIFT code must be 4 to 11 uppercase letters/digits.";
                }

                if (!branchName.trim()) {
                  errors.branchName = "Branch name is required.";
                } else if (branchName.trim().length < 2) {
                  errors.branchName = "Branch name must be at least 2 characters.";
                } else if (branchName.trim().length > 50) {
                  errors.branchName = "Branch name cannot exceed 50 characters.";
                }

                setFormErrors(errors);

                if (Object.keys(errors).length > 0) {
                  return;
                }

                handleWithdrawSubmit(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {t("amount_to_withdraw_label", "Amount to Withdraw (USD)")}
                  </label>
                  {availableBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawAmount(availableBalance.toFixed(2));
                        setFormErrors((prev) => ({ ...prev, withdrawAmount: "" }));
                      }}
                      className="text-[10px] font-extrabold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-wallet text-[9px]"></i> {t("use_max_label", "Use Max")} (${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWithdrawAmount(val);
                    const numVal = parseFloat(val);
                    if (val && numVal > availableBalance) {
                      setFormErrors((prev) => ({
                        ...prev,
                        withdrawAmount: pendingTotal > 0
                          ? `Amount ($${numVal.toFixed(2)}) exceeds available balance ($${availableBalance.toFixed(2)}). You have $${pendingTotal.toFixed(2)} in pending review.`
                          : `Amount ($${numVal.toFixed(2)}) exceeds available balance ($${availableBalance.toFixed(2)}).`
                      }));
                    } else if (val && numVal < minWithdrawalAmount) {
                      setFormErrors((prev) => ({ ...prev, withdrawAmount: `Minimum withdrawal amount is $${minWithdrawalAmount.toFixed(2)}.` }));
                    } else {
                      setFormErrors((prev) => ({ ...prev, withdrawAmount: "" }));
                    }
                  }}
                  placeholder={t("enter_amount_placeholder", "Enter amount")}
                  min={minWithdrawalAmount}
                  max={availableBalance > 0 ? availableBalance : 0}
                  step="0.01"
                  required
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    formErrors.withdrawAmount || (withdrawAmount && parseFloat(withdrawAmount) > availableBalance)
                      ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:border-rose-600 ring-1 ring-rose-500/20"
                      : "border-slate-200 focus:border-teal-700"
                  }`}
                />
                {(formErrors.withdrawAmount || (withdrawAmount && parseFloat(withdrawAmount) > availableBalance)) && (
                  <p className="text-[11px] font-extrabold text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80 mt-1 shadow-xs">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 text-xs shrink-0"></i>
                    <span>
                      {formErrors.withdrawAmount ||
                        `Amount ($${parseFloat(withdrawAmount || "0").toFixed(2)}) exceeds available balance ($${availableBalance.toFixed(2)}).`}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t("account_holder_name_label", "Account Holder Name")}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {holderName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={holderName}
                    maxLength={50}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHolderName(val);
                      if (val.trim() && !/^[a-zA-Z\s.'-]+$/.test(val.trim())) {
                        setFormErrors((prev) => ({ ...prev, holderName: "Only letters and spaces allowed." }));
                      } else if (val.trim() && val.trim().length < 2) {
                        setFormErrors((prev) => ({ ...prev, holderName: "Minimum 2 characters required." }));
                      } else if (val.length >= 50) {
                        setFormErrors((prev) => ({ ...prev, holderName: "Maximum 50 characters limit reached." }));
                      } else {
                        setFormErrors((prev) => ({ ...prev, holderName: "" }));
                      }
                    }}
                    placeholder={t("enter_full_name_placeholder", "Enter full name")}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      formErrors.holderName ? "border-rose-500 bg-rose-50/40" : "border-slate-200 focus:border-teal-700"
                    }`}
                  />
                  {formErrors.holderName && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation"></i> {formErrors.holderName}
                    </p>
                  )}
                </div>
 
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t("bank_name_label", "Bank Name")}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {bankName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={bankName}
                    maxLength={50}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBankName(val);
                      if (val.trim() && val.trim().length < 2) {
                        setFormErrors((prev) => ({ ...prev, bankName: "Minimum 2 characters required." }));
                      } else if (val.length >= 50) {
                        setFormErrors((prev) => ({ ...prev, bankName: "Maximum 50 characters limit reached." }));
                      } else {
                        setFormErrors((prev) => ({ ...prev, bankName: "" }));
                      }
                    }}
                    placeholder={t("bank_name_placeholder_eg", "e.g. HDFC Bank, Chase")}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      formErrors.bankName ? "border-rose-500 bg-rose-50/40" : "border-slate-200 focus:border-teal-700"
                    }`}
                  />
                  {formErrors.bankName && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation"></i> {formErrors.bankName}
                    </p>
                  )}
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t("account_number_label", "Account Number")}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {accNum.length}/30
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={accNum}
                    maxLength={30}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); // Allow digits only
                      setAccNum(val);
                      if (val && (val.length < 5 || val.length > 30)) {
                        setFormErrors((prev) => ({ ...prev, accNum: "5 to 30 digits required." }));
                      } else {
                        setFormErrors((prev) => ({ ...prev, accNum: "" }));
                      }
                    }}
                    placeholder={t("enter_account_number_placeholder", "Enter account number (digits only)")}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      formErrors.accNum ? "border-rose-500 bg-rose-50/40" : "border-slate-200 focus:border-teal-700"
                    }`}
                  />
                  {formErrors.accNum && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation"></i> {formErrors.accNum}
                    </p>
                  )}
                </div>
 
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t("ifsc_swift_code_label", "IFSC / SWIFT Code")}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {ifsc.length}/11
                    </span>
                  </div>
                  <input
                    type="text"
                    value={ifsc}
                    maxLength={11}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setIfsc(val);
                      if (val.trim() && !/^[A-Z0-9]{4,11}$/.test(val.trim())) {
                        setFormErrors((prev) => ({ ...prev, ifsc: "4 to 11 uppercase letters/digits required." }));
                      } else {
                        setFormErrors((prev) => ({ ...prev, ifsc: "" }));
                      }
                    }}
                    placeholder={t("enter_code_placeholder", "Enter code")}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition uppercase ${
                      formErrors.ifsc ? "border-rose-500 bg-rose-50/40" : "border-slate-200 focus:border-teal-700"
                    }`}
                  />
                  {formErrors.ifsc && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation"></i> {formErrors.ifsc}
                    </p>
                  )}
                </div>
 
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t("branch_name_label", "Branch Name")}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {branchName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={branchName}
                    maxLength={50}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBranchName(val);
                      if (val.trim() && val.trim().length < 2) {
                        setFormErrors((prev) => ({ ...prev, branchName: "Minimum 2 characters required." }));
                      } else if (val.length >= 50) {
                        setFormErrors((prev) => ({ ...prev, branchName: "Maximum 50 characters limit reached." }));
                      } else {
                        setFormErrors((prev) => ({ ...prev, branchName: "" }));
                      }
                    }}
                    placeholder={t("enter_branch_name_placeholder", "Enter branch name")}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      formErrors.branchName ? "border-rose-500 bg-rose-50/40" : "border-slate-200 focus:border-teal-700"
                    }`}
                  />
                  {formErrors.branchName && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation"></i> {formErrors.branchName}
                    </p>
                  )}
                </div>
              </div>
 
              <button
                type="submit"
                disabled={
                  balance <= 0 ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > balance ||
                  parseFloat(withdrawAmount) < 10 ||
                  !holderName.trim() ||
                  holderName.trim().length > 50 ||
                  !bankName.trim() ||
                  bankName.trim().length > 50 ||
                  !accNum.trim() ||
                  accNum.trim().length > 30 ||
                  !ifsc.trim() ||
                  ifsc.trim().length > 11 ||
                  !branchName.trim() ||
                  branchName.trim().length > 50 ||
                  Object.values(formErrors).some((err) => err !== "")
                }
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6 py-2.5 text-xs font-bold transition shadow-md shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-paper-plane"></i> {t("btn_submit_withdrawal_request", "Submit Withdrawal Request")}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* WITHDRAWAL REQUESTS LOG */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <i className="fa-solid fa-clock-rotate-left text-slate-700"></i> {t("payout_withdrawal_requests_header", "Payout Withdrawal Requests")}
        </h2>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold text-center py-6">
            {t("no_withdrawal_requests_msg", "No withdrawal requests submitted yet.")}
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-start text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("req_id_col", "Req ID")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("date_col", "Date")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("method_col", "Method")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("payout_target_col", "Payout Target")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-end">{t("amount_col", "Amount")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-end">{t("status_col", "Status")}</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {withdrawals.map((w: any) => (
                  <tr key={w.request_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-start">#{w.request_id}</td>
                    <td className="py-3 px-3 text-[10px] text-slate-500 whitespace-nowrap text-start">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-start">{w.payment_method}</td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-slate-500 text-start" title={w.account_details}>
                      {w.account_details}
                    </td>
                    <td className="py-3 px-3 text-slate-855 whitespace-nowrap text-end">
                      ${parseFloat(w.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-end">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full inline-block ${
                          w.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : w.status === "Rejected"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                        }`}
                      >
                        {t(w.status.toLowerCase(), w.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <i className="fa-solid fa-receipt text-slate-700"></i> {t("wallet_transactions_log_header", "Wallet Transactions Log")}
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold text-center py-6">
            {t("no_transaction_records_msg", "No transaction records found.")}
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-start text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("tx_id_col", "Tx ID")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("date_col", "Date")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start">{t("type_col", "Type")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-start min-w-[220px]">{t("description_col", "Description")}</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-end">{t("amount_col", "Amount")}</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {transactions.map((tx: any) => {
                  const isDeposit = tx.type === "Deposit";
                  const isIncoming = tx.receiver_wallet_id === wallet?.wallet_id;
                  
                  let displayAmt = `$${parseFloat(tx.amount).toFixed(2)}`;
                  let amtStyle = "text-slate-800";

                  if (isDeposit || isIncoming) {
                    displayAmt = `+$${parseFloat(tx.amount).toFixed(2)}`;
                    amtStyle = "text-emerald-600";
                  } else {
                    displayAmt = `-$${parseFloat(tx.amount).toFixed(2)}`;
                    amtStyle = "text-slate-500";
                  }

                  return (
                    <tr key={tx.transaction_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-start">TX-{tx.transaction_id}</td>
                      <td className="py-3 px-3 text-[10px] text-slate-500 whitespace-nowrap text-start">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-[10px] whitespace-nowrap text-start">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold capitalize">
                          {t(String(tx.type || "").toLowerCase(), String(tx.type || "").replace(/_/g, " "))}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-semibold min-w-[220px] max-w-[360px] text-start" title={translateTxDescription(tx.description)}>
                        <div className="leading-snug">{translateTxDescription(tx.description)}</div>
                        {parseFloat(tx.commission_amount || "0") > 0 && (() => {
                          const origAmt = parseFloat(tx.amount) + parseFloat(tx.commission_amount);
                          const commPercent = Math.round((parseFloat(tx.commission_amount) / origAmt) * 1000) / 10;
                          return (
                            <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                              ⚠️ {t("platform_commission_deduction_msg", "Platform service commission of {{percent}}% ({{amount}}) was deducted.").replace("{{percent}}", String(commPercent)).replace("{{amount}}", `$${parseFloat(tx.commission_amount).toFixed(2)}`)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`py-3 px-3 text-end font-black whitespace-nowrap ${amtStyle}`}>
                        {displayAmt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
