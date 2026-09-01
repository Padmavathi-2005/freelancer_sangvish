"use client";

import React, { useState, useEffect } from "react";
import { FiTrash2, FiPlus, FiSave, FiAlertCircle, FiCheck, FiUser, FiBriefcase } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

interface DisputeReasonsTabProps {
  clientDisputeReasons: string[];
  setClientDisputeReasons: (reasons: string[]) => void;
  freelancerDisputeReasons: string[];
  setFreelancerDisputeReasons: (reasons: string[]) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function DisputeReasonsTab({
  clientDisputeReasons,
  setClientDisputeReasons,
  freelancerDisputeReasons,
  setFreelancerDisputeReasons,
  handleSaveSetting
}: DisputeReasonsTabProps) {
  const { t } = useLanguage();
  const [localClientReasons, setLocalClientReasons] = useState<string[]>([]);
  const [localFreelancerReasons, setLocalFreelancerReasons] = useState<string[]>([]);
  
  const [newClientReason, setNewClientReason] = useState("");
  const [newFreelancerReason, setNewFreelancerReason] = useState("");

  const [savingClient, setSavingClient] = useState(false);
  const [savingFreelancer, setSavingFreelancer] = useState(false);
  
  const [clientStatus, setClientStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [freelancerStatus, setFreelancerStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (clientDisputeReasons) {
      setLocalClientReasons([...clientDisputeReasons]);
    }
  }, [clientDisputeReasons]);

  useEffect(() => {
    if (freelancerDisputeReasons) {
      setLocalFreelancerReasons([...freelancerDisputeReasons]);
    }
  }, [freelancerDisputeReasons]);

  // Client Reasons handlers
  const handleAddClientReason = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClientReason.trim();
    if (!trimmed) return;
    if (localClientReasons.includes(trimmed)) {
      alert(t("admin_dispute_already_exists_client", "This dispute reason already exists for clients."));
      return;
    }
    setLocalClientReasons([...localClientReasons, trimmed]);
    setNewClientReason("");
  };

  const handleRemoveClientReason = (reasonToRemove: string) => {
    setLocalClientReasons(localClientReasons.filter((r) => r !== reasonToRemove));
  };

  const handleSaveClient = async () => {
    if (localClientReasons.length === 0) {
      alert(t("admin_dispute_at_least_one_client", "You must have at least one client dispute reason configured."));
      return;
    }
    try {
      setSavingClient(true);
      setClientStatus(null);
      
      // Save setting to backend
      await handleSaveSetting("client_dispute_reasons", localClientReasons, "general");
      await handleSaveSetting("dispute_reasons", localClientReasons, "general"); // Fallback key
      
      // Update global context state
      setClientDisputeReasons(localClientReasons);
      
      setClientStatus({ type: "success", text: t("admin_dispute_save_success_client", "Client dispute reasons updated successfully.") });
      setTimeout(() => setClientStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setClientStatus({ type: "error", text: t("admin_dispute_save_error_client", "Failed to save client dispute reasons.") });
    } finally {
      setSavingClient(false);
    }
  };

  // Freelancer Reasons handlers
  const handleAddFreelancerReason = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFreelancerReason.trim();
    if (!trimmed) return;
    if (localFreelancerReasons.includes(trimmed)) {
      alert(t("admin_dispute_already_exists_freelancer", "This dispute reason already exists for freelancers."));
      return;
    }
    setLocalFreelancerReasons([...localFreelancerReasons, trimmed]);
    setNewFreelancerReason("");
  };

  const handleRemoveFreelancerReason = (reasonToRemove: string) => {
    setLocalFreelancerReasons(localFreelancerReasons.filter((r) => r !== reasonToRemove));
  };

