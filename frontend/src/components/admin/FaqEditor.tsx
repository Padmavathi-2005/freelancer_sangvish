"use client";

import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

interface FaqEditorProps {
  triggerToast: (title: string, text: string) => void;
}

export default function FaqEditor({ triggerToast }: FaqEditorProps) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availLanguages, setAvailLanguages] = useState<{ name: string; code: string }[]>([]);
  const [translationsByLang, setTranslationsByLang] = useState<Record<string, Record<string, string>>>({});
  const [selectedContentLang, setSelectedContentLang] = useState("EN");
  
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // 1. Fetch active languages
  useEffect(() => {
    const loadLangs = async () => {
      try {
        const langRes = await fetch("https://freelancer.sangvish.com/api/languages/active");
        if (langRes.ok) setAvailLanguages(await langRes.json());
      } catch (e) {
        console.error("Failed to load active languages", e);
      }
    };
    loadLangs();
  }, []);

  // 2. Fetch FAQ list
  const fetchFaqs = async () => {
    try {
      const res = await fetch("https://freelancer.sangvish.com/api/admin/faqs", {
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        setFaqs(await res.json());
      }
    } catch (e) {
      console.error("Failed to load FAQs list", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch translations map for all languages
  const fetchTranslations = async () => {
    if (availLanguages.length === 0) return;
    const transMap: Record<string, Record<string, string>> = {};
    
    for (const lang of availLanguages) {
      try {
        const res = await fetch(`https://freelancer.sangvish.com/api/admin/translations/${lang.code}`, {
          headers: { Authorization: `Bearer ${getAdminToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          const keysObj: Record<string, string> = {};
          data.forEach((item: any) => {
            keysObj[item.key] = item.value;
          });
          transMap[lang.code.toUpperCase()] = keysObj;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setTranslationsByLang(transMap);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    fetchTranslations();
  }, [availLanguages]);

  // Handle local text editing
  const handleFaqFieldChange = (suffix: string, fieldType: "q" | "a", value: string) => {
    const key = `faq_${fieldType}_${suffix}`;
    setTranslationsByLang((prev) => ({
      ...prev,
      [selectedContentLang]: {
        ...(prev[selectedContentLang] || {}),
        [key]: value
      }
    }));
  };

  // Save specific FAQ item (saves translations for all languages for that item)
  const handleSaveFaq = async (faqId: number, suffix: string) => {
    setSavingId(faqId);
    try {
      const targetLangs = availLanguages.length > 0 ? availLanguages : [
        { name: "English", code: "EN" },
        { name: "Arabic", code: "AR" },
        { name: "French", code: "FR" },
        { name: "German", code: "DE" }
      ];

      const qKey = `faq_q_${suffix}`;
      const aKey = `faq_a_${suffix}`;

      for (const lang of targetLangs) {
        const code = lang.code.toUpperCase();
        const langData = translationsByLang[code] || {};
        
        const updates = [
          { key: qKey, value: langData[qKey] || "" },
          { key: aKey, value: langData[aKey] || "" }
        ];

        await fetch(`https://freelancer.sangvish.com/api/admin/translations/${code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`
          },
          body: JSON.stringify({ updates })
        });
      }

      triggerToast("FAQ Saved", "Frequently Asked Question updated successfully!");
      fetchTranslations();
    } catch (e) {
      console.error(e);
      triggerToast("Error Saving", "Failed to update FAQ translations.");
    } finally {
      setSavingId(null);
    }
  };

  // Add new FAQ
  const handleAddFaq = async () => {
    setCreating(true);
    try {
      const res = await fetch("https://freelancer.sangvish.com/api/admin/faqs", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("FAQ Created", "Successfully added a new FAQ item!");
        await fetchFaqs();
        await fetchTranslations();
      } else {
        triggerToast("Error Creating", "Failed to append FAQ item.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Creating", "Error generating new FAQ item.");
    } finally {
      setCreating(false);
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (faqId: number, suffix: string) => {
    const qKey = `faq_q_${suffix}`;
    const questionText = translationsByLang[selectedContentLang]?.[qKey] || "this FAQ item";
    
    if (!window.confirm(`Are you sure you want to delete "${questionText}"?`)) {
      return;
    }

    try {
      const res = await fetch(`https://freelancer.sangvish.com/api/admin/faqs/${faqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("FAQ Deleted", "Removed FAQ item and translations successfully.");
        await fetchFaqs();
        await fetchTranslations();
      } else {
        triggerToast("Error Deleting", "Failed to remove FAQ item.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Deleting", "Error deleting FAQ item.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-slate-800">
      
      {/* Header action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-base font-bold text-slate-800">Frequently Asked Questions (FAQ)</h4>
          <p className="text-xs text-slate-505 mt-1">Manage translatable accordions displayed on the landing page FAQ section.</p>
        </div>
        <button
          onClick={handleAddFaq}
          disabled={creating}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          {creating ? "Creating..." : "Add New FAQ"}
        </button>
      </div>

      {/* Select Language Switcher */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
        <span className="text-xs font-bold text-slate-500">Edit translations for:</span>
        <div className="flex items-center gap-1">
          {(availLanguages.length > 0 ? availLanguages : [
            { name: "English", code: "EN" },
            { name: "Arabic", code: "AR" },
            { name: "French", code: "FR" },
            { name: "German", code: "DE" }
          ]).map((langItem) => (
            <button
              key={langItem.code}
              type="button"
              onClick={() => setSelectedContentLang(langItem.code.toUpperCase())}
              className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition cursor-pointer ${
                selectedContentLang === langItem.code.toUpperCase()
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-550 hover:bg-slate-150"
              }`}
            >
              {langItem.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ items list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const qKey = `faq_q_${faq.key_suffix}`;
            const aKey = `faq_a_${faq.key_suffix}`;

            return (
              <div 
                key={faq.faq_id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch shadow-sm"
              >
                {/* Inputs container */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Question #{index + 1} ({selectedContentLang})</label>
                    <input
                      type="text"
                      value={translationsByLang[selectedContentLang]?.[qKey] || ""}
                      onChange={(e) => handleFaqFieldChange(faq.key_suffix, "q", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Answer Details ({selectedContentLang})</label>
                    <textarea
                      rows={3}
                      value={translationsByLang[selectedContentLang]?.[aKey] || ""}
                      onChange={(e) => handleFaqFieldChange(faq.key_suffix, "a", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-teal-700 transition resize-y leading-relaxed w-full font-medium"
                    />
                  </div>
                </div>

                {/* Actions container */}
                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 self-end md:self-stretch">
                  <button
                    type="button"
                    onClick={() => handleSaveFaq(faq.faq_id, faq.key_suffix)}
                    disabled={savingId === faq.faq_id}
                    className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition duration-150 shadow-sm cursor-pointer shrink-0 text-center min-w-[80px]"
                  >
                    {savingId === faq.faq_id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.faq_id, faq.key_suffix)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-2.5 rounded-xl transition duration-150 border border-rose-200 cursor-pointer flex items-center justify-center shrink-0"
                    title="Delete FAQ item"
                  >
                    <FiTrash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
