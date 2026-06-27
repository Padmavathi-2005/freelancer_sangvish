import React, { useState } from "react";
import { useAdmin } from "@/app/admin/AdminContext";

export default function WalletManagementTab() {
  const {
    adminWalletStats,
    loadingAdminWallet,
    fetchAdminWalletStats,
    withdrawalRequests,
    loadingWithdrawals,
    fetchWithdrawalRequests,
    handleApproveWithdrawal,
    handleRejectWithdrawal
  } = useAdmin();

  const [activeSubTab, setActiveSubTab] = useState<"requests" | "ledger" | "transactions">("requests");

  if (loadingAdminWallet && !adminWalletStats) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading platform wallet analytics...</p>
        </div>
      </div>
    );
  }

  const systemWallet = adminWalletStats?.systemWallet;
  const totalEscrow = adminWalletStats?.totalEscrow || 0;
  const totalCommissions = adminWalletStats?.totalCommissions || 0;
  const wallets = adminWalletStats?.wallets || [];
  const transactions = adminWalletStats?.transactions || [];

  const pendingWithdrawalsCount = withdrawalRequests.filter(r => r.status === "Pending").length;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-slate-50/50 scrollbar-thin">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>🛡️</span> Platform Escrow & Payouts
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Audit system transactions, platform commission settings, and process user withdrawals.
          </p>
        </div>
        <button
          onClick={() => {
            fetchAdminWalletStats();
            fetchWithdrawalRequests();
          }}
          className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm cursor-pointer"
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Escrow Wallet Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Escrow Holdings</span>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">PLATFORM</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${parseFloat(systemWallet?.balance || "0.00").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Total funds stored in neutral system wallet.
            </p>
          </div>
        </div>

        {/* Total Active Escrow Contracts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Active Project Escrows</span>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">CONTRACTS</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${totalEscrow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Sum value of all active milestones in progress.
            </p>
          </div>
        </div>

        {/* Net Platform Commissions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Net Platform Profit</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">COMMISSIONS</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-850">
              ${totalCommissions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Platform fees generated (net non-escrow).
            </p>
          </div>
        </div>

      </div>

      {/* TABS & DETAILS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 py-3 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab("requests")}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === "requests"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Payout Requests ({pendingWithdrawalsCount})
            </button>
            <button
              onClick={() => setActiveSubTab("ledger")}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === "ledger"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              User Wallet Ledgers ({wallets.length})
            </button>
            <button
              onClick={() => setActiveSubTab("transactions")}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === "transactions"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              System Transactions Log
            </button>
          </div>
        </div>

        <div className="p-6">
          
          {/* TAB 1: PENDING WITHDRAWALS */}
          {activeSubTab === "requests" && (
            <div className="space-y-4">
              {loadingWithdrawals ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse">
                  Querying payout tables...
                </div>
              ) : withdrawalRequests.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-8">
                  No payout/withdrawal requests recorded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                        <th className="py-2.5">Req ID</th>
                        <th className="py-2.5">User Details</th>
                        <th className="py-2.5">Method</th>
                        <th className="py-2.5">Payout Target details</th>
                        <th className="py-2.5 text-right">Amount</th>
                        <th className="py-2.5 text-right">User Balance</th>
                        <th className="py-2.5 text-right">Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-700">
                      {withdrawalRequests.map((req: any) => (
                        <tr key={req.request_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-4 text-slate-400">#{req.request_id}</td>
                          <td className="py-4">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800">{req.user_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{req.email}</p>
                            </div>
                          </td>
                          <td className="py-4 text-slate-600">{req.payment_method}</td>
                          <td className="py-4 max-w-[200px] truncate text-slate-500 font-semibold" title={req.account_details}>
                            {req.account_details}
                          </td>
                          <td className="py-4 text-right text-slate-850 text-xs font-black">
                            ${parseFloat(req.amount).toFixed(2)}
                          </td>
                          <td className="py-4 text-right text-slate-400 font-semibold">
                            ${parseFloat(req.current_wallet_balance).toFixed(2)}
                          </td>
                          <td className="py-4 text-right">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full inline-block ${
                                req.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : req.status === "Rejected"
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {req.status === "Pending" ? (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleApproveWithdrawal(req.request_id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition shadow-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(req.request_id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg px-2.5 py-1 text-[10px] font-black cursor-pointer transition border border-rose-100"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-350">PROCESSED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER WALLETS LEDGER */}
          {activeSubTab === "ledger" && (
            <div className="space-y-4">
              {wallets.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-8">
                  No active user wallets created yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                        <th className="py-2.5">Wallet ID</th>
                        <th className="py-2.5">User</th>
                        <th className="py-2.5">Email Address</th>
                        <th className="py-2.5">Workspace Role</th>
                        <th className="py-2.5">Account Setup</th>
                        <th className="py-2.5 text-right">Virtual Balance (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-700">
                      {wallets.map((w: any) => (
                        <tr key={w.wallet_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3.5 text-slate-400">W-LDT-{w.wallet_id}</td>
                          <td className="py-3.5 text-slate-850 font-black">{w.user_name || "Platform User"}</td>
                          <td className="py-3.5 text-slate-500 font-semibold">{w.email}</td>
                          <td className="py-3.5 uppercase text-[10px] font-black">
                            <span className={`px-2 py-0.5 rounded-md ${w.role === "client" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-teal-50 text-teal-600 border border-teal-100"}`}>
                              {w.role}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${w.is_onboarded ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                              {w.is_onboarded ? "Onboarding complete" : "Draft"}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-slate-850 text-sm">
                            ${parseFloat(w.balance).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM TRANSACTIONS */}
          {activeSubTab === "transactions" && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-8">
                  No transactions recorded on this platform.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                        <th className="py-2.5">Tx ID</th>
                        <th className="py-2.5">Timestamp</th>
                        <th className="py-2.5">Sender user</th>
                        <th className="py-2.5">Receiver user</th>
                        <th className="py-2.5">Type</th>
                        <th className="py-2.5">Description</th>
                        <th className="py-2.5 text-right">Commission</th>
                        <th className="py-2.5 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-700">
                      {transactions.map((tx: any) => (
                        <tr key={tx.transaction_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3.5 text-slate-400">TX-{tx.transaction_id}</td>
                          <td className="py-3.5 text-[10px] text-slate-500 font-semibold">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 text-slate-600">{tx.sender_name || "External Deposit"}</td>
                          <td className="py-3.5 text-slate-600">{tx.receiver_name || "Platform Escrow"}</td>
                          <td className="py-3.5 text-[10px]">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 font-semibold max-w-[200px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="py-3.5 text-right text-rose-500 font-bold">
                            {parseFloat(tx.commission_amount) > 0 ? `$${parseFloat(tx.commission_amount).toFixed(2)}` : "-"}
                          </td>
                          <td className="py-3.5 text-right font-black text-slate-850">
                            ${parseFloat(tx.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
