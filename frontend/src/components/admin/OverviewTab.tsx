"use client";

import React from "react";
import { AdminUser } from "@/app/admin/AdminContext";

interface OverviewTabProps {
  adminUser: AdminUser | null;
}

export default function OverviewTab({ adminUser }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Admin Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-700/10 border border-teal-700/20 text-teal-750 font-black flex items-center justify-center text-3xl select-none">
            {adminUser?.full_name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">{adminUser?.full_name || "Admin Admin"}</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">{adminUser?.email || "admin@freelancer.com"}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[9px] font-extrabold bg-teal-700/10 text-teal-750 border border-teal-700/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Role: {adminUser?.role || "MAIN_ADMIN"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Session Status</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Authenticated & Active
          </span>
        </div>
      </div>

      {/* Real-time Activity Logs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-800 mb-4">Real-time Activity Logs</h3>
        <div className="flex flex-col gap-3 font-mono text-xs text-left">
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-slate-705">
            <span className="text-emerald-600">[SUCCESS] Automated security audit completed. All systems functional.</span>
            <span className="text-slate-400 font-sans">10:48 AM</span>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-slate-705">
            <span className="text-rose-600">[ALERT] Dispute #d2 initiated on Stripe API Integration contract.</span>
            <span className="text-slate-400 font-sans">10:20 AM</span>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-slate-705">
            <span className="text-teal-750">[INFO] Vetting application from Vikram Nair received ($130/hr).</span>
            <span className="text-slate-400 font-sans">09:55 AM</span>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-slate-705">
            <span className="text-slate-500">[SYSTEM] Backup script executed. Database size: 1.48 GB.</span>
            <span className="text-slate-400 font-sans">06:00 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