  const handleSaveFreelancer = async () => {
    if (localFreelancerReasons.length === 0) {
      alert(t("admin_dispute_at_least_one_freelancer", "You must have at least one freelancer dispute reason configured."));
      return;
    }
    try {
      setSavingFreelancer(true);
      setFreelancerStatus(null);
      
      // Save setting to backend
      await handleSaveSetting("freelancer_dispute_reasons", localFreelancerReasons, "general");
      
      // Update global context state
      setFreelancerDisputeReasons(localFreelancerReasons);
      
      setFreelancerStatus({ type: "success", text: t("admin_dispute_save_success_freelancer", "Freelancer dispute reasons updated successfully.") });
      setTimeout(() => setFreelancerStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setFreelancerStatus({ type: "error", text: t("admin_dispute_save_error_freelancer", "Failed to save freelancer dispute reasons.") });
    } finally {
      setSavingFreelancer(false);
    }
  };

  const getDisputeReasonTranslation = (reasonText: string) => {
    const key = "dispute_reason_" + reasonText.toLowerCase().trim().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/_$/, "");
    return t(key, reasonText);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left text-slate-800">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          ⚠️ {t("admin_dispute_reasons_title", "Dispute Reasons Settings")}
        </h2>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          {t("admin_dispute_reasons_desc", "Configure different dispute reason options displayed when clients file cases vs. when freelancers file cases.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Dispute Reasons Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden text-left rtl:text-right">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-700 to-indigo-500" />
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row rtl:flex-row-reverse text-left rtl:text-right">
            <h3 className="text-sm font-black text-slate-850 flex items-center gap-2 text-left rtl:text-right">
              <FiUser className="w-4 h-4 text-teal-700" />
              <span>{t("admin_dispute_for_clients", "For Clients (Buyers)")}</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t("admin_dispute_escrow_refund", "Escrow Refund Disputes")}</span>
          </div>

          {clientStatus && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              clientStatus.type === "success" 
                ? "bg-emerald-50 border border-emerald-150 text-emerald-700" 
                : "bg-rose-50 border border-rose-150 text-rose-700"
            }`}>
              {clientStatus.type === "success" ? <FiCheck className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
              <span>{clientStatus.text}</span>
            </div>
          )}

          {/* Add Client Reason Form */}
          <form onSubmit={handleAddClientReason} className="flex gap-2.5">
            <input
              type="text"
              value={newClientReason}
              onChange={(e) => setNewClientReason(e.target.value)}
              placeholder={t("admin_dispute_client_placeholder", "e.g. Deliverable was not matching requirements")}
              className="flex-grow bg-slate-50 border border-slate-200 hover:border-slate-355 focus:border-teal-700/50 focus:bg-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none transition-all text-slate-800"
            />
            <button
              type="submit"
              className="p-2.5 bg-teal-700 hover:bg-teal-850 text-white rounded-xl cursor-pointer shadow-sm shadow-teal-700/10 border-0 flex items-center justify-center shrink-0 transition-all"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </form>

          {/* Client Reasons List */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {localClientReasons.length === 0 ? (
              <p className="text-slate-400 text-xs font-semibold py-6 text-center">{t("admin_dispute_no_reasons", "No reasons configured.")}</p>
            ) : (
              localClientReasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition-all"
                >
                  <span className="text-xs font-semibold text-slate-700">{getDisputeReasonTranslation(reason)}</span>
                  <button
                    onClick={() => handleRemoveClientReason(reason)}
                    className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border-0"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSaveClient}
            disabled={savingClient}
            className="w-full bg-teal-700 hover:bg-teal-850 text-white font-extrabold text-xs py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/10 border-0 flex items-center justify-center gap-1.5"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{savingClient ? t("admin_dispute_saving_client", "Saving client settings...") : t("admin_dispute_save_client", "Save Client dispute reasons")}</span>
          </button>
        </div>

        {/* Freelancer Dispute Reasons Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden text-left rtl:text-right">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-cyan-500" />
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row rtl:flex-row-reverse text-left rtl:text-right">
            <h3 className="text-sm font-black text-slate-850 flex items-center gap-2 text-left rtl:text-right">
              <FiBriefcase className="w-4 h-4 text-emerald-650" />
              <span>{t("admin_dispute_for_freelancers", "For Freelancers (Sellers)")}</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t("admin_dispute_escrow_payout", "Escrow Payout Disputes")}</span>
          </div>

          {freelancerStatus && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              freelancerStatus.type === "success" 
                ? "bg-emerald-50 border border-emerald-150 text-emerald-700" 
                : "bg-rose-50 border border-rose-150 text-rose-700"
            }`}>
              {freelancerStatus.type === "success" ? <FiCheck className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
              <span>{freelancerStatus.text}</span>
            </div>
          )}

          {/* Add Freelancer Reason Form */}
          <form onSubmit={handleAddFreelancerReason} className="flex gap-2.5">
            <input
              type="text"
              value={newFreelancerReason}
              onChange={(e) => setNewFreelancerReason(e.target.value)}
              placeholder={t("admin_dispute_freelancer_placeholder", "e.g. Client is unresponsive to deliverable approvals")}
              className="flex-grow bg-slate-50 border border-slate-200 hover:border-slate-355 focus:border-emerald-700/50 focus:bg-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none transition-all text-slate-800"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl cursor-pointer shadow-sm shadow-emerald-600/10 border-0 flex items-center justify-center shrink-0 transition-all"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </form>

          {/* Freelancer Reasons List */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {localFreelancerReasons.length === 0 ? (
              <p className="text-slate-400 text-xs font-semibold py-6 text-center">{t("admin_dispute_no_reasons", "No reasons configured.")}</p>
            ) : (
              localFreelancerReasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition-all"
                >
                  <span className="text-xs font-semibold text-slate-700">{getDisputeReasonTranslation(reason)}</span>
                  <button
                    onClick={() => handleRemoveFreelancerReason(reason)}
                    className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border-0"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSaveFreelancer}
            disabled={savingFreelancer}
            className="w-full bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/10 border-0 flex items-center justify-center gap-1.5"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{savingFreelancer ? t("admin_dispute_saving_freelancer", "Saving freelancer settings...") : t("admin_dispute_save_freelancer", "Save Freelancer dispute reasons")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
