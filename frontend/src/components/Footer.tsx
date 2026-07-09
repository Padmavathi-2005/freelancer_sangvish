"use client";

import React from "react";

interface FooterProps {
  transparent?: boolean;
}

export default function Footer({ transparent = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: {
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "Terms & Conditions", href: "/terms-conditions" },
      ],
    },
    connect: {
      title: "Connect",
      links: [
        { label: "Newsletter", href: "/newsletter" },
        { label: "Instagram", href: "/download" },
        { label: "LinkedIn", href: "/download" },
      ],
    },
    mobileApp: {
      title: "Mobile App",
      links: [
        { label: "App Store", href: "/download" },
        { label: "Google Play", href: "/download" },
      ],
    },
  };

  return (
    <footer className={`w-full pt-12 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 select-none overflow-hidden ${
      transparent
        ? "border-t border-slate-200/70"
        : "bg-slate-100 border-t border-slate-200"
    }`}>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Main Grid structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pt-4">
          
          {/* Logo & Brand Copy Column */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left">
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight font-display flex items-baseline gap-0.5 select-none">
              <span>Freelancer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mb-0.5" />
            </span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm font-sans">
              Precision in Professionalism. Join a curated marketplace where verified talent builds modern client solutions.
            </p>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-2">
              &copy; {currentYear} Freelancer Marketplace. All rights reserved.
            </p>
          </div>

          {/* Directory Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
            {Object.entries(footerLinks).map(([key, group]) => (
              <div key={key} className="flex flex-col text-left">
                <h3 className="font-black text-slate-800 text-xs sm:text-sm tracking-widest uppercase mb-5 font-display select-none">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-3 text-xs sm:text-sm text-slate-500 font-medium font-sans">
                  {group.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="hover:text-teal-700 hover:translate-x-0.5 transition-all duration-150 block w-fit"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}

