import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";
import Table from "@/components/Table";
import { useLanguage } from "@/context/LanguageContext";

export default function WalletManagementTab() {
  const { t } = useLanguage();
  const {
    adminWalletStats,
    loadingAdminWallet,
    fetchAdminWalletStats,
    withdrawalRequests,
    loadingWithdrawals,
    fetchWithdrawalRequests,
    handleApproveWithdrawal,
    handleRejectWithdrawal,
    handlePayToUser,
    referralPayouts,
    loadingReferralPayouts,
    handleApproveReferralPayout,
    handleRejectReferralPayout,
    adminTheme
  } = useAdmin();

  const isDark = adminTheme === "dark";

  const [activeSubTab, setActiveSubTab] = useState<"requests" | "referrals" | "ledger" | "transactions" | "pay">("requests");

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferDescription, setTransferDescription] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>("");
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string>("");
  const [searchUserQuery, setSearchUserQuery] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    type: "approve_withdrawal" | "reject_withdrawal" | "approve_referral" | "reject_referral";
    amount: number;
    userName: string;
    email: string;
    method?: string;
  } | null>(null);

  // Pagination & Search states
  const itemsPerPage = 10;
  const [requestsPage, setRequestsPage] = useState<number>(1);
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [transactionsPage, setTransactionsPage] = useState<number>(1);

  const [ledgerSearch, setLedgerSearch] = useState<string>("");
  const [transactionsSearch, setTransactionsSearch] = useState<string>("");

  useEffect(() => {
    setRequestsPage(1);
    setLedgerPage(1);
    setTransactionsPage(1);
  }, [ledgerSearch, transactionsSearch, activeSubTab]);

  const systemWallet = adminWalletStats?.systemWallet;
  const totalEscrow = adminWalletStats?.totalEscrow || 0;
  const totalCommissions = adminWalletStats?.totalCommissions || 0;
  const wallets = adminWalletStats?.wallets || [];
  const transactions = adminWalletStats?.transactions || [];

  const pendingWithdrawalsCount = withdrawalRequests.filter(r => r.status === "Pending").length;
  const pendingReferralsCount = (referralPayouts || []).filter((r: any) => r.status === "pending" || r.status === "Pending").length;

  const [referralsPage, setReferralsPage] = useState<number>(1);

  // Referral Payouts Pagination
  const paginatedReferrals = useMemo(() => {
    const list = referralPayouts || [];
    const start = (referralsPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  }, [referralPayouts, referralsPage]);
  const totalReferralsPages = useMemo(() => Math.ceil((referralPayouts || []).length / itemsPerPage), [referralPayouts]);

  // Requests Pagination
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * itemsPerPage;
    return withdrawalRequests.slice(start, start + itemsPerPage);
  }, [withdrawalRequests, requestsPage]);
  const totalRequestsPages = useMemo(() => Math.ceil(withdrawalRequests.length / itemsPerPage), [withdrawalRequests]);

  // Ledger Filter & Pagination
  const filteredWallets = useMemo(() => {
    const q = ledgerSearch.toLowerCase().trim();
    if (!q) return wallets;
    return wallets.filter((w: any) => {
      const walletId = (w.wallet_id || "").toString();
      const formattedWalletId = `w-ldt-${walletId}`;
      const name = (w.user_name || "Platform User").toLowerCase();
      const email = (w.email || "").toLowerCase();
      const role = (w.role || "").toLowerCase();
      const setupStatus = (w.is_onboarded ? "onboarding complete" : "draft").toLowerCase();
      const balanceRaw = (w.balance || 0).toString();
      const balanceFormatted = parseFloat(w.balance || 0).toFixed(2);
      const balanceWithDollar = `$${balanceFormatted}`;

      return (
        walletId.includes(q) ||
        formattedWalletId.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        setupStatus.includes(q) ||
        balanceRaw.includes(q) ||
        balanceFormatted.includes(q) ||
        balanceWithDollar.includes(q)
      );
    });
  }, [wallets, ledgerSearch]);

  const paginatedWallets = useMemo(() => {
    const start = (ledgerPage - 1) * itemsPerPage;
    return filteredWallets.slice(start, start + itemsPerPage);
  }, [filteredWallets, ledgerPage]);
  const totalLedgerPages = useMemo(() => Math.ceil(filteredWallets.length / itemsPerPage), [filteredWallets]);

  // Transactions Filter & Pagination
  const filteredTransactionsLog = useMemo(() => {
    const q = transactionsSearch.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter((tx: any) => {
      const txId = (tx.transaction_id || "").toString();
      const formattedTxId = `tx-${txId}`;
      const sender = (tx.sender_name || "External Deposit").toLowerCase();
      const receiver = (tx.receiver_name || "Platform Escrow").toLowerCase();
      const type = (tx.type || "").toLowerCase();
      const desc = (tx.description || "").toLowerCase();
      
      const amountRaw = (tx.amount || 0).toString();
      const amountFormatted = parseFloat(tx.amount || 0).toFixed(2);
      const amountWithDollar = `$${amountFormatted}`;

      const commissionRaw = (tx.commission_amount || 0).toString();
      const commissionFormatted = parseFloat(tx.commission_amount || 0).toFixed(2);
      const commissionWithDollar = `$${commissionFormatted}`;

      const timestamp = tx.created_at ? new Date(tx.created_at).toLocaleString().toLowerCase() : "";

      return (
        txId.includes(q) ||
        formattedTxId.includes(q) ||
        sender.includes(q) ||
        receiver.includes(q) ||
        type.includes(q) ||
        desc.includes(q) ||
        amountRaw.includes(q) ||
        amountFormatted.includes(q) ||
        amountWithDollar.includes(q) ||
        commissionRaw.includes(q) ||
        commissionFormatted.includes(q) ||
        commissionWithDollar.includes(q) ||
        timestamp.includes(q)
      );
    });
  }, [transactions, transactionsSearch]);

  const paginatedTransactionsLog = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return filteredTransactionsLog.slice(start, start + itemsPerPage);
  }, [filteredTransactionsLog, transactionsPage]);
  const totalTransactionsPages = useMemo(() => Math.ceil(filteredTransactionsLog.length / itemsPerPage), [filteredTransactionsLog]);

  // Columns Definitions
  const requestColumns = [
    {
      header: t("req_id", "Req ID"),
      accessor: (req: any) => <span className="text-slate-400 font-bold">#{req.request_id}</span>
    },
    {
      header: t("user_details", "User Details"),
      accessor: (req: any) => (
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">{req.user_name}</p>
          <p className="text-[10px] text-slate-400 font-medium">{req.email}</p>
        </div>
      )
    },
    {
      header: t("method", "Method"),
      accessor: (req: any) => <span className="text-slate-600 font-semibold">{req.payment_method}</span>
    },
    {
      header: t("payout_target_details", "Payout Target Details"),
      accessor: (req: any) => (
        <span className="max-w-[200px] truncate block text-slate-500 font-semibold" title={req.account_details}>
          {req.account_details}
        </span>
      )
    },
    {
      header: t("amount", "Amount"),
      className: "text-right",
      accessor: (req: any) => <span className="text-slate-850 text-xs font-black">${parseFloat(req.amount).toFixed(2)}</span>
    },
    {
      header: t("user_balance", "User Balance"),
      className: "text-right",
      accessor: (req: any) => <span className="text-slate-400 font-semibold">${parseFloat(req.current_wallet_balance).toFixed(2)}</span>
    },
    {
      header: t("status_label", "Status"),
      className: "text-right",
      accessor: (req: any) => (
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full inline-block font-bold ${
            req.status === "Approved"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : req.status === "Rejected"
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-amber-50 text-amber-600 border border-amber-100"
          }`}
        >
          {req.status === "Approved" ? t("approved", "Approved") : req.status === "Rejected" ? t("rejected", "Rejected") : t("pending", "Pending")}
        </span>
      )
    },
    {
      header: t("actions", "Action"),
      className: "text-right",
      accessor: (req: any) => req.status === "Pending" ? (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => setPendingAction({
              id: req.request_id,
              type: "approve_withdrawal",
              amount: parseFloat(req.amount),
              userName: req.user_name,
              email: req.email,
              method: req.payment_method
            })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition shadow-sm"
          >
            {t("approve", "Approve")}
          </button>
          <button
            onClick={() => setPendingAction({
              id: req.request_id,
              type: "reject_withdrawal",
              amount: parseFloat(req.amount),
              userName: req.user_name,
              email: req.email,
              method: req.payment_method
            })}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition border border-rose-100"
          >
            {t("reject", "Reject")}
          </button>
        </div>
      ) : (
        <span className="text-[10px] text-slate-350 font-bold">{t("processed", "PROCESSED")}</span>
      )
    }
  ];

  const referralColumns = [
    {
      header: t("payout_id", "Payout ID"),
      accessor: (p: any) => <span className="text-slate-400 font-bold">#{p.payout_id}</span>
    },
    {
      header: t("user_details", "User Details"),
      accessor: (p: any) => (
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">{p.referred_name || p.referrer_name || "User"}</p>
          <p className="text-[10px] text-slate-400 font-medium">{p.referred_email || p.referrer_email}</p>
        </div>
      )
    },
    {
      header: t("bonus_type", "Bonus Type"),
      accessor: (p: any) => {
        let details: any = {};
        try { details = typeof p.details === "string" ? JSON.parse(p.details) : (p.details || {}); } catch(e) {}
        const isSignup = details?.type === "signup_bonus";
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
            isSignup ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {isSignup ? `🎁 ${t("signup_bonus", "Sign-up Bonus")}` : `💰 ${t("referral_reward", "Referral Reward")}`}
          </span>
        );
      }
    },
    {
      header: t("amount", "Amount"),
      className: "text-right",
      accessor: (p: any) => <span className="text-slate-900 text-xs font-black">${parseFloat(p.amount || 0).toFixed(2)}</span>
    },
    {
      header: t("status_label", "Status"),
      className: "text-right",
      accessor: (p: any) => (
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full inline-block font-bold capitalize ${
            p.status === "approved" || p.status === "Approved"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : p.status === "rejected" || p.status === "Rejected"
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
          }`}
        >
          {p.status === "approved" || p.status === "Approved" ? t("approved", "Approved") : p.status === "rejected" || p.status === "Rejected" ? t("rejected", "Rejected") : t("pending", "Pending")}
        </span>
      )
    },
    {
      header: t("actions", "Action"),
      className: "text-right",
      accessor: (p: any) => (p.status === "pending" || p.status === "Pending") ? (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => setPendingAction({
              id: p.payout_id,
              type: "approve_referral",
              amount: parseFloat(p.amount || "0"),
              userName: p.referred_name || p.referrer_name || "User",
              email: p.referred_email || p.referrer_email
            })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition shadow-sm"
          >
            {t("approve", "Approve")}
          </button>
          <button
            onClick={() => setPendingAction({
              id: p.payout_id,
              type: "reject_referral",
              amount: parseFloat(p.amount || "0"),
              userName: p.referred_name || p.referrer_name || "User",
              email: p.referred_email || p.referrer_email
            })}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition border border-rose-100"
          >
            {t("reject", "Reject")}
          </button>
        </div>
      ) : (
        <span className="text-[10px] text-slate-350 font-bold uppercase">{p.status === "approved" || p.status === "Approved" ? t("approved", "Approved") : p.status === "rejected" || p.status === "Rejected" ? t("rejected", "Rejected") : t("pending", "Pending")}</span>
      )
    }
  ];

  const ledgerColumns = [
    {
      header: t("wallet_id_header", "Wallet ID"),
      accessor: (w: any) => <span className="text-slate-400 font-bold whitespace-nowrap">W-LDT-{w.wallet_id}</span>
    },
    {
      header: t("user", "User"),
      accessor: (w: any) => <span className="font-black text-slate-850 whitespace-nowrap">{w.user_name || "Platform User"}</span>
    },
    {
      header: t("email_address", "Email Address"),
      accessor: (w: any) => <span className="text-slate-500 font-semibold">{w.email}</span>
    },
    {
      header: t("workspace_role", "Workspace Role"),
      accessor: (w: any) => (
        <span className={`uppercase text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap ${w.role === "client" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-teal-50 text-teal-600 border border-teal-100"}`}>
          {w.role === "client" ? t("client", "Client") : t("freelancer", "Freelancer")}
        </span>
      )
    },
    {
      header: t("account_setup", "Account Setup"),
      accessor: (w: any) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${w.is_onboarded ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
          {w.is_onboarded ? t("onboarding_complete", "Onboarding complete") : t("draft", "Draft")}
        </span>
      )
    },
    {
      header: t("virtual_balance", "Virtual Balance (USD)"),
      className: "text-right",
      accessor: (w: any) => <span className="font-black text-slate-850 text-sm whitespace-nowrap">${parseFloat(w.balance).toFixed(2)}</span>
    }
  ];

  const transactionColumns = [
    {
      header: t("tx_id", "Tx ID"),
      accessor: (tx: any) => <span className="text-slate-400 font-bold">TX-{tx.transaction_id}</span>
    },
    {
      header: t("timestamp", "Timestamp"),
      accessor: (tx: any) => <span className="text-[10px] text-slate-500 font-semibold">{new Date(tx.created_at).toLocaleString()}</span>
    },
    {
      header: t("sender_user", "Sender User"),
      accessor: (tx: any) => <span className="text-slate-600 font-bold">{tx.sender_name || t("external_deposit", "External Deposit")}</span>
    },
    {
      header: t("receiver_user", "Receiver User"),
      accessor: (tx: any) => <span className="text-slate-600 font-bold">{tx.receiver_name || t("platform_escrow", "Platform Escrow")}</span>
    },
    {
      header: t("type", "Type"),
      accessor: (tx: any) => (
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
          {tx.type}
        </span>
      )
    },
    {
      header: t("description", "Description"),
      accessor: (tx: any) => (
        <span className="max-w-[200px] truncate block text-slate-500 font-semibold" title={tx.description}>
          {tx.description}
        </span>
      )
    },
    {
      header: t("commission", "Commission"),
      className: "text-right",
      accessor: (tx: any) => (
        <span className="text-rose-500 font-bold">
          {parseFloat(tx.commission_amount) > 0 ? `$${parseFloat(tx.commission_amount).toFixed(2)}` : "-"}
        </span>
      )
    },
    {
      header: t("net_amount", "Net Amount"),
      className: "text-right",
      accessor: (tx: any) => <span className="font-black text-slate-850">${parseFloat(tx.amount).toFixed(2)}</span>
    }
  ];

  if (loadingAdminWallet && !adminWalletStats) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">{t("admin_loading_wallet_analytics", "Loading platform wallet analytics...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left rtl:text-right">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>🛡️</span> {t("admin_platform_escrow_payouts", "Platform Escrow & Payouts")}
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {t("admin_platform_escrow_payouts_desc", "Audit system transactions, platform commission settings, and process user withdrawals.")}
          </p>
        </div>
        <button
          onClick={() => {
            fetchAdminWalletStats();
            fetchWithdrawalRequests();
          }}
          className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm cursor-pointer"
        >
          🔄 {t("admin_refresh_ledger", "Refresh Ledger")}
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Escrow Wallet Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{t("admin_system_wallet_reserve", "System Wallet Reserve")}</span>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">{t("admin_platform", "PLATFORM")}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${parseFloat(systemWallet?.balance || "0.00").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {t("admin_system_wallet_reserve_desc", "Total funds stored in neutral system wallet.")}
            </p>
          </div>
        </div>

        {/* Total Active Escrow Contracts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{t("admin_active_project_escrows", "Active Project Escrows")}</span>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{t("admin_contracts", "CONTRACTS")}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${totalEscrow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {t("admin_active_project_escrows_desc", "Sum value of all active milestones in progress.")}
            </p>
          </div>
        </div>

        {/* Net Platform Commissions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{t("admin_net_platform_profit", "Net Platform Profit")}</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{t("admin_commissions", "COMMISSIONS")}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${totalCommissions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {t("admin_net_platform_profit_desc", "Platform fees generated (net non-escrow).")}
            </p>
          </div>
        </div>

      </div>

      {/* TABS & DETAILS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0 max-w-full">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-3 items-center overflow-x-auto min-w-0 max-w-full">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveSubTab("requests")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubTab === "requests"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("admin_payout_requests", "Payout Requests")} ({pendingWithdrawalsCount})
            </button>
            <button
              onClick={() => setActiveSubTab("referrals")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubTab === "referrals"
                  ? "bg-purple-800 text-white shadow-sm"
                  : "text-purple-600 hover:text-purple-900 bg-purple-50/50"
              }`}
            >
              {t("admin_referral_signup_bonuses", "Referral & Signup Bonuses")} ({pendingReferralsCount})
            </button>
            <button
              onClick={() => setActiveSubTab("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubTab === "ledger"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("admin_user_wallet_ledgers", "User Wallet Ledgers")} ({wallets.length})
            </button>
            <button
              onClick={() => setActiveSubTab("transactions")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubTab === "transactions"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("admin_system_transactions_log", "System Transactions Log")}
            </button>
            <button
              onClick={() => {
                setActiveSubTab("pay");
                setSelectedUserId("");
                setTransferAmount("");
                setTransferDescription("");
                setTransferSuccessMsg("");
                setTransferError("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubTab === "pay"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("admin_pay_to_someone", "Pay to Someone")}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 min-w-0 max-w-full">
          
          {/* TAB 1: PENDING WITHDRAWALS */}
          {activeSubTab === "requests" && (
            <div className="space-y-4">
              {loadingWithdrawals ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse">
                  {t("admin_querying_payout_tables", "Querying payout tables...")}
                </div>
              ) : (
                <Table
                  columns={requestColumns}
                  data={paginatedRequests}
                  currentPage={requestsPage}
                  totalPages={totalRequestsPages}
                  onPageChange={setRequestsPage}
                  totalItems={withdrawalRequests.length}
                  itemsPerPage={itemsPerPage}
                  emptyMessage={t("admin_no_payout_requests", "No payout/withdrawal requests recorded.")}
                />
              )}
            </div>
          )}

          {/* TAB: REFERRAL & SIGNUP BONUSES */}
          {activeSubTab === "referrals" && (
            <div className="space-y-4">
              {loadingReferralPayouts ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse">
                  {t("admin_loading_referral_payouts", "Loading referral & sign-up bonus payouts...")}
                </div>
              ) : (
                <Table
                  columns={referralColumns}
                  data={paginatedReferrals}
                  currentPage={referralsPage}
                  totalPages={totalReferralsPages}
                  onPageChange={setReferralsPage}
                  totalItems={(referralPayouts || []).length}
                  itemsPerPage={itemsPerPage}
                  emptyMessage={t("admin_no_referrals_recorded", "No referral or sign-up bonus payout requests recorded.")}
                />
              )}
            </div>
          )}

          {/* TAB 2: USER WALLETS LEDGER */}
          {activeSubTab === "ledger" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="w-full sm:w-64 relative">
                  <input
                    type="text"
                    placeholder={t("admin_search_user_ledgers", "Search user ledgers...")}
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 focus:bg-white rounded-xl pl-3.5 pr-4 py-2 text-xs text-slate-800 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <Table
                columns={ledgerColumns}
                data={paginatedWallets}
                currentPage={ledgerPage}
                totalPages={totalLedgerPages}
                onPageChange={setLedgerPage}
                totalItems={filteredWallets.length}
                itemsPerPage={itemsPerPage}
                emptyMessage={t("admin_no_user_wallets_match", "No active user wallets match search.")}
              />
            </div>
          )}

          {/* TAB 3: SYSTEM TRANSACTIONS */}
          {activeSubTab === "transactions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="w-full sm:w-64 relative">
                  <input
                    type="text"
                    placeholder={t("admin_search_transactions_log", "Search transactions log...")}
                    value={transactionsSearch}
                    onChange={(e) => setTransactionsSearch(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 focus:bg-white rounded-xl pl-3.5 pr-4 py-2 text-xs text-slate-800 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <Table
                columns={transactionColumns}
                data={paginatedTransactionsLog}
                currentPage={transactionsPage}
                totalPages={totalTransactionsPages}
                onPageChange={setTransactionsPage}
                totalItems={filteredTransactionsLog.length}
                itemsPerPage={itemsPerPage}
                emptyMessage={t("admin_no_transactions_found", "No matching system transactions found.")}
              />
            </div>
          )}

          {/* TAB 4: PAY TO SOMEONE */}
          {activeSubTab === "pay" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fadeIn">
              
              {/* Left Column: Search & Select Recipient */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">{t("admin_select_recipient_wallet", "1. Select Recipient Wallet")}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{t("admin_select_recipient_wallet_desc", "Search for the contractor or client you want to credit.")}</p>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("admin_search_by_name_email_id", "Search by name, email, or user ID...")}
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 focus:bg-white rounded-xl pl-4 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto bg-transparent scrollbar-thin pr-1">
                  {(() => {
                    const filteredWalletsForPay = wallets.filter((w: any) => {
                      const query = searchUserQuery.toLowerCase();
                      return (
                        w.user_name?.toLowerCase().includes(query) ||
                        w.email?.toLowerCase().includes(query) ||
                        w.user_id?.toString().includes(query)
                      );
                    });

                    if (filteredWalletsForPay.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 font-semibold text-center py-8">
                          {t("admin_no_user_wallets_found", "No matching user wallets found.")}
                        </p>
                      );
                    }

                    return filteredWalletsForPay.map((w: any) => {
                      const isSelected = selectedUserId === w.user_id.toString();
                      return (
                        <div
                          key={w.wallet_id}
                          onClick={() => {
                            setSelectedUserId(w.user_id.toString());
                            setTransferSuccessMsg("");
                            setTransferError("");
                          }}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? (isDark ? "bg-teal-950/20 border-teal-500 text-white" : "bg-teal-50/60 border-teal-600 text-slate-900 animate-pulse")
                              : (isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800")
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-xs font-black ${isSelected ? (isDark ? "text-teal-400" : "text-teal-950") : (isDark ? "text-slate-105" : "text-slate-900")}`}>
                              {w.user_name || "Platform User"}
                            </p>
                            <p className={`text-[10px] font-semibold truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{w.email}</p>
                            <div className="flex gap-1.5 mt-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                w.role === "Client"
                                  ? (isDark ? "bg-blue-950/40 text-blue-400 border border-blue-900/50" : "bg-blue-50 text-blue-600 border border-blue-100")
                                  : (isDark ? "bg-teal-950/40 text-teal-400 border border-teal-900/50" : "bg-teal-50 text-teal-600 border border-teal-100")
                              }`}>
                                {w.role === "Client" || w.role === "client" ? t("client", "Client") : t("freelancer", "Freelancer")}
                              </span>
                              <span className={`text-[9px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("id_label", "ID")}: #{w.user_id}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-black ${isDark ? "text-slate-105" : "text-slate-900"}`}>${parseFloat(w.balance).toFixed(2)}</p>
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("admin_current_balance", "Current Balance")}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Column: Transfer Form */}
              <div className="lg:col-span-5 border border-slate-200/80 rounded-xl p-6 bg-slate-50/50 flex flex-col justify-between shadow-sm min-h-[350px]">
                
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider mb-4">{t("admin_payment_details", "2. Payment Details")}</h3>
                  
                  {selectedUserId ? (
                    (() => {
                      const recipient = wallets.find((w: any) => w.user_id.toString() === selectedUserId);
                      return (
                        <div className="space-y-4">
                          
                          {/* Recipient info panel */}
                          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{t("admin_recipient", "Recipient")}</span>
                              <span className="text-xs font-black text-slate-850">{recipient?.user_name || "Selected User"}</span>
                              <span className="text-[10px] text-slate-450 block font-semibold">{recipient?.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedUserId("")}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              {t("admin_clear", "Clear")}
                            </button>
                          </div>

                          {/* Amount Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t("admin_amount_to_transfer", "Amount to Transfer (USD)")}</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl pl-7 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none transition-all"
                              />
                            </div>
                            {systemWallet && (
                              <span className="text-[9px] text-slate-400 font-semibold block">
                                {t("admin_available_escrow", "Available Escrow:")} <strong className="text-slate-650">${parseFloat(systemWallet.balance).toFixed(2)}</strong>
                              </span>
                            )}
                          </div>

                          {/* Description Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t("admin_transfer_description_reason", "Transfer Description / Reason")}</label>
                            <textarea
                              rows={3}
                              placeholder={t("admin_transfer_desc_placeholder", "Describe the reason for this manual transfer (e.g. Milestone settlement, special bonus payout, admin adjustment...)")}
                              value={transferDescription}
                              onChange={(e) => setTransferDescription(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none transition-all resize-none"
                            />
                          </div>

                          {/* Error/Success alerts */}
                          {transferError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xxs font-bold">
                              ⚠️ {transferError}
                            </div>
                          )}

                          {transferSuccessMsg && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xxs font-bold">
                              🎉 {transferSuccessMsg}
                            </div>
                          )}

                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-2">
                      <span className="text-2xl">👈</span>
                      <p className="text-xs font-bold text-slate-400">{t("admin_please_select_recipient", "Please select a recipient wallet from the list on the left to begin.")}</p>
                    </div>
                  )}

                </div>

                {selectedUserId && (
                  <button
                    type="button"
                    disabled={transferLoading || !transferAmount}
                    onClick={async () => {
                      if (!selectedUserId || !transferAmount) return;
                      const recipient = wallets.find((w: any) => w.user_id.toString() === selectedUserId);
                      if (!recipient) return;
                      
                      const confirmText = `Are you sure you want to transfer $${parseFloat(transferAmount).toFixed(2)} from system escrow to ${recipient.user_name}?`;
                      if (!window.confirm(confirmText)) return;

                      setTransferLoading(true);
                      setTransferError("");
                      setTransferSuccessMsg("");

                      const res = await handlePayToUser(
                        parseInt(selectedUserId),
                        parseFloat(transferAmount),
                        transferDescription
                      );

                      setTransferLoading(false);
                      if (res.success) {
                        setTransferSuccessMsg(res.message || "Transfer completed successfully.");
                        setTransferAmount("");
                        setTransferDescription("");
                        fetchAdminWalletStats();
                      } else {
                        setTransferError(res.message || "Failed to process transfer.");
                      }
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-black text-white transition shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 ${
                      transferLoading || !transferAmount
                        ? "bg-slate-300 shadow-none cursor-not-allowed"
                        : "bg-teal-700 hover:bg-teal-800 shadow-teal-750/10"
                    }`}
                  >
                    {transferLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t("admin_processing_payout", "Processing payout...")}</span>
                      </>
                    ) : (
                      <span>{t("admin_release_escrow_payout", "Release Escrow Payout 💸")}</span>
                    )}
                  </button>
                )}

              </div>

            </div>
          )}

        </div>
      </div>

      {pendingAction && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[1px] animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl relative flex flex-col items-center text-center gap-5">
            {pendingAction.type.startsWith("approve") ? (
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm shrink-0">
                <FiCheckCircle className="w-6 h-6 animate-pulse" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl border border-rose-250 dark:border-rose-900/50 shadow-sm shrink-0">
                <FiXCircle className="w-6 h-6 animate-pulse" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {pendingAction.type.startsWith("approve") ? t("admin_confirm_approval", "Confirm Approval") : t("admin_confirm_rejection", "Confirm Rejection")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-2.5 leading-relaxed">
                {pendingAction.type.startsWith("approve") ? "Are you sure you want to approve the payout request of " : "Are you sure you want to reject the payout request of "}
                <strong className="text-slate-800 dark:text-zinc-200 font-black">${pendingAction.amount.toFixed(2)}</strong> for{" "}
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  {pendingAction.userName} ({pendingAction.email})
                </span>
                ? {pendingAction.method && ` (Method: ${pendingAction.method})`}
              </p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold text-xs py-3 rounded-xl transition cursor-pointer border border-slate-200 dark:border-zinc-700"
              >
                {t("admin_cancel", "Cancel")}
              </button>
              <button
                onClick={async () => {
                  const action = pendingAction;
                  setPendingAction(null);
                  if (action.type === "approve_withdrawal") {
                    await handleApproveWithdrawal(action.id);
                  } else if (action.type === "reject_withdrawal") {
                    await handleRejectWithdrawal(action.id);
                  } else if (action.type === "approve_referral") {
                    await handleApproveReferralPayout(action.id);
                  } else if (action.type === "reject_referral") {
                    await handleRejectReferralPayout(action.id);
                  }
                }}
                className={`flex-1 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer border-0 ${
                  pendingAction.type.startsWith("approve")
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {pendingAction.type.startsWith("approve") ? t("admin_yes_approve", "Yes, Approve") : t("admin_yes_reject", "Yes, Reject")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
