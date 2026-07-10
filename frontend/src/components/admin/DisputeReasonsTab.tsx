"use client";

import React, { useState, useEffect } from "react";
import { FiTrash2, FiPlus, FiSave, FiAlertCircle } from "react-icons/fi";

interface DisputeReasonsTabProps {
  disputeReasons: string[];
  setDisputeReasons: (reasons: string[]) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function DisputeReasonsTab({
  disputeReasons,
  setDisputeReasons,
  handleSaveSetting
}: DisputeReasonsTabProps) {
  const [localReasons, setLocalReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (disputeReasons) {
      setLocalReasons([...disputeReasons]);
    }
  }, [disputeReasons]);

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newReason.trim();
    if (!trimmed) return;
    if (localReasons.includes(trimmed)) {
      alert("This dispute reason already exists.");
      return;
    }
    setLocalReasons([...localReasons, trimmed]);
    setNewReason("");
  };

  const handleRemoveReason = (reasonToRemove: string) => {
    setLocalReasons(localReasons.filter((r) => r !== reasonToRemove));
  };

  const handleSave = async () => {
    if (localReasons.length === 0) {
      alert("You must have at least one dispute reason configured.");
      return;
    }
    try {
      setSaving(true);
      setSaveStatus(null);
      
      // Save setting to backend
      await handleSaveSetting("dispute_reasons", localReasons, "general");
      
      // Update global context state
      setDisputeReasons(localReasons);
      
      setSaveStatus({ type: "success", text: "Dispute reasons updated successfully." });
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: "error", text: "Failed to save dispute reasons. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left text-slate-800">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            ⚠️ Dispute Reasons Settings
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Add, delete or reorder default choices offered to clients when raising contract disputes.
          </p>
        </div>
      </div>

      {/* Main Content card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-700 to-cyan-500" />
        
        {saveStatus && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            saveStatus.type === "success" 
              ? "bg-emerald-50 border border-emerald-150 text-emerald-700" 
              : "bg-rose-50 border border-rose-150 text-rose-700"
          }`}>
            <FiAlertCircle className="shrink-0 w-4 h-4" />
            <span>{saveStatus.text}</span>
          </div>
        )}

        {/* Add Reason Form */}
        <form onSubmit={handleAddReason} className="flex gap-2.5">
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Add new dispute reason option (e.g. Code contains security flaws)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-700 focus:bg-white transition-all placeholder-slate-400"
          />
          <button
            type="submit"
            className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1 border-0 cursor-pointer shrink-0"
          >
            <FiPlus className="w-4 h-4" /> Add Option
          </button>
        </form>

        {/* Reasons List */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Configured Options ({localReasons.length})</span>
          {localReasons.length === 0 ? (
            <p className="text-slate-400 text-xs italic font-semibold py-4 text-center">No options defined. Please add at least one.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {localReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-slate-300 hover:bg-slate-100/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-700/10 text-teal-700 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-750">{reason}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReason(reason)}
                    className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button footer */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-t-white border-teal-500 rounded-full animate-spin"></div>
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            <span>{saving ? "Saving changes..." : "Save Settings"}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
