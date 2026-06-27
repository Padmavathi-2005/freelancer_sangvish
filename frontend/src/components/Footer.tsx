"use client";

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    connect: {
      title: "Connect",
      links: [
        { label: "Newsletter", href: "#" },
        { label: "Instagram", href: "#" },
        { label: "LinkedIn", href: "#" },
      ],
    },
    mobileApp: {
      title: "Mobile App",
      links: [
        { label: "App Store", href: "#" },
        { label: "Google Play", href: "#" },
      ],
    },
  };

  return (
    <footer className="w-full pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Main Grid structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pt-12 border-t border-slate-200/50">
          
          {/* Logo & Brand Copy Column */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left">
            <span className="font-extrabold text-xl text-[#0a5a54] tracking-tight font-display select-none">
              Freelancer
            </span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm font-sans">
              &copy; {currentYear} Freelancer Marketplace. Precision in Professionalism.
            </p>
          </div>

          {/* Directory Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
            {Object.entries(footerLinks).map(([key, group]) => (
              <div key={key} className="flex flex-col text-left">
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-wider uppercase mb-5 font-display select-none">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-3.5 text-xs sm:text-sm text-slate-500 font-semibold font-sans">
                  {group.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="hover:text-[#0a5a54] transition-colors duration-150"
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
