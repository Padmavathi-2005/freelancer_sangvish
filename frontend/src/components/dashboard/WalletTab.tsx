import React, { useState, useEffect } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";

export default function WalletTab() {
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
    userRole
  } = useDashboard();

  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accNum, setAccNum] = useState("");

  useEffect(() => {
    if (setWithdrawMethod) {
      setWithdrawMethod("Bank Transfer");
    }
  }, [setWithdrawMethod]);

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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 scrollbar-thin">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-credit-card text-teal-700"></i> My Digital Wallet
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          Manage your virtual funds, payouts, and deposit records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD MOCKUP & ACTIONS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Glassmorphic Credit Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 p-6 text-white shadow-xl shadow-teal-900/10 min-h-[180px] flex flex-col justify-between">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl -ml-8 -mb-8"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/95">
                  LancerFlow Wallet
                </p>
                <h3 className="text-lg font-black tracking-tight text-white mt-1">
                  {userRole === "client" ? "Client Ledger" : "Freelancer Earnings"}
                </h3>
              </div>
              <span className="text-xl font-black tracking-tight text-white/90">VISA</span>
            </div>

            <div className="z-10 mt-6">
              <p className="text-2xl font-black tracking-tight text-white select-all">
                ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-white/85 font-black uppercase tracking-wider mt-1">
                Active Virtual Balance (USD)
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-white/90 font-black z-10 mt-3.5">
              <span>ACC #### #### {wallet?.wallet_id || "0"}</span>
              <span className="uppercase bg-emerald-500/25 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400/25 text-[9px] tracking-wider">STATUS: ACTIVE</span>
            </div>
          </div>

          {/* Test Deposit Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-teal-600"></i> Add Funds
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Add virtual funds to your wallet instantly.
              </p>
            </div>

            <form onSubmit={handleDepositSubmit} className="flex gap-2">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount (e.g. 500)"
                min="1"
                step="0.01"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
              />
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 py-2 text-xs font-bold transition shadow-md shadow-teal-700/10 cursor-pointer"
              >
                Add Funds
              </button>
            </form>
          </div>

        </div>

        {/* WITHDRAWAL FORM */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-money-bill-transfer text-slate-700"></i> Request Fund Withdrawal / Payout
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Enter bank account details and payout amount. Admin will review the request and process it.
              </p>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Amount to Withdraw (USD)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="10"
                  step="0.01"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, Chase"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accNum}
                    onChange={(e) => setAccNum(e.target.value)}
                    placeholder="Enter account number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    IFSC / SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder="Enter code"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Enter branch name"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={balance <= 0}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6 py-2.5 text-xs font-bold transition shadow-md shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Submit Withdrawal Request
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* WITHDRAWAL REQUESTS LOG */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <i className="fa-solid fa-clock-rotate-left text-slate-700"></i> Payout Withdrawal Requests
        </h2>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold text-center py-6">
            No withdrawal requests submitted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                  <th className="py-2.5">Req ID</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Payout Target</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {withdrawals.map((w: any) => (
                  <tr key={w.request_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3 text-slate-400">#{w.request_id}</td>
                    <td className="py-3 text-[10px] text-slate-500">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-600">{w.payment_method}</td>
                    <td className="py-3 max-w-[200px] truncate text-slate-500" title={w.account_details}>
                      {w.account_details}
                    </td>
                    <td className="py-3 text-right text-slate-850">
                      ${parseFloat(w.amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full inline-block ${
                          w.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : w.status === "Rejected"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                        }`}
                      >
                        {w.status}
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <i className="fa-solid fa-receipt text-slate-700"></i> Wallet Transactions Log
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold text-center py-6">
            No transaction records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                  <th className="py-2.5">Tx ID</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-right">Amount</th>
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
                      <td className="py-3 text-slate-400">TX-{tx.transaction_id}</td>
                      <td className="py-3 text-[10px] text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-[10px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-semibold max-w-[300px]" title={tx.description}>
                        <div className="truncate">{tx.description}</div>
                        {parseFloat(tx.commission_amount || "0") > 0 && (() => {
                          const origAmt = parseFloat(tx.amount) + parseFloat(tx.commission_amount);
                          const commPercent = Math.round((parseFloat(tx.commission_amount) / origAmt) * 1000) / 10;
                          return (
                            <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                              ⚠️ Platform service commission of {commPercent}% (${parseFloat(tx.commission_amount).toFixed(2)}) was deducted.
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`py-3 text-right font-black ${amtStyle}`}>
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
