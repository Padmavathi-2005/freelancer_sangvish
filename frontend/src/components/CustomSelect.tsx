"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: any; // string | number | (string | number)[]
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option(s)",
  disabled = false,
  className = "",
  multiple = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLight, setIsLight] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Track body class list for dynamic light/dark theme switches
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsLight(document.body.classList.contains("light"));
      
      const observer = new MutationObserver(() => {
        setIsLight(document.body.classList.contains("light"));
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
      });
      
      return () => observer.disconnect();
    }
  }, []);

  // Reset search filter on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Determine which options are selected
  const selectedOptions = options.filter((opt) => {
    if (multiple && Array.isArray(value)) {
      return value.map(String).includes(String(opt.value));
    }
    return String(opt.value) === String(value);
  });

  const displayLabel = selectedOptions.length > 0
    ? selectedOptions.map((opt) => opt.label).join(", ")
    : placeholder;

  const isSelected = (optValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.map(String).includes(String(optValue));
    }
    return String(optValue) === String(value);
  };

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue: any) => {
    if (disabled) return;
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const stringifiedValues = currentValues.map(String);
      const strOptValue = String(optValue);
      
      const existsIndex = stringifiedValues.indexOf(strOptValue);
      let nextValues;
      
      if (existsIndex > -1) {
        // Remove item matching by index
        nextValues = currentValues.filter((_, idx) => idx !== existsIndex);
      } else {
        // Look up original value type from options list to preserve types
        const originalOpt = options.find(opt => String(opt.value) === strOptValue);
        const addedValue = originalOpt ? originalOpt.value : optValue;
        nextValues = [...currentValues, addedValue];
      }
      
      onChange(nextValues);
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // High-contrast Theme Classes
  const triggerClasses = isLight
    ? "bg-white border-slate-350 text-slate-800 hover:border-slate-400"
    : "bg-zinc-900 border-zinc-800 text-slate-100 hover:border-zinc-700";

  const dropdownMenuClasses = isLight
    ? "bg-white border-slate-200 shadow-xl"
    : "bg-zinc-900 border-zinc-800 shadow-2xl";

  const optionClasses = (isSel: boolean) => {
    if (isSel) {
      return "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-extrabold";
    }
    return isLight
      ? "text-slate-700 hover:bg-slate-100"
      : "text-slate-200 hover:bg-zinc-800/80";
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-medium select-none ${className}`}
      style={{ zIndex: isOpen ? 50 : 10 }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border transition-all duration-200 cursor-pointer outline-none text-left
          ${disabled ? "opacity-55 cursor-not-allowed" : ""}
          ${triggerClasses}
        `}
        style={{
          borderColor: isOpen ? "var(--color-primary)" : undefined,
          boxShadow: isOpen ? "0 0 0 3px var(--color-primary-light)" : "none",
        }}
      >
        <span className={`truncate mr-2 ${selectedOptions.length === 0 ? "text-slate-400" : ""}`}>
          {displayLabel}
        </span>
        
        {/* Chevron Arrow Icon */}
        <svg
          className={`w-4 h-4 text-slate-450 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border z-50 animate-fadeIn transition-all duration-200 flex flex-col
            ${dropdownMenuClasses}
          `}
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Sticky Search Box */}
          <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800/80 sticky top-0 z-10 bg-inherit rounded-t-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border focus:outline-none focus:border-[var(--color-primary)] focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
              style={{
                backgroundColor: isLight ? "#f8fafc" : "#1e1e24",
                borderColor: isLight ? "#e2e8f0" : "#27272a",
                color: isLight ? "#1e293b" : "#fafafa",
              }}
              onClick={(e) => e.stopPropagation()} // Stop click closing dropdown
            />
          </div>

          <div className="p-1 overflow-y-auto flex-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xxs text-slate-400 italic">No matches found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSel = isSelected(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-xs cursor-pointer transition-colors duration-150 my-0.5
                      ${optionClasses(isSel)}
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSel && (
                      <svg
                        className="w-3.5 h-3.5 text-[var(--color-primary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
