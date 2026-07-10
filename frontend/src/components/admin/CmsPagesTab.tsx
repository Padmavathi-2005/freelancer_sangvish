"use client";

import React, { useState, useEffect } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useAdmin } from "../../app/admin/AdminContext";
import { FiPlus, FiTrash2, FiEdit2, FiChevronUp, FiChevronDown, FiGlobe, FiEye, FiSettings } from "react-icons/fi";

interface BuilderBlock {
  id: string;
  type: string;
  data: Record<string, any>;
}

export default function CmsPagesTab() {
  const { props: dragScrollProps } = useDragScroll();
  const {
    adminTheme,
    cmsPagesList,
    loadingCms,
    fetchCmsPages,
    handleCreateCmsPage,
    handleUpdateCmsPage,
    handleDeleteCmsPage
  } = useAdmin();

  const isDark = adminTheme === "dark";

  // Navigation / View states
  const [editorMode, setEditorMode] = useState<"list" | "create" | "edit">("list");
  const [selectedPage, setSelectedPage] = useState<any | null>(null);

  // Form states
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageStatus, setPageStatus] = useState("Draft");
  const [contentType, setContentType] = useState("Builder");
  const [htmlContent, setHtmlContent] = useState("");
  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([]);

  // Editing Block settings
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  useEffect(() => {
    fetchCmsPages();
  }, []);

  const openCreateMode = () => {
    setPageTitle("");
    setPageSlug("");
    setPageStatus("Draft");
    setContentType("Builder");
    setHtmlContent("");
    setBuilderBlocks([
      {
        id: "hero-" + Date.now(),
        type: "Hero",
        data: {
          headline: "Excel in the Freelance Marketplace!",
          subheadline: "Flourish in a thriving freelance ecosystem dedicated to excellence and limitless opportunities.",
          searchPlaceholder: "Search by keyword",
          buttonText: "Search"
        }
      }
    ]);
    setSelectedPage(null);
    setEditorMode("create");
  };

  const openEditMode = (page: any) => {
    setSelectedPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageStatus(page.status);
    setContentType(page.content_type);
    
    if (page.content_type === "HTML") {
      setHtmlContent(page.content);
      setBuilderBlocks([]);
    } else {
      setHtmlContent("");
      try {
        setBuilderBlocks(JSON.parse(page.content));
      } catch (e) {
        setBuilderBlocks([]);
      }
    }
    setEditorMode("edit");
  };

  const generateSlug = (val: string) => {
    setPageSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  // Block management
  const addBlock = (type: string) => {
    const newBlock: BuilderBlock = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      data: getBlockDefaultData(type)
    };
    setBuilderBlocks([...builderBlocks, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBuilderBlocks(builderBlocks.filter((b) => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...builderBlocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBuilderBlocks(newBlocks);
  };

  const updateBlockData = (id: string, key: string, value: any) => {
    setBuilderBlocks(
      builderBlocks.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            data: { ...b.data, [key]: value }
          };
        }
        return b;
      })
    );
  };

  const getBlockDefaultData = (type: string) => {
    switch (type) {
      case "Hero":
        return {
          headline: "Excel in the Freelance Marketplace!",
          subheadline: "Flourish in a thriving freelance ecosystem dedicated to excellence and limitless opportunities.",
          searchPlaceholder: "Search by keyword",
          buttonText: "Search"
        };
      case "Brands":
        return {
          title: "Trusted by",
          logos: "Airbnb, Intercom, Microsoft, Trello"
        };
      case "Title":
        return {
          title: "Featured Section Title",
          subtitle: "Explain what this section is about neatly",
          align: "center"
        };
      case "RichText":
        return {
          content: "<p>Write custom description or styled paragraphs here...</p>"
        };
      case "FAQ":
        return {
          title: "Frequently Asked Questions",
          items: [
            { q: "How do I get started?", a: "Simply sign up as a client or freelancer to begin." },
            { q: "Are there platform fees?", a: "Yes, we charge a minimal fee to keep services secure." }
          ]
        };
      case "CTA":
        return {
          title: "Ready to start your journey?",
          description: "Connect with global experts and scale your production today.",
          buttonText: "Get Started Now",
          buttonLink: "/login"
        };
      case "Categories":
        return {
          title: "Browse Top Categories",
          subtitle: "Explore professional niches to find top-notch assets"
        };
      case "Carousel":
        return {
          slides: [
            {
              title: "Find Top Freelancers Online",
              description: "Connect with vetted specialists and industry leaders for your next software build.",
              imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
              buttonText: "Hire Experts",
              buttonLink: "/login"
            },
            {
              title: "Grow Your Freelancing Career",
              description: "Access high-ticket projects, showcase your portfolio, and work with premium clients.",
              imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=crop&fit=crop&q=80&w=800",
              buttonText: "Find Work",
              buttonLink: "/login"
            }
          ]
        };
      case "FeaturesGrid":
        return {
          title: "Premium Features Built for Scale",
          subtitle: "Everything you need to hire, collaborate, and pay securely.",
          features: [
            { title: "Vetted Freelancers", description: "All specialists pass a background vetting evaluation." },
            { title: "Safe Escrow System", description: "Funds are released only when you approve the milestone build." },
            { title: "Realtime Messages", description: "Communicate directly with custom audio/video call modules." }
          ]
        };
      case "Pricing":
        return {
          title: "Simple, Transparent Pricing",
          subtitle: "No hidden setups. Choose a tier that fits your workspace.",
          tiers: [
            { name: "Starter", price: "$0", billing: "Free forever", features: ["Access public gigs directory", "Post up to 3 projects", "Standard platform fee"] },
            { name: "Enterprise", price: "$49", billing: "/month flat", features: ["Zero service commission", "Dedicated manager assistance", "Fast track dispute mediation", "Premium search badges"] }
          ]
        };
      case "Testimonials":
        return {
          title: "Loved by Global Teams",
          subtitle: "Check out reviews from our successful clients and software leaders.",
          reviews: [
            { author: "Marcus Aurelius", role: "CTO, Rome Tech", quote: "Using Buy2Lancer helped us source 3 frontend engineers in under 24 hours. The escrow payments make hiring completely stress-free.", rating: "5" },
            { author: "Cleopatra Philopator", role: "Founder, Alexandria Labs", quote: "High quality talent pool and amazing client interface. Extremely recommended.", rating: "5" }
          ]
        };
      default:
        return {};
    }
  };

  // Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle || !pageSlug) {
      alert("Title and Slug are required.");
      return;
    }

    const payload = contentType === "HTML" ? htmlContent : JSON.stringify(builderBlocks);

    let result;
    if (editorMode === "create") {
      result = await handleCreateCmsPage(pageTitle, pageSlug, pageStatus, contentType, payload);
    } else {
      result = await handleUpdateCmsPage(selectedPage.page_id, pageTitle, pageSlug, pageStatus, contentType, payload);
    }

    if (result && result.message && (result.message.includes("success") || result.page)) {
      alert(result.message);
      setEditorMode("list");
    } else {
      alert(result?.message || "Failed to save CMS page");
    }
  };

  // Styling helper classes
  const panelClass = `p-6 rounded-xl border transition-all duration-300 ${
    isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
  }`;
  
  const tableHeaderClass = `px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
    isDark ? "text-slate-400 border-b border-slate-800" : "text-slate-500 border-b border-slate-200"
  }`;

  const tableRowClass = `transition-colors duration-150 ${
    isDark ? "hover:bg-slate-900/40 border-b border-slate-850" : "hover:bg-slate-50 border-b border-slate-100"
  }`;

  const textInputClass = `w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none border ${
    isDark 
      ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500" 
      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-650"
  }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  return (
    <div className="flex flex-col gap-8 w-full max-w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight font-display">CMS Page Manager</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Create customized landing pages with visual builders or custom HTML templates.
          </p>
        </div>
        {editorMode === "list" && (
          <button
            onClick={openCreateMode}
            className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-teal-700/20 transform active:scale-95 transition-all duration-200 cursor-pointer self-start"
          >
            <FiPlus className="w-4 h-4" /> Create Custom Page
          </button>
        )}
      </div>

      {editorMode === "list" ? (
        /* PAGES LIST VIEW */
        <div className={panelClass}>
          {loadingCms ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
            </div>
          ) : cmsPagesList.length === 0 ? (
            <div className="text-center py-16">
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No custom CMS pages created yet.</p>
              <button
                onClick={openCreateMode}
                className="mt-4 border border-teal-750 hover:bg-teal-750/10 text-teal-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Create the first page
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto w-full" {...dragScrollProps}>
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr>
                    <th className={tableHeaderClass}>S.No</th>
                    <th className={tableHeaderClass}>Page Title</th>
                    <th className={tableHeaderClass}>Slug/URL</th>
                    <th className={tableHeaderClass}>Status</th>
                    <th className={tableHeaderClass}>Content Type</th>
                    <th className={tableHeaderClass}>Last Updated</th>
                    <th className={tableHeaderClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cmsPagesList.map((page, idx) => (
                    <tr key={page.page_id} className={tableRowClass}>
                      <td className="px-6 py-4 text-xs font-bold text-slate-450">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-extrabold">{page.title}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline flex items-center gap-1.5"
                        >
                          <FiGlobe className="w-3.5 h-3.5" /> /{page.slug}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${
                          page.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25"
                            : "bg-slate-400/10 text-slate-500 border border-slate-400/20"
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-450">{page.content_type}</td>
                      <td className="px-6 py-4 text-xs text-slate-450">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm flex items-center gap-3">
                        <button
                          onClick={() => openEditMode(page)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark 
                              ? "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900" 
                              : "border-slate-200 text-slate-550 hover:text-slate-800 hover:bg-slate-100"
                          }`}
                          title="Design / Edit"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCmsPage(page.page_id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark 
                              ? "border-rose-950 text-rose-400 hover:text-white hover:bg-rose-950" 
                              : "border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600"
                          }`}
                          title="Delete Page"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CREATE / EDIT PAGE FORM */
        <form onSubmit={handleSave} className="flex flex-col gap-6 w-full max-w-full">
          {/* Metadata Section */}
          <div className={panelClass}>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 border-b pb-2">Page Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className={labelClass}>Page Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us"
                  value={pageTitle}
                  onChange={(e) => {
                    setPageTitle(e.target.value);
                    if (editorMode === "create") generateSlug(e.target.value);
                  }}
                  className={textInputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Page Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. about-us"
                  value={pageSlug}
                  onChange={(e) => generateSlug(e.target.value)}
                  className={textInputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={pageStatus}
                  onChange={(e) => setPageStatus(e.target.value)}
                  className={textInputClass}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Editor Mode</label>
                <select
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value);
                    if (e.target.value === "HTML" && builderBlocks.length > 0) {
                      setHtmlContent("<!-- Paste custom HTML code here -->");
                    }
                  }}
                  className={textInputClass}
                >
                  <option value="Builder">Visual Element Builder</option>
                  <option value="HTML">Raw HTML Editor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editor Body */}
          {contentType === "HTML" ? (
            /* HTML Editor Mode */
            <div className={panelClass}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-2">Raw HTML Content</h3>
              <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Paste raw HTML structure. Styled stylesheets or external classes can be injected here safely.
              </p>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={16}
                placeholder="<div><h1>Custom Landing</h1></div>"
                className="w-full rounded-xl px-4 py-3 text-sm font-mono border bg-slate-950 text-emerald-400 border-slate-800 focus:outline-none"
              />
            </div>
          ) : (
            /* Visual Builder Mode */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
              
              {/* Elements Library Panel */}
              <div className={`${panelClass} lg:col-span-1 sticky top-20`}>
                <h3 className="text-sm font-black uppercase tracking-wider mb-4 border-b pb-2">Elements catalog</h3>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Banner Section</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => addBlock("Hero")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Hero Search Banner</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("Brands")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Trusted Brands Section</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("Carousel")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Slideshow Carousel</span>
                        <FiPlus />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">General Section</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => addBlock("Title")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Section Header Title</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("RichText")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>HTML / Rich Text Block</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("FeaturesGrid")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Feature Cards Grid</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("Pricing")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Pricing Tables Tier</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("Testimonials")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Client Testimonials</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("FAQ")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>FAQ Accordion List</span>
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("CTA")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Call to Action Banner</span>
                        <FiPlus />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Home Marketplace Section</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => addBlock("Categories")}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${
                          isDark ? "bg-slate-900 border-slate-800 hover:border-teal-700" : "bg-slate-50 border-slate-200 hover:border-teal-700"
                        }`}
                      >
                        <span>Interactive Categories Grid</span>
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Canvas Section */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className={`${panelClass}`}>
                  <h3 className="text-sm font-black uppercase tracking-wider mb-2">Page builder canvas</h3>
                  <p className={`text-xs ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                    Click elements on the left catalog to append them. Edit contents, reorder, or delete blocks directly.
                  </p>
                </div>

                {builderBlocks.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl py-20 flex flex-col items-center justify-center border-slate-300/50">
                    <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-450"}`}>Canvas is empty. Add blocks to get started.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {builderBlocks.map((block, idx) => {
                      const isEditing = editingBlockId === block.id;

                      return (
                        <div
                          key={block.id}
                          className={`rounded-xl border transition-all ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                          } ${isEditing ? "ring-2 ring-teal-500" : ""}`}
                        >
                          {/* Block Header */}
                          <div className={`p-4 flex items-center justify-between border-b ${
                            isDark ? "border-slate-900 bg-slate-900/10" : "border-slate-100 bg-slate-50/50"
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-teal-750 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                Block {idx + 1}
                              </span>
                              <span className="text-sm font-extrabold">{block.type} Element</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => moveBlock(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-teal-700 disabled:opacity-30 cursor-pointer"
                              >
                                <FiChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBlock(idx, "down")}
                                disabled={idx === builderBlocks.length - 1}
                                className="p-1 text-slate-400 hover:text-teal-700 disabled:opacity-30 cursor-pointer"
                              >
                                <FiChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                                className={`p-1.5 rounded-lg border text-slate-450 hover:bg-slate-100 cursor-pointer ${
                                  isEditing ? "bg-slate-250 border-teal-500 text-teal-700" : "border-slate-200"
                                }`}
                                title="Configure properties"
                              >
                                <FiSettings className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Block Settings Editor Form */}
                          {isEditing && (
                            <div className="p-5 border-b border-slate-100 bg-slate-50/20 grid grid-cols-1 gap-4">
                              {block.type === "Hero" && (
                                <>
                                  <div>
                                    <label className={labelClass}>Hero Headline</label>
                                    <input
                                      type="text"
                                      value={block.data.headline || ""}
                                      onChange={(e) => updateBlockData(block.id, "headline", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Subheadline Description</label>
                                    <textarea
                                      value={block.data.subheadline || ""}
                                      onChange={(e) => updateBlockData(block.id, "subheadline", e.target.value)}
                                      rows={2}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className={labelClass}>Search Placeholder</label>
                                      <input
                                        type="text"
                                        value={block.data.searchPlaceholder || ""}
                                        onChange={(e) => updateBlockData(block.id, "searchPlaceholder", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Search Button Text</label>
                                      <input
                                        type="text"
                                        value={block.data.buttonText || ""}
                                        onChange={(e) => updateBlockData(block.id, "buttonText", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              {block.type === "Brands" && (
                                <>
                                  <div>
                                    <label className={labelClass}>Pre-heading Label</label>
                                    <input
                                      type="text"
                                      value={block.data.title || ""}
                                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Brand Logos (comma separated list)</label>
                                    <input
                                      type="text"
                                      value={block.data.logos || ""}
                                      onChange={(e) => updateBlockData(block.id, "logos", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                </>
                              )}

                              {block.type === "Title" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className={labelClass}>Heading Text</label>
                                    <input
                                      type="text"
                                      value={block.data.title || ""}
                                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Sub-text Explanation</label>
                                    <input
                                      type="text"
                                      value={block.data.subtitle || ""}
                                      onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                </div>
                              )}

                              {block.type === "RichText" && (
                                <div>
                                  <label className={labelClass}>HTML Content</label>
                                  <textarea
                                    value={block.data.content || ""}
                                    onChange={(e) => updateBlockData(block.id, "content", e.target.value)}
                                    rows={4}
                                    className={`${textInputClass} font-mono text-xs`}
                                  />
                                </div>
                              )}

                              {block.type === "FAQ" && (
                                <>
                                  <div>
                                    <label className={labelClass}>Accordion Block Title</label>
                                    <input
                                      type="text"
                                      value={block.data.title || ""}
                                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Questions List</label>
                                    {block.data.items?.map((item: any, qIdx: number) => (
                                      <div key={qIdx} className="p-3 border rounded-lg bg-slate-900/5 mb-3 flex flex-col gap-2 relative">
                                        <input
                                          type="text"
                                          placeholder="Question"
                                          value={item.q}
                                          onChange={(e) => {
                                            const newItems = [...block.data.items];
                                            newItems[qIdx].q = e.target.value;
                                            updateBlockData(block.id, "items", newItems);
                                          }}
                                          className={textInputClass}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Answer content"
                                          value={item.a}
                                          onChange={(e) => {
                                            const newItems = [...block.data.items];
                                            newItems[qIdx].a = e.target.value;
                                            updateBlockData(block.id, "items", newItems);
                                          }}
                                          className={textInputClass}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newItems = block.data.items.filter((_: any, iIdx: number) => iIdx !== qIdx);
                                            updateBlockData(block.id, "items", newItems);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold absolute right-3 top-3"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...(block.data.items || []), { q: "New Question?", a: "New Answer" }];
                                        updateBlockData(block.id, "items", newItems);
                                      }}
                                      className="border border-teal-750 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-teal-50"
                                    >
                                      + Add FAQ Item
                                    </button>
                                  </div>
                                </>
                              )}

                              {block.type === "CTA" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className={labelClass}>Headline</label>
                                    <input
                                      type="text"
                                      value={block.data.title || ""}
                                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Sub-description</label>
                                    <input
                                      type="text"
                                      value={block.data.description || ""}
                                      onChange={(e) => updateBlockData(block.id, "description", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Button Text</label>
                                    <input
                                      type="text"
                                      value={block.data.buttonText || ""}
                                      onChange={(e) => updateBlockData(block.id, "buttonText", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Button Link</label>
                                    <input
                                      type="text"
                                      value={block.data.buttonLink || ""}
                                      onChange={(e) => updateBlockData(block.id, "buttonLink", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                </div>
                              )}

                              {block.type === "Categories" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className={labelClass}>Section Title</label>
                                    <input
                                      type="text"
                                      value={block.data.title || ""}
                                      onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={labelClass}>Subtitle Label</label>
                                    <input
                                      type="text"
                                      value={block.data.subtitle || ""}
                                      onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                </div>
                              )}

                              {block.type === "Carousel" && (
                                <>
                                  <div>
                                    <label className={labelClass}>Slides list</label>
                                    {block.data.slides?.map((slide: any, sIdx: number) => (
                                      <div key={sIdx} className="p-4 border rounded-xl bg-slate-900/5 mb-3 flex flex-col gap-3 relative">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className={labelClass}>Slide Title</label>
                                            <input
                                              type="text"
                                              value={slide.title}
                                              onChange={(e) => {
                                                const newSlides = [...block.data.slides];
                                                newSlides[sIdx].title = e.target.value;
                                                updateBlockData(block.id, "slides", newSlides);
                                              }}
                                              className={textInputClass}
                                            />
                                          </div>
                                          <div>
                                            <label className={labelClass}>Button Text</label>
                                            <input
                                              type="text"
                                              value={slide.buttonText}
                                              onChange={(e) => {
                                                const newSlides = [...block.data.slides];
                                                newSlides[sIdx].buttonText = e.target.value;
                                                updateBlockData(block.id, "slides", newSlides);
                                              }}
                                              className={textInputClass}
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className={labelClass}>Image URL</label>
                                            <input
                                              type="text"
                                              value={slide.imageUrl}
                                              onChange={(e) => {
                                                const newSlides = [...block.data.slides];
                                                newSlides[sIdx].imageUrl = e.target.value;
                                                updateBlockData(block.id, "slides", newSlides);
                                              }}
                                              className={textInputClass}
                                            />
                                          </div>
                                          <div>
                                            <label className={labelClass}>Button Link</label>
                                            <input
                                              type="text"
                                              value={slide.buttonLink}
                                              onChange={(e) => {
                                                const newSlides = [...block.data.slides];
                                                newSlides[sIdx].buttonLink = e.target.value;
                                                updateBlockData(block.id, "slides", newSlides);
                                              }}
                                              className={textInputClass}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className={labelClass}>Description</label>
                                          <textarea
                                            value={slide.description}
                                            onChange={(e) => {
                                              const newSlides = [...block.data.slides];
                                              newSlides[sIdx].description = e.target.value;
                                              updateBlockData(block.id, "slides", newSlides);
                                            }}
                                            rows={2}
                                            className={textInputClass}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newSlides = block.data.slides.filter((_: any, iIdx: number) => iIdx !== sIdx);
                                            updateBlockData(block.id, "slides", newSlides);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold absolute right-4 top-4"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSlides = [...(block.data.slides || []), { title: "New Slide", description: "Slide desc", imageUrl: "", buttonText: "Click Me", buttonLink: "#" }];
                                        updateBlockData(block.id, "slides", newSlides);
                                      }}
                                      className="border border-teal-750 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-teal-50"
                                    >
                                      + Add Slide
                                    </button>
                                  </div>
                                </>
                              )}

                              {block.type === "FeaturesGrid" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className={labelClass}>Main Title</label>
                                      <input
                                        type="text"
                                        value={block.data.title || ""}
                                        onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Subtitle</label>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ""}
                                        onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelClass}>Feature Cards List</label>
                                    {block.data.features?.map((feat: any, fIdx: number) => (
                                      <div key={fIdx} className="p-3 border rounded-lg bg-slate-900/5 mb-2.5 flex flex-col gap-2 relative">
                                        <input
                                          type="text"
                                          placeholder="Feature Title"
                                          value={feat.title}
                                          onChange={(e) => {
                                            const newFeats = [...block.data.features];
                                            newFeats[fIdx].title = e.target.value;
                                            updateBlockData(block.id, "features", newFeats);
                                          }}
                                          className={textInputClass}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Feature Description"
                                          value={feat.description}
                                          onChange={(e) => {
                                            const newFeats = [...block.data.features];
                                            newFeats[fIdx].description = e.target.value;
                                            updateBlockData(block.id, "features", newFeats);
                                          }}
                                          className={textInputClass}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newFeats = block.data.features.filter((_: any, iIdx: number) => iIdx !== fIdx);
                                            updateBlockData(block.id, "features", newFeats);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold absolute right-3 top-3"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFeats = [...(block.data.features || []), { title: "New Feature", description: "Details..." }];
                                        updateBlockData(block.id, "features", newFeats);
                                      }}
                                      className="border border-teal-750 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-teal-50"
                                    >
                                      + Add Feature Card
                                    </button>
                                  </div>
                                </>
                              )}

                              {block.type === "Pricing" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className={labelClass}>Main Title</label>
                                      <input
                                        type="text"
                                        value={block.data.title || ""}
                                        onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Subtitle</label>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ""}
                                        onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelClass}>Pricing Plans</label>
                                    {block.data.tiers?.map((tier: any, tIdx: number) => (
                                      <div key={tIdx} className="p-3 border rounded-lg bg-slate-900/5 mb-3 flex flex-col gap-2 relative">
                                        <div className="grid grid-cols-3 gap-2">
                                          <input
                                            type="text"
                                            placeholder="Plan Name"
                                            value={tier.name}
                                            onChange={(e) => {
                                              const newTiers = [...block.data.tiers];
                                              newTiers[tIdx].name = e.target.value;
                                              updateBlockData(block.id, "tiers", newTiers);
                                            }}
                                            className={textInputClass}
                                          />
                                          <input
                                            type="text"
                                            placeholder="Price"
                                            value={tier.price}
                                            onChange={(e) => {
                                              const newTiers = [...block.data.tiers];
                                              newTiers[tIdx].price = e.target.value;
                                              updateBlockData(block.id, "tiers", newTiers);
                                            }}
                                            className={textInputClass}
                                          />
                                          <input
                                            type="text"
                                            placeholder="Billing description"
                                            value={tier.billing}
                                            onChange={(e) => {
                                              const newTiers = [...block.data.tiers];
                                              newTiers[tIdx].billing = e.target.value;
                                              updateBlockData(block.id, "tiers", newTiers);
                                            }}
                                            className={textInputClass}
                                          />
                                        </div>
                                        <div>
                                          <label className={labelClass}>Features (comma separated list)</label>
                                          <input
                                            type="text"
                                            value={Array.isArray(tier.features) ? tier.features.join(", ") : tier.features}
                                            onChange={(e) => {
                                              const newTiers = [...block.data.tiers];
                                              newTiers[tIdx].features = e.target.value.split(",").map((s: string) => s.trim());
                                              updateBlockData(block.id, "tiers", newTiers);
                                            }}
                                            className={textInputClass}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newTiers = block.data.tiers.filter((_: any, iIdx: number) => iIdx !== tIdx);
                                            updateBlockData(block.id, "tiers", newTiers);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold absolute right-3 top-3"
                                        >
                                          Remove Plan
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTiers = [...(block.data.tiers || []), { name: "Pro Plan", price: "$29", billing: "/month", features: ["Fast support", "All tools"] }];
                                        updateBlockData(block.id, "tiers", newTiers);
                                      }}
                                      className="border border-teal-750 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-teal-50"
                                    >
                                      + Add Pricing Plan
                                    </button>
                                  </div>
                                </>
                              )}

                              {block.type === "Testimonials" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className={labelClass}>Main Title</label>
                                      <input
                                        type="text"
                                        value={block.data.title || ""}
                                        onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Subtitle</label>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ""}
                                        onChange={(e) => updateBlockData(block.id, "subtitle", e.target.value)}
                                        className={textInputClass}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelClass}>User Testimonials</label>
                                    {block.data.reviews?.map((rev: any, rIdx: number) => (
                                      <div key={rIdx} className="p-3 border rounded-lg bg-slate-900/5 mb-3 flex flex-col gap-2 relative">
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="text"
                                            placeholder="Author Name"
                                            value={rev.author}
                                            onChange={(e) => {
                                              const newReviews = [...block.data.reviews];
                                              newReviews[rIdx].author = e.target.value;
                                              updateBlockData(block.id, "reviews", newReviews);
                                            }}
                                            className={textInputClass}
                                          />
                                          <input
                                            type="text"
                                            placeholder="Author Role"
                                            value={rev.role}
                                            onChange={(e) => {
                                              const newReviews = [...block.data.reviews];
                                              newReviews[rIdx].role = e.target.value;
                                              updateBlockData(block.id, "reviews", newReviews);
                                            }}
                                            className={textInputClass}
                                          />
                                        </div>
                                        <textarea
                                          placeholder="Quote description"
                                          value={rev.quote}
                                          onChange={(e) => {
                                            const newReviews = [...block.data.reviews];
                                            newReviews[rIdx].quote = e.target.value;
                                            updateBlockData(block.id, "reviews", newReviews);
                                          }}
                                          rows={2}
                                          className={textInputClass}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newReviews = block.data.reviews.filter((_: any, iIdx: number) => iIdx !== rIdx);
                                            updateBlockData(block.id, "reviews", newReviews);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold absolute right-3 top-3"
                                        >
                                          Remove Review
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newReviews = [...(block.data.reviews || []), { author: "Sarah Jenkins", role: "CEO, Spark", quote: "Extremely pleased with the developers we hired.", rating: "5" }];
                                        updateBlockData(block.id, "reviews", newReviews);
                                      }}
                                      className="border border-teal-750 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-teal-50"
                                    >
                                      + Add Testimonial
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* Block Canvas Preview */}
                          <div className={`p-6 text-xs text-slate-500 overflow-hidden ${
                            isDark ? "bg-slate-950/20" : "bg-slate-50/20"
                          }`}>
                            {block.type === "Hero" && (
                              <div className="bg-gradient-to-tr from-teal-900/10 to-teal-500/5 p-6 rounded-xl border border-teal-500/10 text-center flex flex-col items-center gap-3">
                                <h1 className="text-sm font-extrabold text-teal-700">{block.data.headline}</h1>
                                <p className="text-[10px] text-slate-400 max-w-sm">{block.data.subheadline}</p>
                                <div className="flex items-center border rounded-lg bg-white overflow-hidden max-w-xs w-full">
                                  <span className="flex-1 px-3 text-slate-400">{block.data.searchPlaceholder}</span>
                                  <span className="bg-teal-700 text-white font-bold px-3 py-1 text-[10px]">{block.data.buttonText}</span>
                                </div>
                              </div>
                            )}

                            {block.type === "Brands" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl text-center border border-dashed flex flex-col items-center gap-2">
                                <span className="font-bold text-[9px] uppercase tracking-wider">{block.data.title}</span>
                                <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-400">
                                  {block.data.logos?.split(",").map((l: string, idx: number) => (
                                    <span key={idx} className="bg-white/50 px-2 py-0.5 rounded border border-slate-200/50 shadow-sm">{l.trim()}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {block.type === "Title" && (
                              <div className="text-center py-4 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-800">{block.data.title}</h2>
                                <p className="text-[10px] text-slate-400">{block.data.subtitle}</p>
                              </div>
                            )}

                            {block.type === "RichText" && (
                              <div className="p-4 border rounded-xl bg-slate-50/20 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.content || "" }} />
                            )}

                            {block.type === "FAQ" && (
                              <div className="p-4 border rounded-xl bg-slate-50/20 flex flex-col gap-2">
                                <h3 className="font-black text-slate-850 mb-1">{block.data.title}</h3>
                                {block.data.items?.map((item: any, qIdx: number) => (
                                  <div key={qIdx} className="border-b pb-2">
                                    <p className="font-bold text-teal-750">Q: {item.q}</p>
                                    <p className="text-slate-450">A: {item.a}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {block.type === "CTA" && (
                              <div className="p-6 bg-teal-800/10 rounded-xl border border-teal-750/10 text-center flex flex-col items-center gap-2">
                                <h3 className="font-black text-teal-750">{block.data.title}</h3>
                                <p className="text-[10px] text-slate-450">{block.data.description}</p>
                                <span className="bg-teal-750 text-white font-bold px-4 py-1.5 rounded-lg mt-1 select-none pointer-events-none">
                                  {block.data.buttonText}
                                </span>
                              </div>
                            )}

                            {block.type === "Categories" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl border border-dashed text-center flex flex-col items-center gap-2">
                                <h3 className="font-bold">{block.data.title}</h3>
                                <p className="text-[10px] text-slate-450">{block.data.subtitle}</p>
                                <div className="grid grid-cols-4 gap-2 w-full mt-2">
                                  {["Development", "Design", "Writing", "Marketing"].map((cat, idx) => (
                                    <div key={idx} className="bg-white p-2 rounded-lg border text-center font-bold text-[9px] shadow-sm">{cat}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {block.type === "Carousel" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl text-center border border-dashed flex flex-col items-center gap-2">
                                <span className="font-bold text-[9px] uppercase tracking-wider text-teal-700">Slideshow Carousel Mock</span>
                                <div className="text-[10px] text-slate-400">
                                  {block.data.slides?.length} Slides added (e.g. "{block.data.slides?.[0]?.title}")
                                </div>
                              </div>
                            )}

                            {block.type === "FeaturesGrid" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl border border-dashed flex flex-col gap-2">
                                <h4 className="font-bold text-center text-[10px]">{block.data.title}</h4>
                                <div className="grid grid-cols-3 gap-2 w-full mt-1">
                                  {block.data.features?.map((f: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded border text-center text-[8px] font-semibold">{f.title}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {block.type === "Pricing" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl border border-dashed flex flex-col gap-2">
                                <h4 className="font-bold text-center text-[10px]">{block.data.title}</h4>
                                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                  {block.data.tiers?.map((t: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded border text-center text-[8px] font-semibold">
                                      {t.name} ({t.price})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {block.type === "Testimonials" && (
                              <div className="p-4 bg-slate-900/5 rounded-xl border border-dashed flex flex-col gap-2 text-center">
                                <h4 className="font-bold text-[10px]">{block.data.title}</h4>
                                <div className="text-[9px] italic text-slate-450">
                                  "{block.data.reviews?.[0]?.quote}" - {block.data.reviews?.[0]?.author}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-4 justify-end mt-4">
            <button
              type="button"
              onClick={() => setEditorMode("list")}
              className={`font-bold text-sm px-6 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                isDark 
                  ? "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900" 
                  : "border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-teal-700/20 transform active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Save & Publish Page
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
