"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

interface Option {
  value: string | number;
  label: string;
  isHeader?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number | (string | number)[];
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select Option",
  className = "",
  disabled = false,
  multiple = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute display label
  let displayLabel = placeholder;
  if (multiple && Array.isArray(value)) {
    if (value.length > 0) {
      const selectedLabels = options
        .filter((o) => !o.isHeader && value.some((v) => String(v) === String(o.value)))
        .map((o) => o.label);
      displayLabel = selectedLabels.length > 0 ? selectedLabels.join(", ") : `${value.length} selected`;
    }
  } else {
    const selectedOption = options.find((o) => !o.isHeader && String(o.value) === String(value));
    if (selectedOption) {
      displayLabel = selectedOption.label;
    }
  }

  const handleSelectOption = (optValue: string | number) => {
    if (multiple) {
      const arr = Array.isArray(value) ? [...value] : [];
      const index = arr.findIndex((v) => String(v) === String(optValue));
      if (index >= 0) {
        arr.splice(index, 1);
      } else {
        arr.push(optValue);
      }
      onChange(arr);
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const isOptionSelected = (optValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.some((v) => String(v) === String(optValue));
    }
    return String(value) === String(optValue);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full max-w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs text-left ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : ""
        }`}
      >
        <span className="truncate flex-1 min-w-0">{displayLabel}</span>
        <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-teal-700" : ""}`} />
      </button>

      {!disabled && isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 w-full max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] max-h-44 sm:max-h-56 overflow-y-auto scrollbar-thin p-1 space-y-0.5 animate-fadeIn">
          {!multiple && placeholder && !options.some((o) => String(o.value) === String(value)) && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full text-left truncate px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => {
            if (opt.isHeader) {
              return (
                <div
                  key={opt.value}
                  className="px-3 pt-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-slate-50/80 dark:bg-slate-800/50 rounded-md my-0.5 select-none pointer-events-none"
                >
                  {opt.label}
                </div>
              );
            }
            const selected = isOptionSelected(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption(opt.value)}
                className={`w-full flex items-center justify-between truncate px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border-none ${
                  selected
                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                }`}
              >
                <span className="truncate pl-1">{opt.label}</span>
                {multiple && selected && <FiCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
