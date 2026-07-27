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
        // Backend server offline or starting up - default to non-maintenance mode
        setMaintenanceEnabled(false);
      }
    };

    checkMaintenanceMode();
  }, [pathname]);

  // If path is under /admin (or /admin/*), ALWAYS allow access regardless of maintenance mode!
  const isAdminPath = pathname ? pathname.startsWith("/admin") : false;

  if (!isAdminPath && maintenanceEnabled) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        {/* Glowing Background Accent Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl text-center relative z-10 flex flex-col items-center">
          
          {/* Animated Icon Header */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600 shadow-inner">
              <FiTool className="w-10 h-10 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            System Maintenance Mode Active
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-850 leading-tight tracking-tight mb-3">
            We'll Be Right Back!
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-md mb-6">
            Our platform is currently undergoing scheduled system maintenance and infrastructure upgrades to serve you better. Public services and client dashboards will resume shortly.
          </p>

          {/* Status Box */}
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                Data & Security Safety
              </span>
              <span className="text-emerald-600 font-bold text-[10px] uppercase">100% Protected</span>
            </div>
          </div>

        </div>

        <p className="text-slate-400 text-[11px] font-semibold mt-8 relative z-10">
          &copy; {new Date().getFullYear()} LancerFlow Platform. All rights reserved.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
