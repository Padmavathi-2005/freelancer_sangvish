"use client";

import React from "react";
import CustomSelect from "@/components/CustomSelect";

interface SiteManagementTabProps {
  platformFee: number;
  setPlatformFee: (v: number) => void;
  autoVetting: boolean;
  setAutoVetting: (v: boolean) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  siteTheme: string;
  setSiteTheme: (v: string) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function SiteManagementTab({
  platformFee,
  setPlatformFee,
  autoVetting,
  setAutoVetting,
  maintenanceMode,
  setMaintenanceMode,
  siteTheme,
  setSiteTheme,
  handleSaveSetting
}: SiteManagementTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-805">Site visual and system settings</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Control platform fee percentage, visual system themes, vetting automations, and maintenance triggers.</p>
      </div>

      {/* Service Fee slider */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Platform Escrow Service Fee (%)</h4>
          <p className="text-xs text-slate-505 mt-1">Configure service charge percentages extracted on final payout milestones releases.</p>
        </div>
        
        <div className="w-full md:w-64 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">Percentage</span>
            <span className="text-teal-700 font-bold">{platformFee}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={platformFee}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPlatformFee(val);
              handleSaveSetting("platform_fee", { fee: val });
            }}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
        </div>
      </div>

      {/* Site Theme configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Site Visual Theme</h4>
          <p className="text-xs text-slate-505 mt-1">Toggle between a premium Light (White) theme and the default dark mode.</p>
        </div>
        
        <CustomSelect
          options={[
            { value: "light", label: "White (Light) Theme" },
            { value: "dark", label: "Vibrant Dark Theme" }
          ]}
          value={siteTheme}
          onChange={(val) => {
            setSiteTheme(val as string);
            handleSaveSetting("theme", { theme: val });
          }}
          className="w-64"
        />
      </div>

      {/* Auto vetting toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Auto-Vetting Processors</h4>
          <p className="text-xs text-slate-505 mt-1">Bypasses review queue automatically if applicant has verified GitHub or LinkedIn certificates.</p>
        </div>
        
        <button
          onClick={() => {
            const val = !autoVetting;
            setAutoVetting(val);
            handleSaveSetting("auto_vetting", { enabled: val });
          }}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            autoVetting ? "bg-teal-700" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            autoVetting ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Maintenance mode toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Platform System Maintenance Mode</h4>
          <p className="text-xs text-slate-505 mt-1">Restricts client registrations and contractor job bidding temporarily for structural updates.</p>
        </div>
        
        <button
          onClick={() => {
            const val = !maintenanceMode;
            setMaintenanceMode(val);
            handleSaveSetting("maintenance_mode", { enabled: val });
          }}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            maintenanceMode ? "bg-rose-500" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            maintenanceMode ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>
    </div>
  );
}
