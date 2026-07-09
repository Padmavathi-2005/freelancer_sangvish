"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect, useCallback } from "react";
import { FiGlobe, FiDollarSign } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";

const API = `${API_URL}/admin`;

interface Language {
  language_id: number;
  language_name: string;
  code: string;
  direction: string;
  status: string;
  is_site_lang?: boolean;
}

interface Currency {
  currency_id: number;
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

interface LanguagesCurrenciesTabProps {
  forceTab?: "languages" | "currencies";
}

export default function LanguagesCurrenciesTab({ forceTab }: LanguagesCurrenciesTabProps = {}) {
  const [subTab, setSubTab] = useState<"languages" | "currencies">(forceTab || "languages");

  useEffect(() => {
    if (forceTab) {
      setSubTab(forceTab);
    }
  }, [forceTab]);

  // ── Languages state ──────────────────────────────────────────
  const [languages, setLanguages] = useState<Language[]>([]);
  const [langLoading, setLangLoading] = useState(true);
  const [langSearch, setLangSearch] = useState("");
  const [langForm, setLangForm] = useState({
    language_name: "",
    code: "",
    direction: "LTR" as "LTR" | "RTL",
    status: "Active" as "Active" | "Inactive",
    is_site_lang: false
  });
  const [langEditId, setLangEditId] = useState<number | null>(null);
  const [langError, setLangError] = useState("");
  const [langSaving, setLangSaving] = useState(false);

  // ── Enabling translation state ───────────────────────────────
  const [enablingLang, setEnablingLang] = useState<Language | null>(null);
  const [enablingForm, setEnablingForm] = useState({ code: "", direction: "LTR" as "LTR" | "RTL" });
  const [enablingError, setEnablingError] = useState("");

  // ── Translations editor state ────────────────────────────────
  const [translatingLang, setTranslatingLang] = useState<Language | null>(null);
  const [translationKeys, setTranslationKeys] = useState<{ translation_id?: number; key: string; value: string }[]>([]);
  const [translatingSearch, setTranslatingSearch] = useState("");
  const [newKeyForm, setNewKeyForm] = useState({ key: "", defaultValue: "" });
  const [newKeyError, setNewKeyError] = useState("");
  const [newKeySaving, setNewKeySaving] = useState(false);
  const [transSaving, setTransSaving] = useState(false);
  const [modifiedTranslations, setModifiedTranslations] = useState<Record<string, string>>({});

  // ── Currencies state ─────────────────────────────────────────
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currLoading, setCurrLoading] = useState(true);
  const [currSearch, setCurrSearch] = useState("");
  const [currForm, setCurrForm] = useState({ code: "", name: "", symbol: "", rate: "1.0" });
  const [currEditId, setCurrEditId] = useState<number | null>(null);
  const [currError, setCurrError] = useState("");
  const [currSaving, setCurrSaving] = useState(false);

  const { itemsPerPage } = useAdmin();
  const [langPage, setLangPage] = useState(1);
  const [currPage, setCurrPage] = useState(1);
  const [transPage, setTransPage] = useState(1);

  useEffect(() => {
    setLangPage(1);
  }, [langSearch]);

  useEffect(() => {
    setCurrPage(1);
  }, [currSearch]);

  useEffect(() => {
    setTransPage(1);
  }, [translatingSearch, translatingLang]);

  // ── Toast ────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch languages ──────────────────────────────────────────
  const fetchLanguages = useCallback(async () => {
    setLangLoading(true);
    try {
      const res = await fetch(`${API}/languages`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setLanguages(await res.json());
    } catch { /* ignore */ }
    finally { setLangLoading(false); }
  }, []);

  // ── Fetch currencies ─────────────────────────────────────────
  const fetchCurrencies = useCallback(async () => {
    setCurrLoading(true);
    try {
      const res = await fetch(`${API}/currencies`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setCurrencies(await res.json());
    } catch { /* ignore */ }
    finally { setCurrLoading(false); }
  }, []);

  useEffect(() => { fetchLanguages(); fetchCurrencies(); }, [fetchLanguages, fetchCurrencies]);

  // ── Fetch translations ───────────────────────────────────────
  const fetchTranslationsList = async (langCode: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/translations/${langCode}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTranslationKeys(data);
        setModifiedTranslations({});
      }
    } catch (err) {
      console.error("Failed to load translation keys:", err);
    }
  };

