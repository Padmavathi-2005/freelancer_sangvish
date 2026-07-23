"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/config/api";
import { FiTool, FiShield, FiArrowRight, FiCheckCircle } from "react-icons/fi";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`, {
          cache: "no-store",
        });
        if (res.ok) {
          const settings: any[] = await res.json();
          const maintSetting = settings.find((s) => s.setting_key === "maintenance_mode");
          if (maintSetting && maintSetting.setting_value) {
            const val = typeof maintSetting.setting_value === "string" 
              ? JSON.parse(maintSetting.setting_value) 
              : maintSetting.setting_value;
            if (val?.enabled === true || val?.enabled === 1 || val?.enabled === "true") {
              setMaintenanceEnabled(true);
            } else {
              setMaintenanceEnabled(false);
            }
          }
        }
      } catch (err) {
        console.error("Error checking maintenance mode:", err);
      }
    };

    checkMaintenanceMode();
  }, [pathname]);

  // If path is under /admin (or /admin/*), ALWAYS allow access regardless of maintenance mode!
  const isAdminPath = pathname ? pathname.startsWith("/admin") : false;

  if (!isAdminPath && maintenanceEnabled) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        {/* Glowing Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative z-10 flex flex-col items-center">
          
          {/* Animated Icon Header */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <FiTool className="w-10 h-10 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            System Maintenance Mode Active
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-3">
            We'll Be Right Back!
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-md mb-8">
            Our platform is currently undergoing scheduled system maintenance and infrastructure upgrades to serve you better. Public services and client dashboards will resume shortly.
          </p>

          {/* Status Box */}
          <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-8 text-left flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                Data & Security Safety
              </span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase">100% Protected</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <FiShield className="w-4 h-4 text-teal-400" />
                Administrator Portal
              </span>
              <span className="text-teal-400 font-bold text-[10px] uppercase">Accessible</span>
            </div>
          </div>

          {/* Admin Login Link */}
          <a
            href="/admin/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 border-none"
          >
            <span>Administrator Access</span>
            <FiArrowRight className="w-4 h-4" />
          </a>

        </div>

        <p className="text-slate-600 text-[11px] font-semibold mt-8 relative z-10">
          &copy; {new Date().getFullYear()} LancerFlow Platform. All rights reserved.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
