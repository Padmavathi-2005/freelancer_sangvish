"use client";
import { API_URL } from "@/config/api";


import React, { createContext, useContext, useState, useEffect } from "react";

interface Language {
  name: string;
  code: string;
  direction: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

interface LanguageContextProps {
  lang: string;
  direction: string;
  currency: string;
  currencySymbol: string;
  currencyRate: number;
  translations: Record<string, string>;
  activeLanguages: Language[];
  currencies: Currency[];
  t: (key: string, defaultVal?: string) => string;
  changeLanguage: (code: string) => void;
  changeCurrency: (code: string) => void;
  convertPrice: (amountInUSD: number) => number;
  formatPrice: (amountInUSD: number) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>("EN");
  const [direction, setDirection] = useState<string>("LTR");
  const [currency, setCurrency] = useState<string>("USD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
  const [currencyRate, setCurrencyRate] = useState<number>(1.0);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [activeLanguages, setActiveLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from LocalStorage (safe client-side check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") || "EN";
      const savedDir = localStorage.getItem("direction") || "LTR";
      const savedCurr = localStorage.getItem("currency") || "USD";
      const savedSym = localStorage.getItem("currencySymbol") || "$";
      const savedRate = parseFloat(localStorage.getItem("currencyRate") || "1.0");

      setLang(savedLang);
      setDirection(savedDir);
      setCurrency(savedCurr);
      setCurrencySymbol(savedSym);
      setCurrencyRate(savedRate);

      // Set HTML dir attribute
      document.documentElement.dir = savedDir.toLowerCase();
    }
  }, []);

  // Fetch active languages and currencies list
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch settings first to get defaults
        let defLang = "EN";
        let defCurr = "USD";
        let defSym = "$";
        let defRate = 1.0;
        let defDir = "LTR";

        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          settingsData.forEach((setting: any) => {
            let val = setting.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch {}
            }
            if (setting.setting_key === "default_language") {
              defLang = val?.code || "EN";
            } else if (setting.setting_key === "default_currency") {
              defCurr = val?.code || "USD";
            }
          });
        }

        // Fetch active languages
        const langRes = await fetch(`${API_URL}/languages/active`);
        let activeLangsList: Language[] = [];
        if (langRes.ok) {
          activeLangsList = await langRes.json();
          setActiveLanguages(activeLangsList);
          
          const matchingLang = activeLangsList.find(l => l.code === defLang);
          if (matchingLang) {
            defDir = matchingLang.direction || "LTR";
          }
        }

        // Fetch currencies
        const currRes = await fetch(`${API_URL}/freelancer/currencies`);
        let activeCurrsList: Currency[] = [];
        if (currRes.ok) {
          activeCurrsList = await currRes.json();
          setCurrencies(activeCurrsList);
          
          const matchingCurr = activeCurrsList.find(c => c.code === defCurr);
          if (matchingCurr) {
            defSym = matchingCurr.symbol || "$";
            defRate = matchingCurr.rate !== undefined ? matchingCurr.rate : 1.0;
          }
        }

        // If local storage is empty, initialize with platform defaults
        if (typeof window !== "undefined") {
          const savedLang = localStorage.getItem("lang");
          const savedCurr = localStorage.getItem("currency");
          
          if (!savedLang) {
            setLang(defLang);
            setDirection(defDir);
            document.documentElement.dir = defDir.toLowerCase();
          }
          if (!savedCurr) {
            setCurrency(defCurr);
            setCurrencySymbol(defSym);
            setCurrencyRate(defRate);
          }
        }
      } catch (err) {
        console.error("Failed to load language/currency metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch translation dictionary whenever active language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/translations/${lang}`);
        if (res.ok) {
          const data = await res.json();
          setTranslations(data);
        }
      } catch (err) {
        console.error("Failed to load translation map:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslations();
  }, [lang]);

  const changeLanguage = (code: string) => {
    const uppercaseCode = code.toUpperCase();
    setLang(uppercaseCode);
    localStorage.setItem("lang", uppercaseCode);

    // Find and set direction
    const matchingLang = activeLanguages.find((l) => l.code === uppercaseCode);
    if (matchingLang) {
      const dir = matchingLang.direction || "LTR";
      setDirection(dir);
      localStorage.setItem("direction", dir);
      document.documentElement.dir = dir.toLowerCase();
    }
  };

  const changeCurrency = (code: string) => {
    const uppercaseCode = code.toUpperCase();
    setCurrency(uppercaseCode);
    localStorage.setItem("currency", uppercaseCode);

    const matchingCurr = currencies.find((c) => c.code === uppercaseCode);
    if (matchingCurr) {
      const sym = matchingCurr.symbol || "$";
      const rate = matchingCurr.rate !== undefined ? matchingCurr.rate : 1.0;
      setCurrencySymbol(sym);
      setCurrencyRate(rate);
      localStorage.setItem("currencySymbol", sym);
      localStorage.setItem("currencyRate", rate.toString());
    }
  };

  const convertPrice = (amountInUSD: number) => {
    return amountInUSD * currencyRate;
  };

  const formatPrice = (amountInUSD: number) => {
    const converted = convertPrice(amountInUSD);
    return `${currencySymbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const t = (key: string, defaultVal?: string) => {
    const cleanKey = key.trim().toLowerCase();
    return translations[cleanKey] || defaultVal || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        direction,
        currency,
        currencySymbol,
        currencyRate,
        translations,
        activeLanguages,
        currencies,
        t,
        changeLanguage,
        changeCurrency,
        convertPrice,
        formatPrice,
        loading
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
