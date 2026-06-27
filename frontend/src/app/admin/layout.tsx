"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminProvider, useAdmin } from "./AdminContext";
import { FiMenu, FiX } from "react-icons/fi";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    adminUser,
    projectMenuOpen,
    setProjectMenuOpen,
    gigMenuOpen,
    setGigMenuOpen,
    settingsMenuOpen,
    setSettingsMenuOpen,
    pendingVettingCount,
    activeDisputesCount
  } = useAdmin();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Verifying administration access session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row max-w-full relative lg:h-screen lg:overflow-hidden">
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Control Panel */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col h-screen lg:h-screen z-45 transition-transform duration-300 transform lg:transform-none ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xl font-extrabold text-teal-750 tracking-tight">Freelancer Panel</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Root</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer flex items-center justify-center border border-slate-200 bg-slate-50"
              aria-label="Close sidebar"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 select-none">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" 
                alt="Admin" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-sm">{adminUser?.full_name || "Admin Admin"}</div>
              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </div>
            </div>
          </div>
        </div>

        <nav onClick={() => setIsSidebarOpen(false)} className="flex-1 p-4 flex flex-col gap-1.5 select-none overflow-y-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
              activeTab === "profile" || activeTab === "overview"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <span>My profile</span>
          </button>

          <button
            onClick={() => setActiveTab("taxonomies")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
              activeTab === "taxonomies" || activeTab === "categories"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span>Taxonomies</span>
            </div>
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                activeTab === "site_management" || activeTab === "settings" || activeTab === "payment_settings"
                  ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              <span>Settings</span>
              <svg
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  settingsMenuOpen || activeTab === "site_management" || activeTab === "payment_settings" ? "rotate-180" : ""
                }`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {(settingsMenuOpen || activeTab === "site_management" || activeTab === "payment_settings") && (
              <div className="pl-6 flex flex-col gap-1 border-l border-slate-200 ml-6 mt-1 mb-2">
                <button
                  onClick={() => setActiveTab("site_management")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "site_management" || activeTab === "settings"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  General Settings
                </button>
                <button
                  onClick={() => setActiveTab("payment_settings")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "payment_settings"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  Payment Settings
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
              activeTab === "transactions" || activeTab === "disputes"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span>Transaction & payments</span>
            </div>
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                activeTab === "projects" || activeTab === "project_orders"
                  ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>Project management</span>
              </div>
            </button>
            
            {(projectMenuOpen || activeTab === "projects" || activeTab === "project_orders") && (
              <div className="pl-6 flex flex-col gap-1 border-l border-slate-200 ml-6 mt-1 mb-2">
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "projects"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  Project listing
                </button>
                <button
                  onClick={() => setActiveTab("project_orders")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "project_orders"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
                >
                  Project orders
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setGigMenuOpen(!gigMenuOpen)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                activeTab === "gigs_list" || activeTab === "gig_orders"
                  ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>Gig management</span>
              </div>
            </button>
            
            {(gigMenuOpen || activeTab === "gigs_list" || activeTab === "gig_orders") && (
              <div className="pl-6 flex flex-col gap-1 border-l border-slate-200 ml-6 mt-1 mb-2">
                <button
                  onClick={() => setActiveTab("gigs_list")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "gigs_list"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  Gig listing
                </button>
                <button
                  onClick={() => setActiveTab("gig_orders")}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === "gig_orders"
                      ? "bg-teal-700/10 text-teal-700 font-bold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  Gig orders
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
              activeTab === "users" || activeTab === "vetting" || activeTab === "admins"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <span>Manage users</span>
          </button>

          <button
            onClick={() => setActiveTab("onboarding")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
              activeTab === "onboarding"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <span>Onboarding directory</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet_management")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
              activeTab === "wallet_management"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
            }`}
          >
            <span>Payouts & Wallets</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50 select-none shrink-0">
          <button
            onClick={handleLogout}
            className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200/60 hover:bg-rose-100 transition-all duration-200 cursor-pointer"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col max-w-full lg:h-screen lg:overflow-hidden relative z-10">
        
        {/* White Dashboard Top Header Bar */}
        <header className="h-16 w-full bg-white border-b border-slate-200 px-6 lg:px-10 flex flex-row items-center justify-between gap-4 relative z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-xl transition-all cursor-pointer shadow-sm lg:hidden flex items-center justify-center w-9 h-9"
              aria-label="Open sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            <h1 className="text-sm font-extrabold text-slate-900 select-none flex items-center gap-2">
              <span className="text-[10px] font-bold bg-teal-50 text-teal-750 border border-teal-200 px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
              Control Terminal
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[10px] shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-600 font-bold select-none">Secure</span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative z-10 w-full flex flex-col gap-8">
          
          {/* Stats metrics widgets row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Talent Pool</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">14,802</span>
                <span className="text-xs text-emerald-600 font-semibold">+12% this week</span>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vetting Applications</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{pendingVettingCount}</span>
                <span className="text-xs text-slate-500 font-semibold">in review queue</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Escrow Holdings</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-teal-700">$142,500</span>
                <span className="text-xs text-slate-500 font-semibold">held securely</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dispute Cases</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{activeDisputesCount}</span>
                <span className={`text-xs font-semibold ${activeDisputesCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
                  {activeDisputesCount > 0 ? "requires resolution" : "clear slate"}
                </span>
              </div>
            </div>
          </section>

          {/* Child pages content */}
          <section className="flex-1">
            {children}
          </section>

        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