  const handleStartTranslate = (langItem: Language) => {
    setTranslatingLang(langItem);
    fetchTranslationsList(langItem.code);
  };

  // ── Language save (create or update) ─────────────────────────
  const handleLangSave = async () => {
    if (!langForm.language_name.trim()) { setLangError("Language name is required."); return; }
    if (langForm.is_site_lang && !langForm.code.trim()) { setLangError("Language code is required for site translations."); return; }
    setLangSaving(true); setLangError("");
    try {
      const url = langEditId ? `${API}/languages/${langEditId}` : `${API}/languages`;
      const method = langEditId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          language_name: langForm.language_name.trim(),
          code: langForm.code.trim() ? langForm.code.trim().toUpperCase() : null,
          direction: langForm.direction,
          status: langForm.status,
          is_site_lang: langForm.is_site_lang
        })
      });
      const data = await res.json();
      if (!res.ok) { setLangError(data.message || "Failed to save."); return; }
      showToast(langEditId ? "Language updated!" : "Language added!");
      setLangForm({ language_name: "", code: "", direction: "LTR", status: "Active", is_site_lang: false });
      setLangEditId(null);
      fetchLanguages();
    } catch { setLangError("Network error."); }
    finally { setLangSaving(false); }
  };

  const handlePromptEnableTranslation = (langItem: Language) => {
    setEnablingLang(langItem);
    setEnablingForm({ code: "", direction: (langItem.direction || "LTR") as "LTR" | "RTL" });
    setEnablingError("");
  };

  const handleConfirmEnableTranslation = async () => {
    if (!enablingLang) return;
    if (!enablingForm.code.trim()) {
      setEnablingError("Language code is required.");
      return;
    }
    try {
      const res = await fetch(`${API}/languages/${enablingLang.language_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          language_name: enablingLang.language_name,
          code: enablingForm.code.trim().toUpperCase(),
          direction: enablingForm.direction,
          status: enablingLang.status,
          is_site_lang: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEnablingError(data.message || "Failed to enable translation.");
        return;
      }
      showToast(`Translation enabled for ${enablingLang.language_name}!`);
      setEnablingLang(null);
      setEnablingForm({ code: "", direction: "LTR" });
      fetchLanguages();
    } catch {
      setEnablingError("Network error.");
    }
  };

  const handleLangDelete = async (id: number) => {
    if (!confirm("Delete this language?")) return;
    try {
      const res = await fetch(`${API}/languages/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { showToast("Language deleted."); fetchLanguages(); }
    } catch { showToast("Delete failed.", "error"); }
  };

  const handleToggleStatus = async (langItem: Language) => {
    const nextStatus = (langItem.status || "Active") === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`${API}/languages/${langItem.language_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          language_name: langItem.language_name,
          code: langItem.code,
          direction: langItem.direction,
          status: nextStatus
        })
      });
      if (res.ok) {
        showToast(`Language status updated to ${nextStatus}`);
        fetchLanguages();
      }
    } catch {
      showToast("Failed to toggle status.", "error");
    }
  };

  // ── Global Translation Key ──────────────────────────────────
  const handleAddGlobalKey = async () => {
    if (!newKeyForm.key.trim()) {
      setNewKeyError("Key is required.");
      return;
    }
    setNewKeySaving(true);
    setNewKeyError("");
    try {
      const res = await fetch(`${API_URL}/admin/translations/add-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          key: newKeyForm.key,
          defaultValue: newKeyForm.defaultValue
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setNewKeyError(data.message || "Failed to add key.");
        return;
      }

      showToast(`Key '${newKeyForm.key.trim().toLowerCase()}' added globally!`);
      setNewKeyForm({ key: "", defaultValue: "" });
      if (translatingLang) {
        fetchTranslationsList(translatingLang.code);
      }
    } catch {
      setNewKeyError("Network error.");
    } finally {
      setNewKeySaving(false);
    }
  };

  // ── Save Translation strings ─────────────────────────────────
  const handleSaveTranslations = async () => {
    if (!translatingLang) return;
    setTransSaving(true);
    try {
      const updates = Object.entries(modifiedTranslations).map(([key, value]) => ({
        key,
        value
      }));

      if (updates.length === 0) {
        showToast("No changes to save.");
        setTransSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/admin/translations/${translatingLang.code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        showToast("Translations updated successfully!");
        fetchTranslationsList(translatingLang.code);
      } else {
        showToast("Failed to save translations.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setTransSaving(false);
    }
  };

  const handleCurrSave = async () => {
    if (!currForm.code.trim() || !currForm.name.trim() || !currForm.symbol.trim() || !currForm.rate.trim()) {
      setCurrError("All fields are required."); return;
    }
    setCurrSaving(true); setCurrError("");
    try {
      const url = currEditId ? `${API}/currencies/${currEditId}` : `${API}/currencies`;
      const method = currEditId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          code: currForm.code,
          name: currForm.name,
          symbol: currForm.symbol,
          rate: parseFloat(currForm.rate) || 1.0
        })
      });
      const data = await res.json();
      if (!res.ok) { setCurrError(data.message || "Failed to save."); return; }
      showToast(currEditId ? "Currency updated!" : "Currency added!");
      setCurrForm({ code: "", name: "", symbol: "", rate: "1.0" }); setCurrEditId(null);
      fetchCurrencies();
    } catch { setCurrError("Network error."); }
    finally { setCurrSaving(false); }
  };

  const handleCurrDelete = async (id: number) => {
    if (!confirm("Delete this currency?")) return;
    try {
      const res = await fetch(`${API}/currencies/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { showToast("Currency deleted."); fetchCurrencies(); }
    } catch { showToast("Delete failed.", "error"); }
  };

  const filteredLangs = languages.filter(l =>
    l.language_name.toLowerCase().includes(langSearch.toLowerCase()) ||
    (l.code && l.code.toLowerCase().includes(langSearch.toLowerCase()))
  );

  const filteredCurrs = currencies.filter(c =>
    c.code.toLowerCase().includes(currSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currSearch.toLowerCase())
  );

  const totalLangPages = Math.ceil(filteredLangs.length / itemsPerPage);
  const paginatedLangs = filteredLangs.slice((langPage - 1) * itemsPerPage, langPage * itemsPerPage);

  const totalCurrPages = Math.ceil(filteredCurrs.length / itemsPerPage);
  const paginatedCurrs = filteredCurrs.slice((currPage - 1) * itemsPerPage, currPage * itemsPerPage);

  const filteredTranslations = translationKeys.filter(tKey =>
    tKey.key.toLowerCase().includes(translatingSearch.toLowerCase()) ||
    tKey.value.toLowerCase().includes(translatingSearch.toLowerCase())
  );

  const transItemsPerPage = 15;
  const totalTransPages = Math.ceil(filteredTranslations.length / transItemsPerPage);
  const paginatedTranslations = filteredTranslations.slice((transPage - 1) * transItemsPerPage, transPage * transItemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-55 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-black transition-all ${
          toast.type === "success"
            ? "bg-slate-900 text-white border-slate-800"
            : "bg-rose-600 text-white border-rose-700"
        }`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.text}
        </div>
      )}

      {/* Sub Tab Toggle (only show if not translating and not forced) */}
      {!translatingLang && !forceTab && (
        <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1 self-start shadow-sm select-none">
          {(["languages", "currencies"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer flex items-center justify-center gap-2 ${
                subTab === tab
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab === "languages" ? (
                <>
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>Languages</span>
                </>
              ) : (
                <>
                  <FiDollarSign className="w-3.5 h-3.5" />
                  <span>Currencies</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── TRANSLATIONS EDITOR WORKSPACE ───────────────────────── */}
      {translatingLang ? (
        <div className="flex flex-col gap-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          {/* Editor Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTranslatingLang(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-black text-slate-500 cursor-pointer transition-colors"
                >
                  ← Back to Languages
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 uppercase">
                  Translate Editor
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800 mt-2">
                Manage Translations for {translatingLang.language_name} ({translatingLang.code})
              </h2>
              <p className="text-xs text-slate-400">Add global keys or modify translation values. Click Save to persist changes.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={translatingSearch}
                onChange={e => setTranslatingSearch(e.target.value)}
                placeholder="Search keys or values..."
                className="w-full md:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
              <button
                onClick={handleSaveTranslations}
                disabled={transSaving}
                className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-teal-700/10 shrink-0 transition"
              >
                {transSaving ? "Saving..." : "Save Translations"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add New Translation Key Form */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-4 self-start">
              <div>
                <h3 className="text-xs font-black text-slate-800">Add Global Key</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Declare a new translation key globally across all languages.</p>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyForm.key}
                  onChange={e => { setNewKeyForm(f => ({ ...f, key: e.target.value })); setNewKeyError(""); }}
                  placeholder="e.g. welcome_message"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Default English Value</label>
                <input
                  type="text"
                  value={newKeyForm.defaultValue}
                  onChange={e => setNewKeyForm(f => ({ ...f, defaultValue: e.target.value }))}
                  placeholder="e.g. Welcome to Lancer!"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
                />
              </div>

              {newKeyError && <p className="text-xs text-rose-500 font-semibold">{newKeyError}</p>}

              <button
                onClick={handleAddGlobalKey}
                disabled={newKeySaving}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs py-2 rounded-lg cursor-pointer transition"
              >
                {newKeySaving ? "Declaring..." : "Add Global Key"}
              </button>
            </div>

            {/* Right: Key-Value Editors list */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="overflow-y-auto max-h-[500px] border border-slate-100 rounded-2xl pr-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0">
                      <th className="py-2.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Translation Key</th>
                      <th className="py-2.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Translated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTranslations.map((tKey) => {
                      const currentValue = modifiedTranslations[tKey.key] !== undefined
                        ? modifiedTranslations[tKey.key]
                        : tKey.value;
                      return (
                        <tr key={tKey.key} className="border-b border-slate-50 hover:bg-slate-50/40 transition">
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs font-semibold text-slate-600 block">{tKey.key}</span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => {
                                setModifiedTranslations(prev => ({
                                  ...prev,
                                  [tKey.key]: e.target.value
                                }));
                              }}
                              className={`w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition ${
                                modifiedTranslations[tKey.key] !== undefined ? "border-teal-400 bg-teal-50/20" : "border-slate-200"
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedTranslations.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center py-12 text-slate-400 text-xs font-semibold">
                          No translation keys found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalTransPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-2 select-none">
                  <div className="text-[11px] text-slate-450 font-bold">
                    Showing <span className="text-slate-600">{(transPage - 1) * transItemsPerPage + 1}</span> to{" "}
                    <span className="text-slate-600">{Math.min(filteredTranslations.length, transPage * transItemsPerPage)}</span> of{" "}
                    <span className="text-slate-600">{filteredTranslations.length}</span> entries
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTransPage(p => Math.max(1, p - 1))}
                      disabled={transPage === 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    
                    {(() => {
                      const range = [];
                      const delta = 1;
                      
                      for (let i = 1; i <= totalTransPages; i++) {
                        if (
                          i === 1 ||
                          i === totalTransPages ||
                          (i >= transPage - delta && i <= transPage + delta)
                        ) {
                          range.push(i);
                        }
                      }
                      
                      const buttons = [];
                      let l;
                      for (const i of range) {
                        if (l) {
                          if (i - l === 2) {
                            buttons.push(l + 1);
                          } else if (i - l > 2) {
                            buttons.push("...");
                          }
                        }
                        buttons.push(i);
                        l = i;
                      }
                      
                      return buttons.map((pageNum, idx) => {
                        if (pageNum === "...") {
                          return <span key={`ellipsis-${idx}`} className="text-slate-400 px-1 text-xs select-none">...</span>;
                        }
                        
                        const isCurrent = pageNum === transPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setTransPage(pageNum as number)}
                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-teal-50 text-teal-700 border border-teal-200/60 shadow-sm"
                                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      });
                    })()}
                    
                    <button
                      onClick={() => setTransPage(p => Math.min(totalTransPages, p + 1))}
                      disabled={transPage === totalTransPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Saved actions count notification */}
              {Object.keys(modifiedTranslations).length > 0 && (
                <div className="flex items-center justify-between bg-teal-50 border border-teal-200/80 rounded-xl px-4 py-2.5">
                  <span className="text-xs text-teal-800 font-bold">
                    You have unsaved changes: {Object.keys(modifiedTranslations).length} translation string(s) modified.
                  </span>
                  <button
                    onClick={handleSaveTranslations}
                    disabled={transSaving}
                    className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer transition"
                  >
                    Save Changes Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── STANDARD LIST WORKSPACE ─────────────────────────────── */
        <>
          {/* ── LANGUAGES PANEL ──────────────────────────────────────── */}
          {subTab === "languages" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Add / Edit Form */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 self-start">
                <div>
                  <h4 className="text-sm font-black text-slate-800">{langEditId ? "Edit Language" : "Add Language"}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enter name, code, writing direction and details.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Language Name</label>
                    <input
                      type="text"
                      value={langForm.language_name}
                      onChange={e => { setLangForm(f => ({ ...f, language_name: e.target.value })); setLangError(""); }}
                      placeholder="e.g. Arabic"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Language Code {langForm.is_site_lang ? "" : "(Optional)"}
                    </label>
                    <input
                      type="text"
                      value={langForm.code}
                      onChange={e => { setLangForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setLangError(""); }}
                      placeholder="e.g. AR"
                      maxLength={10}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 transition uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Text Direction</label>
                    <select
                      value={langForm.direction}
                      onChange={e => setLangForm(f => ({ ...f, direction: e.target.value as "LTR" | "RTL" }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 transition"
                    >
                      <option value="LTR">LTR (Left to Right)</option>
                      <option value="RTL">RTL (Right to Left)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                    <select
                      value={langForm.status}
                      onChange={e => setLangForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="is_site_lang"
                      checked={langForm.is_site_lang}
                      onChange={e => setLangForm(f => ({ ...f, is_site_lang: e.target.checked }))}
                      className="rounded border-slate-350 text-teal-750 focus:ring-teal-700 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_site_lang" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Enable Site Translation
                    </label>
                  </div>
                </div>

                {langError && <p className="text-xs text-rose-500 font-semibold -mt-1">{langError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleLangSave}
                    disabled={langSaving}
                    className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    {langSaving ? "Saving..." : langEditId ? "Update" : "Add Language"}
                  </button>
                  {langEditId && (
                    <button
                      onClick={() => {
                        setLangEditId(null);
                        setLangForm({ language_name: "", code: "", direction: "LTR", status: "Active", is_site_lang: false });
                        setLangError("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Languages Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">All Languages</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{languages.length} language{languages.length !== 1 ? "s" : ""} configured</p>
                  </div>
                  <input
                    type="text"
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>

                {langLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Language</th>
                            <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Code</th>
                            <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Direction</th>
                            <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Translations</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedLangs.map((lang) => (
                            <tr key={lang.language_id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                              <td className="py-3.5 pr-4 font-bold text-slate-800">{lang.language_name}</td>
                              <td className="py-3.5 pr-4 font-mono text-slate-600 font-bold">{lang.code || "N/A"}</td>
                              <td className="py-3.5 pr-4 font-semibold text-slate-500">{lang.direction || "LTR"}</td>
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleStatus(lang)}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center ${
                                      (lang.status || "Active") === "Active" ? "bg-teal-600 justify-end" : "bg-slate-300 justify-start"
                                    }`}
                                  >
                                    <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                  </button>
                                  <span className={`text-[10px] font-bold ${
                                    (lang.status || "Active") === "Active" ? "text-teal-700" : "text-slate-400"
                                  }`}>
                                    {lang.status || "Active"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 pr-4 text-center">
                                {lang.is_site_lang ? (
                                  <button
                                    onClick={() => handleStartTranslate(lang)}
                                    className="px-3.5 py-1.5 text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200/70 rounded-lg hover:bg-teal-700 hover:text-white transition cursor-pointer"
                                  >
                                    🗫 TRANSLATE
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePromptEnableTranslation(lang)}
                                    className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 hover:bg-teal-700 hover:text-white border border-slate-200 rounded-lg transition cursor-pointer"
                                  >
                                    + Enable Translation
                                  </button>
                                )}
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setLangEditId(lang.language_id);
                                      setLangForm({
                                        language_name: lang.language_name,
                                        code: lang.code || "",
                                        direction: (lang.direction || "LTR") as "LTR" | "RTL",
                                        status: (lang.status || "Active") as "Active" | "Inactive",
                                        is_site_lang: !!lang.is_site_lang
                                      });
                                      setLangError("");
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleLangDelete(lang.language_id)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg cursor-pointer transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredLangs.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-semibold">No languages found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalLangPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-4 select-none">
                        <div className="text-[11px] text-slate-450 font-bold">
                          Showing <span className="text-slate-600">{(langPage - 1) * itemsPerPage + 1}</span> to{" "}
                          <span className="text-slate-600">{Math.min(filteredLangs.length, langPage * itemsPerPage)}</span> of{" "}
                          <span className="text-slate-600">{filteredLangs.length}</span> entries
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setLangPage(p => Math.max(1, p - 1))}
                            disabled={langPage === 1}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: totalLangPages }).map((_, idx) => {
                            const pageNum = idx + 1;
                            const isCurrent = pageNum === langPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setLangPage(pageNum)}
                                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  isCurrent
                                    ? "bg-teal-50 text-teal-700 border border-teal-200/60 shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setLangPage(p => Math.min(totalLangPages, p + 1))}
                            disabled={langPage === totalLangPages}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── CURRENCIES PANEL ─────────────────────────────────────── */}
          {subTab === "currencies" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Add / Edit Form */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 self-start">
                <div>
                  <h4 className="text-sm font-black text-slate-800">{currEditId ? "Edit Currency" : "Add Currency"}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enter currency code, display name and symbol.</p>
                </div>

                <input
                  type="text"
                  value={currForm.code}
                  onChange={e => { setCurrForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setCurrError(""); }}
                  placeholder="Code (e.g. USD)"
                  maxLength={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 uppercase focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={currForm.name}
                  onChange={e => { setCurrForm(f => ({ ...f, name: e.target.value })); setCurrError(""); }}
                  placeholder="Name (e.g. US Dollar)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={currForm.symbol}
                  onChange={e => { setCurrForm(f => ({ ...f, symbol: e.target.value })); setCurrError(""); }}
                  placeholder="Symbol (e.g. $)"
                  maxLength={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="number"
                  step="any"
                  value={currForm.rate}
                  onChange={e => { setCurrForm(f => ({ ...f, rate: e.target.value })); setCurrError(""); }}
                  placeholder="Exchange Rate (e.g. 1.0 for USD base)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-teal-700 transition"
                />

                {currError && <p className="text-xs text-rose-500 font-semibold -mt-1">{currError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleCurrSave}
                    disabled={currSaving}
                    className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    {currSaving ? "Saving..." : currEditId ? "Update" : "Add Currency"}
                  </button>
                  {currEditId && (
                    <button
                      onClick={() => { setCurrEditId(null); setCurrForm({ code: "", name: "", symbol: "", rate: "1.0" }); setCurrError(""); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Currencies Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">All Currencies</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{currencies.length} currency records</p>
                  </div>
                  <input
                    type="text"
                    value={currSearch}
                    onChange={e => setCurrSearch(e.target.value)}
                    placeholder="Search currencies..."
                    className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
                  />
                </div>

                {currLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-2 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Code</th>
                            <th className="py-2 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="py-2 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Symbol</th>
                            <th className="py-2 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Rate (to USD)</th>
                            <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCurrs.map(curr => (
                            <tr key={curr.currency_id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                              <td className="py-2.5 pr-3">
                                <span className="font-black text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">{curr.code}</span>
                              </td>
                              <td className="py-2.5 pr-3 font-bold text-slate-700">{curr.name}</td>
                              <td className="py-2.5 pr-3 font-black text-slate-900 text-base">{curr.symbol}</td>
                              <td className="py-2.5 pr-3 font-mono text-slate-650 font-bold text-slate-700">
                                {curr.rate !== undefined ? curr.rate.toFixed(4) : "1.0000"}
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setCurrEditId(curr.currency_id);
                                      setCurrForm({ code: curr.code, name: curr.name, symbol: curr.symbol, rate: curr.rate !== undefined ? curr.rate.toString() : "1.0" });
                                      setCurrError("");
                                    }}
                                    className="px-3 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCurrDelete(curr.currency_id)}
                                    className="px-3 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg cursor-pointer transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredCurrs.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs font-semibold">No currencies found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalCurrPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-4 select-none">
                        <div className="text-[11px] text-slate-450 font-bold">
                          Showing <span className="text-slate-600">{(currPage - 1) * itemsPerPage + 1}</span> to{" "}
                          <span className="text-slate-600">{Math.min(filteredCurrs.length, currPage * itemsPerPage)}</span> of{" "}
                          <span className="text-slate-600">{filteredCurrs.length}</span> entries
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrPage(p => Math.max(1, p - 1))}
                            disabled={currPage === 1}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: totalCurrPages }).map((_, idx) => {
                            const pageNum = idx + 1;
                            const isCurrent = pageNum === currPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrPage(pageNum)}
                                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  isCurrent
                                    ? "bg-teal-50 text-teal-700 border border-teal-200/60 shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrPage(p => Math.min(totalCurrPages, p + 1))}
                            disabled={currPage === totalCurrPages}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Enabling translation modal ── */}
          {enablingLang && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 w-96 shadow-2xl flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Enable Translation</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure translation support details for <strong>{enablingLang.language_name}</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Language Code</label>
                  <input
                    type="text"
                    value={enablingForm.code}
                    onChange={e => {
                      setEnablingForm(f => ({ ...f, code: e.target.value.toUpperCase() }));
                      setEnablingError("");
                    }}
                    placeholder="e.g. ES, RU, CN"
                    maxLength={5}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-mono uppercase font-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Writing Direction</label>
                  <select
                    value={enablingForm.direction}
                    onChange={e => setEnablingForm(f => ({ ...f, direction: e.target.value as "LTR" | "RTL" }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
                  >
                    <option value="LTR">LTR (Left to Right)</option>
                    <option value="RTL">RTL (Right to Left)</option>
                  </select>
                </div>

                {enablingError && <p className="text-xs text-rose-500 font-semibold">{enablingError}</p>}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleConfirmEnableTranslation}
                    className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Save & Enable
                  </button>
                  <button
                    onClick={() => { setEnablingLang(null); setEnablingError(""); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
