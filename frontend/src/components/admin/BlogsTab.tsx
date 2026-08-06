"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../../app/admin/AdminContext";
import { API_URL } from "@/config/api";
import CustomSelect from "@/components/CustomSelect";
import { 
  FiPlus, FiTrash2, FiGlobe, FiFolder, FiCheck, FiX, 
  FiChevronUp, FiChevronDown, FiType, FiImage, FiFileText, 
  FiCode, FiMessageSquare, FiAlertCircle, FiList, FiColumns,
  FiEdit2, FiExternalLink, FiCreditCard, FiChevronLeft 
} from "react-icons/fi";

interface Block {
  id: string;
  type: "header" | "paragraph" | "image" | "quote" | "code" | "callout" | "list" | "columns" | "button" | "card";
  data: Record<string, any>;
}

export default function BlogsTab() {
  const {
    adminTheme,
    blogsList = [],
    loadingBlogs,
    fetchBlogs,
    handleCreateBlog,
    handleUpdateBlog,
    handleDeleteBlog
  } = useAdmin();

  const isDark = adminTheme === "dark";

  // View state
  const [editorMode, setEditorMode] = useState<"list" | "create" | "edit">("list");
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  // Editor Type: "blocks" (Visual Builder) or "html" (Raw HTML editor)
  const [editorType, setEditorType] = useState<"blocks" | "html">("blocks");

  // Form states
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogContent, setBlogContent] = useState(""); // Stores compiled HTML
  const [blogCoverImage, setBlogCoverImage] = useState("");
  const [blogCategory, setBlogCategory] = useState("General");
  const [isPublished, setIsPublished] = useState(false);
  const [blogAuthorName, setBlogAuthorName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Block Builder States
  const [blogBlocks, setBlogBlocks] = useState<Block[]>([]);

  // File Upload State
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateMode = () => {
    setBlogTitle("");
    setBlogSlug("");
    setBlogSummary("");
    setBlogContent("");
    setBlogCoverImage("");
    setBlogCategory("General");
    setIsPublished(false);
    setBlogAuthorName("");
    setIsCreatingCategory(false);
    setSelectedBlog(null);
    setEditorType("blocks");
    setBlogBlocks([
      {
        id: "block-intro-" + Date.now(),
        type: "header",
        data: { text: "Introduction to LancerFlow Blogs", level: "h2" }
      },
      {
        id: "block-p-" + Date.now(),
        type: "paragraph",
        data: { text: "Welcome to your upgraded layout builder! Write beautiful articles with rich component grids, side-by-side columns, lists, quotes, and inline code." }
      }
    ]);
    setEditorMode("create");
  };

  const openEditMode = (blog: any) => {
    setSelectedBlog(blog);
    setBlogTitle(blog.title);
    setBlogSlug(blog.slug);
    setBlogSummary(blog.summary || "");
    setBlogContent(blog.content);
    setBlogCoverImage(blog.cover_image || "");
    setBlogCategory(blog.category || "General");
    setIsPublished(blog.is_published);
    setBlogAuthorName(blog.author_name || "");
    setIsCreatingCategory(false);

    // Try to parse visual blocks from HTML comment metadata
    const parsedBlocks = parseHtmlToBlocks(blog.content);
    if (parsedBlocks) {
      setBlogBlocks(parsedBlocks);
      setEditorType("blocks");
    } else {
      // Fallback to raw HTML editor if it wasn't built using Block Builder
      setBlogBlocks([]);
      setEditorType("html");
    }

    setEditorMode("edit");
  };

  const generateSlug = (val: string) => {
    setBlogSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "cover" | string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingField(target);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await res.json();
      if (target === "cover") {
        setBlogCoverImage(data.url);
      } else {
        updateBlockData(target, "url", data.url);
      }
      alert("Image uploaded successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to upload image.");
    } finally {
      setUploadingField(null);
    }
  };

  // Compile blocks into raw HTML string with embedded blocks metadata
  const compileBlocksToHtml = (blocks: Block[]): string => {
    const html = blocks.map(block => {
      switch (block.type) {
        case "header":
          return `<${block.data.level || "h2"}>${block.data.text || ""}</${block.data.level || "h2"}>`;
        
        case "paragraph":
          const textWithBreaks = (block.data.text || "").replace(/\n/g, "<br>");
          return `<p>${textWithBreaks}</p>`;
        
        case "image":
          const alignClass = 
            block.data.align === "left" 
              ? "float-left mr-6 my-2" 
              : block.data.align === "right" 
                ? "float-right ml-6 my-2" 
                : "mx-auto block my-6";
          
          let imgTag = `<img src="${block.data.url || ""}" alt="${block.data.caption || ""}" class="rounded-2xl max-w-full border border-slate-200 dark:border-slate-800 ${alignClass}" />`;
          if (block.data.linkUrl) {
            imgTag = `<a href="${block.data.linkUrl}" target="_blank" rel="noopener noreferrer">${imgTag}</a>`;
          }

          if (block.data.caption) {
            return `<figure class="my-6 text-center">${imgTag}<figcaption class="text-xs text-slate-500 mt-2 italic">${block.data.caption}</figcaption></figure><div class="clear-both"></div>`;
          }
          return `${imgTag}<div class="clear-both"></div>`;
        
        case "quote":
          const citationTag = block.data.citation 
            ? `<cite class="block text-xs text-slate-400 mt-2 font-bold not-italic">— ${block.data.citation}</cite>` 
            : "";
          return `<blockquote>${block.data.text || ""}${citationTag}</blockquote>`;
        
        case "code":
          return `<pre><code class="language-${block.data.language || "javascript"}">${block.data.code || ""}</code></pre>`;
        
        case "callout":
          const colors = {
            info: "bg-teal-50 dark:bg-teal-950/20 border-teal-500 text-teal-950 dark:text-teal-200",
            warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-955 dark:text-amber-200",
            tip: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-955 dark:text-emerald-200"
          };
          const colorClass = colors[block.data.type as "info" | "warning" | "tip"] || colors.info;
          return `<div class="p-4 rounded-xl border-l-4 ${colorClass} my-6"><p class="m-0 font-semibold text-sm leading-relaxed">${block.data.text || ""}</p></div>`;
        
        case "list":
          const listTag = block.data.style === "ordered" ? "ol" : "ul";
          const listItems = (block.data.items || [])
            .filter((item: string) => item.trim() !== "")
            .map((item: string) => `  <li>${item}</li>`)
            .join("\n");
          return `<${listTag} class="list-${block.data.style === "ordered" ? "decimal" : "disc"} pl-6 my-4 space-y-1.5">\n${listItems}\n</${listTag}>`;

        case "columns":
          let gridCols = "md:grid-cols-2";
          if (block.data.layout === "60-40") gridCols = "md:grid-cols-[3fr_2fr]";
          if (block.data.layout === "40-60") gridCols = "md:grid-cols-[2fr_3fr]";
          const leftTextHtml = (block.data.leftText || "").replace(/\n/g, "<br>");
          const rightTextHtml = (block.data.rightText || "").replace(/\n/g, "<br>");
          return `<div class="grid grid-cols-1 ${gridCols} gap-6 my-6 items-start">\n  <div>${leftTextHtml}</div>\n  <div>${rightTextHtml}</div>\n</div>\n<div class="clear-both"></div>`;

        case "button":
          const btnAlign = block.data.align === "left" ? "text-left" : block.data.align === "right" ? "text-right" : "text-center";
          const btnStyle = block.data.style === "secondary" 
            ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800" 
            : "bg-teal-700 hover:bg-teal-600 text-white shadow-md";
          return `<div class="${btnAlign} my-6"><a href="${block.data.url || "#"}" target="_blank" rel="noopener noreferrer" class="inline-block px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 cursor-pointer ${btnStyle}">${block.data.text || "Click Here"}</a></div>`;

        case "card":
          const cardImg = block.data.imageUrl ? `<img src="${block.data.imageUrl}" alt="" class="w-full h-44 object-cover" />` : "";
          return `<div class="my-6 max-w-sm mx-auto rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"><a href="${block.data.linkUrl || "#"}" class="block group"><div class="overflow-hidden bg-slate-100">${cardImg}</div><div class="p-5 flex flex-col gap-2"><h4 class="font-black text-slate-850 dark:text-slate-100 text-sm group-hover:text-teal-750 transition-colors">${block.data.title || "Card Title"}</h4><p class="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed m-0">${block.data.description || "Card description..."}</p><span class="text-[10px] font-black text-teal-700 uppercase tracking-wider mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">Learn More &rarr;</span></div></a></div>`;

        default:
          return "";
      }
    }).join("\n");

    // Append block structure metadata JSON as an HTML comment
    const blockMetadata = `<!-- lancerflow-blocks: ${JSON.stringify(blocks)} -->`;
    return `${html}\n${blockMetadata}`;
  };

  const parseHtmlToBlocks = (html: string): Block[] | null => {
    if (!html) return null;
    const match = html.match(/<!-- lancerflow-blocks: (.*) -->/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse block structure comment", e);
      }
    }
    return null;
  };

  // Add block helper
  const addBlock = (type: Block["type"]) => {
    const id = `block-${type}-${Date.now()}`;
    let defaultData = {};

    switch (type) {
      case "header":
        defaultData = { text: "", level: "h2" };
        break;
      case "paragraph":
        defaultData = { text: "" };
        break;
      case "image":
        defaultData = { url: "", caption: "", align: "center", linkUrl: "" };
        break;
      case "quote":
        defaultData = { text: "", citation: "" };
        break;
      case "code":
        defaultData = { code: "", language: "javascript" };
        break;
      case "callout":
        defaultData = { text: "", type: "info" };
        break;
      case "list":
        defaultData = { style: "unordered", items: ["", ""] };
        break;
      case "columns":
        defaultData = { layout: "50-50", leftText: "", rightText: "" };
        break;
      case "button":
        defaultData = { text: "Learn More", url: "", align: "center", style: "primary" };
        break;
      case "card":
        defaultData = { title: "Special Promotion", description: "Vett expert developers on demand.", imageUrl: "", linkUrl: "" };
        break;
    }

    setBlogBlocks([...blogBlocks, { id, type, data: defaultData }]);
  };

  // Remove block helper
  const removeBlock = (id: string) => {
    setBlogBlocks(blogBlocks.filter(b => b.id !== id));
  };

  // Move block helper
  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blogBlocks.length) return;

    const updated = [...blogBlocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlogBlocks(updated);
  };

  // Update single block values
  const updateBlockData = (id: string, key: string, value: any) => {
    setBlogBlocks(
      blogBlocks.map(block => {
        if (block.id === id) {
          return {
            ...block,
            data: { ...block.data, [key]: value }
          };
        }
        return block;
      })
    );
  };

  // List Item actions
  const addListItem = (blockId: string) => {
    const block = blogBlocks.find(b => b.id === blockId);
    if (!block) return;
    const items = [...(block.data.items || []), ""];
    updateBlockData(blockId, "items", items);
  };

  const removeListItem = (blockId: string, itemIdx: number) => {
    const block = blogBlocks.find(b => b.id === blockId);
    if (!block) return;
    const items = (block.data.items || []).filter((_: any, idx: number) => idx !== itemIdx);
    updateBlockData(blockId, "items", items);
  };

  const updateListItem = (blockId: string, itemIdx: number, val: string) => {
    const block = blogBlocks.find(b => b.id === blockId);
    if (!block) return;
    const items = (block.data.items || []).map((item: string, idx: number) => idx === itemIdx ? val : item);
    updateBlockData(blockId, "items", items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle) {
      alert("Title is required.");
      return;
    }

    // Compile content depending on the editor Type selected
    let compiledHtml = "";
    if (editorType === "blocks") {
      if (blogBlocks.length === 0) {
        alert("Please add at least one content block to your blog post.");
        return;
      }
      compiledHtml = compileBlocksToHtml(blogBlocks);
    } else {
      if (!blogContent) {
        alert("Content is required in raw HTML mode.");
        return;
      }
      compiledHtml = blogContent;
    }

    const payload = {
      title: blogTitle,
      slug: blogSlug,
      summary: blogSummary || (editorType === "blocks" 
        ? blogBlocks.find(b => b.type === "paragraph")?.data.text?.substring(0, 150) + "..." 
        : ""),
      content: compiledHtml,
      cover_image: blogCoverImage,
      category: blogCategory,
      is_published: isPublished,
      author_name: blogAuthorName || null
    };

    let result;
    if (editorMode === "create") {
      result = await handleCreateBlog(payload);
    } else {
      result = await handleUpdateBlog(selectedBlog.blog_id, payload);
    }

    if (result && (result.blog || result.message?.includes("success"))) {
      alert(result.message || "Blog post saved successfully!");
      setEditorMode("list");
    } else {
      alert(result?.message || "Failed to save blog post");
    }
  };

  const confirmDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      await handleDeleteBlog(id);
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
    isDark ? "hover:bg-slate-900/40 border-b border-slate-800" : "hover:bg-slate-50 border-b border-slate-100"
  }`;

  const textInputClass = `w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none border ${
    isDark 
      ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500" 
      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-650"
  }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  // Filtered blogs list
  const filteredBlogs = blogsList.filter((blog: any) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.summary && blog.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || blog.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Get distinct categories
  const categories = Array.from(
    new Set(blogsList.map((blog: any) => blog.category || "General"))
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight font-display">Blog CMS Dashboard</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Create visually appealing publications using modular components or advanced HTML.
          </p>
        </div>
        {editorMode === "list" && (
          <button
            onClick={openCreateMode}
            className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-teal-700/20 transform active:scale-95 transition-all duration-200 cursor-pointer self-start animate-fadeIn"
          >
            <FiPlus className="w-4 h-4" /> Create Blog Post
          </button>
        )}
      </div>

      {editorMode === "list" ? (
        /* BLOGS LIST VIEW */
        <div className="flex flex-col gap-6 w-full">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={textInputClass}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-56 shrink-0">
              <CustomSelect
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.map((cat: any) => ({ value: cat, label: cat }))
                ]}
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
              />
            </div>
          </div>

          <div className={panelClass}>
            {loadingBlogs ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-16">
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  No blog posts found.
                </p>
                <button
                  onClick={openCreateMode}
                  className="mt-4 border border-teal-750 hover:bg-teal-750/10 text-teal-750 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Write your first post
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Cover</th>
                      <th className={tableHeaderClass}>Blog Title</th>
                      <th className={tableHeaderClass}>Category</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Author</th>
                      <th className={tableHeaderClass}>Last Updated</th>
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlogs.map((blog) => (
                      <tr key={blog.blog_id} className={tableRowClass}>
                        <td className="px-6 py-4 text-xs font-bold text-slate-450 align-middle">
                          {blog.cover_image ? (
                            <img
                              src={blog.cover_image}
                              alt=""
                              className="w-12 h-8 rounded object-cover border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-12 h-8 rounded bg-slate-200 dark:bg-slate-855 flex items-center justify-center text-slate-400 text-[10px]">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="text-sm font-extrabold">{blog.title}</div>
                          <div className="text-xs text-slate-455 flex items-center gap-1 mt-0.5">
                            <FiGlobe className="w-3 h-3 text-slate-400" /> /blogs/{blog.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-teal-600 dark:text-teal-400 align-middle">
                          <span className="flex items-center gap-1.5">
                            <FiFolder className="w-3.5 h-3.5 text-teal-600/70 dark:text-teal-400/80" />
                            {blog.category || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold align-middle">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              blog.is_published
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                                : "bg-slate-400/10 text-slate-500 dark:text-slate-350 border border-slate-400/20"
                            }`}
                          >
                            {blog.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-450 align-middle">
                          {blog.author_name || "Administrator"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450 align-middle">
                          {new Date(blog.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm align-middle">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditMode(blog)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                  : "border-slate-200 text-slate-555 hover:text-slate-800 hover:bg-slate-100"
                              }`}
                              title="Edit Post"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            {blog.is_published && (
                              <a
                                href={`/blogs/${blog.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDark
                                    ? "border-slate-800 text-teal-400 hover:bg-slate-900"
                                    : "border-slate-200 text-teal-600 hover:bg-slate-100"
                                }`}
                                title="View Article"
                              >
                                <FiGlobe className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => confirmDelete(blog.blog_id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? "border-rose-955 text-rose-400 hover:text-white hover:bg-rose-950"
                                  : "border-slate-200 text-rose-600 hover:text-white hover:bg-rose-500"
                              }`}
                              title="Delete Post"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BLOG CREATOR / EDITOR FORM */
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl w-full">
          <div>
            <button
              type="button"
              onClick={() => setEditorMode("list")}
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${
                isDark ? "text-slate-450 hover:text-white" : "text-slate-500 hover:text-teal-700"
              }`}
            >
              <FiChevronLeft className="w-4.5 h-4.5" /> Back to blog list
            </button>
          </div>
          {/* GENERAL INFO BAR */}
          <div className={panelClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-450 mb-4">Post Settings</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Blog Title</label>
                <input
                  type="text"
                  placeholder="Enter a compelling title..."
                  value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    if (editorMode === "create") generateSlug(e.target.value);
                  }}
                  className={textInputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Slug (URL Key)</label>
                  <input
                    type="text"
                    placeholder="url-friendly-slug"
                    value={blogSlug}
                    onChange={(e) => generateSlug(e.target.value)}
                    className={textInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  {!isCreatingCategory ? (
                    <select
                      value={blogCategory}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setIsCreatingCategory(true);
                          setBlogCategory("");
                        } else {
                          setBlogCategory(e.target.value);
                        }
                      }}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none border ${
                        isDark
                          ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500"
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-650"
                      }`}
                    >
                      {/* Gather and render all existing categories */}
                      {Array.from(new Set(["General", ...blogsList.map((b: any) => b.category).filter(Boolean)])).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__" className="text-teal-650 font-bold">
                        + Add New Category...
                      </option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter new category name..."
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        className={textInputClass}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          // Default back to first category
                          const firstCat = blogsList[0]?.category || "General";
                          setBlogCategory(firstCat);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                          isDark
                            ? "border-slate-800 text-slate-400 hover:bg-slate-900"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Choose List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>Cover Image</label>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "cover")}
                      className="hidden"
                      id="coverImageUpload"
                    />
                    <label
                      htmlFor="coverImageUpload"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-800 transition-all cursor-pointer select-none shrink-0"
                    >
                      {uploadingField === "cover" ? "Uploading..." : "Upload Cover"}
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste cover URL manually..."
                      value={blogCoverImage}
                      onChange={(e) => setBlogCoverImage(e.target.value)}
                      className={textInputClass}
                    />
                  </div>
                  {blogCoverImage && (
                    <div className="mt-1 flex items-center gap-2">
                      <img src={blogCoverImage} alt="" className="w-16 h-10 object-cover rounded-lg border border-slate-200/60" />
                      <span className="text-[10px] text-slate-400 truncate max-w-xs">{blogCoverImage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Author Pen Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Editorial Core, LancerFlow Staff (Optional)"
                    value={blogAuthorName}
                    onChange={(e) => setBlogAuthorName(e.target.value)}
                    className={textInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Brief Summary (Optional)</label>
                  <input
                    type="text"
                    placeholder="Short meta description shown on feeds..."
                    value={blogSummary}
                    onChange={(e) => setBlogSummary(e.target.value)}
                    className={textInputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EDITOR TOGGLE BAR */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => {
                if (editorType === "html" && blogContent) {
                  const check = confirm("Switching to Visual Builder will ignore any manual HTML code updates. Continue?");
                  if (!check) return;
                }
                setEditorType("blocks");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                editorType === "blocks"
                  ? "bg-teal-700 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <FiFolder className="w-3.5 h-3.5" /> Component Block Builder
            </button>
            <button
              type="button"
              onClick={() => {
                // If switching to HTML, compile current blocks first
                if (editorType === "blocks" && blogBlocks.length > 0) {
                  setBlogContent(compileBlocksToHtml(blogBlocks));
                }
                setEditorType("html");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                editorType === "html"
                  ? "bg-teal-700 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <FiCode className="w-3.5 h-3.5" /> Raw HTML Editor
            </button>
          </div>

          {/* WRITING WORKSPACE */}
          <div className="flex flex-col gap-6">
            {editorType === "blocks" ? (
              /* DYNAMIC MODULAR BLOG BUILDER workspace */
              <div className="flex flex-col gap-4">
                {blogBlocks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    <FiFolder className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-500">Your article is currently empty.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Insert a block using the panel options below to start writing.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {blogBlocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className={`group/block p-5 rounded-2xl border transition-all duration-200 relative ${
                          isDark 
                            ? "bg-slate-955 border-slate-850 hover:border-slate-800" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Block Reorder & Delete Toolbar (shows on block hover) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity duration-150">
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, "up")}
                            disabled={idx === 0}
                            className={`p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
                            title="Move Up"
                          >
                            <FiChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, "down")}
                            disabled={idx === blogBlocks.length - 1}
                            className={`p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
                            title="Move Down"
                          >
                            <FiChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-200 dark:border-rose-955 dark:bg-slate-900 dark:hover:bg-rose-950 cursor-pointer"
                            title="Delete Block"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Block Title Indicator */}
                        <div className="flex items-center gap-2 mb-3 select-none">
                          {block.type === "header" && <FiType className="w-4 h-4 text-sky-500" />}
                          {block.type === "paragraph" && <FiFileText className="w-4 h-4 text-emerald-500" />}
                          {block.type === "image" && <FiImage className="w-4 h-4 text-purple-500" />}
                          {block.type === "quote" && <FiMessageSquare className="w-4 h-4 text-amber-500" />}
                          {block.type === "code" && <FiCode className="w-4 h-4 text-indigo-500" />}
                          {block.type === "callout" && <FiAlertCircle className="w-4 h-4 text-teal-500" />}
                          {block.type === "list" && <FiList className="w-4 h-4 text-pink-500" />}
                          {block.type === "columns" && <FiColumns className="w-4 h-4 text-orange-500" />}
                          {block.type === "button" && <FiExternalLink className="w-4 h-4 text-cyan-500" />}
                          {block.type === "card" && <FiCreditCard className="w-4 h-4 text-rose-500" />}
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {block.type} component
                          </span>
                        </div>

                        {/* Block Editor Inputs */}
                        <div className="space-y-4">
                          {block.type === "header" && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="sm:w-28 shrink-0">
                                <select
                                  value={block.data.level || "h2"}
                                  onChange={(e) => updateBlockData(block.id, "level", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="h2">H2 (Heading)</option>
                                  <option value="h3">H3 (Subheading)</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                placeholder="Enter heading text..."
                                value={block.data.text || ""}
                                onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                                className={textInputClass}
                                required
                              />
                            </div>
                          )}

                          {block.type === "paragraph" && (
                            <textarea
                              rows={4}
                              placeholder="Write your paragraph content..."
                              value={block.data.text || ""}
                              onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                              className={textInputClass}
                              required
                            />
                          )}

                          {block.type === "image" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleFileUpload(e, block.id)}
                                      className="hidden"
                                      id={`file-upload-${block.id}`}
                                    />
                                    <label
                                      htmlFor={`file-upload-${block.id}`}
                                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-800 transition-all cursor-pointer select-none shrink-0 animate-fadeIn"
                                    >
                                      {uploadingField === block.id ? "Uploading..." : "Upload Image"}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Or paste image URL manually..."
                                      value={block.data.url || ""}
                                      onChange={(e) => updateBlockData(block.id, "url", e.target.value)}
                                      className={textInputClass}
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <select
                                    value={block.data.align || "center"}
                                    onChange={(e) => updateBlockData(block.id, "align", e.target.value)}
                                    className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold border outline-none ${
                                      isDark ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500" : "bg-slate-50 border-slate-200 focus:border-teal-650"
                                    }`}
                                  >
                                    <option value="center">Centered</option>
                                    <option value="left">Left Float</option>
                                    <option value="right">Right Float</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Image caption or alt text (Optional)..."
                                  value={block.data.caption || ""}
                                  onChange={(e) => updateBlockData(block.id, "caption", e.target.value)}
                                  className={textInputClass}
                                />
                                <input
                                  type="text"
                                  placeholder="Image redirect Link URL (e.g. https://google.com) (Optional)..."
                                  value={block.data.linkUrl || ""}
                                  onChange={(e) => updateBlockData(block.id, "linkUrl", e.target.value)}
                                  className={textInputClass}
                                />
                              </div>
                              {block.data.url && (
                                <div className="mt-2 flex justify-center bg-slate-100 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50">
                                  <img
                                    src={block.data.url}
                                    alt="Preview"
                                    className="max-h-36 rounded-lg object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {block.type === "quote" && (
                            <div className="space-y-3">
                              <textarea
                                rows={2}
                                placeholder="Quote content..."
                                value={block.data.text || ""}
                                onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                                className={textInputClass}
                                required
                              />
                              <input
                                type="text"
                                placeholder="Citation/Author (e.g. Steve Jobs, 2011)"
                                value={block.data.citation || ""}
                                onChange={(e) => updateBlockData(block.id, "citation", e.target.value)}
                                className={textInputClass}
                              />
                            </div>
                          )}

                          {block.type === "code" && (
                            <div className="space-y-3">
                              <div className="w-44">
                                <select
                                  value={block.data.language || "javascript"}
                                  onChange={(e) => updateBlockData(block.id, "language", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="javascript">JavaScript / TS</option>
                                  <option value="python">Python</option>
                                  <option value="css">HTML / CSS</option>
                                  <option value="sql">PostgreSQL / SQL</option>
                                  <option value="rust">Rust / C++</option>
                                </select>
                              </div>
                              <textarea
                                rows={6}
                                placeholder="Paste or type code syntax here..."
                                value={block.data.code || ""}
                                onChange={(e) => updateBlockData(block.id, "code", e.target.value)}
                                className={`${textInputClass} font-mono text-xs`}
                                required
                              />
                            </div>
                          )}

                          {block.type === "callout" && (
                            <div className="space-y-3">
                              <div className="w-44">
                                <select
                                  value={block.data.type || "info"}
                                  onChange={(e) => updateBlockData(block.id, "type", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="info">Info (Teal)</option>
                                  <option value="tip">Tip (Green)</option>
                                  <option value="warning">Warning (Orange)</option>
                                </select>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Callout box text content..."
                                value={block.data.text || ""}
                                onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                                className={textInputClass}
                                required
                              />
                            </div>
                          )}

                          {block.type === "list" && (
                            <div className="space-y-3">
                              <div className="w-44">
                                <select
                                  value={block.data.style || "unordered"}
                                  onChange={(e) => updateBlockData(block.id, "style", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="unordered">Bullet Points (ul)</option>
                                  <option value="ordered">Numbered List (ol)</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                {(block.data.items || []).map((item: string, itemIdx: number) => (
                                  <div key={itemIdx} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 select-none">
                                      {block.data.style === "ordered" ? `${itemIdx + 1}.` : "•"}
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={`List item ${itemIdx + 1}...`}
                                      value={item}
                                      onChange={(e) => updateListItem(block.id, itemIdx, e.target.value)}
                                      className={textInputClass}
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeListItem(block.id, itemIdx)}
                                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-slate-200/50 cursor-pointer shrink-0"
                                      title="Remove item"
                                    >
                                      <FiX className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => addListItem(block.id)}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-905 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-255 dark:border-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <FiPlus className="w-3.5 h-3.5" /> Add List Item
                              </button>
                            </div>
                          )}

                          {block.type === "columns" && (
                            <div className="space-y-3">
                              <div className="w-44">
                                <select
                                  value={block.data.layout || "50-50"}
                                  onChange={(e) => updateBlockData(block.id, "layout", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="50-50">50% / 50% Ratio</option>
                                  <option value="60-40">60% / 40% Ratio</option>
                                  <option value="40-60">40% / 60% Ratio</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Left Column Content
                                  </label>
                                  <textarea
                                    rows={6}
                                    placeholder="Write left column paragraphs/text..."
                                    value={block.data.leftText || ""}
                                    onChange={(e) => updateBlockData(block.id, "leftText", e.target.value)}
                                    className={textInputClass}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Right Column Content
                                  </label>
                                  <textarea
                                    rows={6}
                                    placeholder="Write right column paragraphs/text..."
                                    value={block.data.rightText || ""}
                                    onChange={(e) => updateBlockData(block.id, "rightText", e.target.value)}
                                    className={textInputClass}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === "button" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Button Text
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Learn More &rarr;"
                                  value={block.data.text || ""}
                                  onChange={(e) => updateBlockData(block.id, "text", e.target.value)}
                                  className={textInputClass}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Redirect Link URL
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. https://google.com"
                                  value={block.data.url || ""}
                                  onChange={(e) => updateBlockData(block.id, "url", e.target.value)}
                                  className={textInputClass}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Button Alignment
                                </label>
                                <select
                                  value={block.data.align || "center"}
                                  onChange={(e) => updateBlockData(block.id, "align", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="center">Center</option>
                                  <option value="left">Left</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Style Theme
                                </label>
                                <select
                                  value={block.data.style || "primary"}
                                  onChange={(e) => updateBlockData(block.id, "style", e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <option value="primary">Primary (Teal Solid)</option>
                                  <option value="secondary">Secondary (Slate Border)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === "card" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Card Title
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Card Header title..."
                                    value={block.data.title || ""}
                                    onChange={(e) => updateBlockData(block.id, "title", e.target.value)}
                                    className={textInputClass}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Redirect link URL
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Redirect URL (e.g. https://...)"
                                    value={block.data.linkUrl || ""}
                                    onChange={(e) => updateBlockData(block.id, "linkUrl", e.target.value)}
                                    className={textInputClass}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Card Image
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleFileUpload(e, block.id)}
                                      className="hidden"
                                      id={`card-upload-${block.id}`}
                                    />
                                    <label
                                      htmlFor={`card-upload-${block.id}`}
                                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-800 transition-all cursor-pointer select-none shrink-0"
                                    >
                                      {uploadingField === block.id ? "Uploading..." : "Upload Card Image"}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Or paste URL manually..."
                                      value={block.data.imageUrl || ""}
                                      onChange={(e) => updateBlockData(block.id, "imageUrl", e.target.value)}
                                      className={textInputClass}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Card Description
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Brief card body text summary..."
                                    value={block.data.description || ""}
                                    onChange={(e) => updateBlockData(block.id, "description", e.target.value)}
                                    className={textInputClass}
                                    required
                                  />
                                </div>
                              </div>
                              {block.data.imageUrl && (
                                <div className="mt-2 flex justify-center bg-slate-100 dark:bg-slate-905 p-2 rounded-xl border border-slate-200/50">
                                  <img
                                    src={block.data.imageUrl}
                                    alt="Preview"
                                    className="max-h-24 rounded object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ADD COMPONENT PANELS */}
                <div className={`${panelClass} flex flex-col gap-4`}>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Insert Component Block
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
                    <button
                      type="button"
                      onClick={() => addBlock("header")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiType className="w-5 h-5 text-sky-500" />
                      <span className="text-[10px] font-bold">Heading</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("paragraph")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiFileText className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-bold">Paragraph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("image")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiImage className="w-5 h-5 text-purple-500" />
                      <span className="text-[10px] font-bold">Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("quote")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiMessageSquare className="w-5 h-5 text-amber-500" />
                      <span className="text-[10px] font-bold">Blockquote</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("code")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiCode className="w-5 h-5 text-indigo-500" />
                      <span className="text-[10px] font-bold">Code Syntax</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("callout")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiAlertCircle className="w-5 h-5 text-teal-500" />
                      <span className="text-[10px] font-bold">Callout Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("list")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiList className="w-5 h-5 text-pink-500" />
                      <span className="text-[10px] font-bold">Bullet List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("columns")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiColumns className="w-5 h-5 text-orange-500" />
                      <span className="text-[10px] font-bold">Two Columns</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("button")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiExternalLink className="w-5 h-5 text-cyan-500" />
                      <span className="text-[10px] font-bold">Redirect Button</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock("card")}
                      className="flex flex-col items-center justify-center p-3 border rounded-2xl hover:border-teal-500 hover:text-teal-650 transition-all gap-1.5 cursor-pointer bg-slate-50/20"
                    >
                      <FiCreditCard className="w-5 h-5 text-rose-500" />
                      <span className="text-[10px] font-bold">Promo Card</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* RAW HTML EDITOR workspace */
              <div className={panelClass}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Article HTML Markup Code</label>
                    <span className="text-[10px] font-bold text-slate-400">
                      Supports direct &lt;p&gt;, &lt;h2&gt;, &lt;iframe&gt;, &lt;a&gt;, and &lt;img&gt; elements.
                    </span>
                  </div>
                  <textarea
                    rows={16}
                    placeholder="Write or paste your clean HTML markup details..."
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    className={`${textInputClass} font-mono text-xs`}
                    required
                  />
                </div>
              </div>
            )}

            {/* PUBLISHING CONTROLS PANEL */}
            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublishedToggle"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-teal-600 focus:ring-teal-500 border-slate-350 dark:border-slate-800"
                />
                <label htmlFor="isPublishedToggle" className="text-sm font-extrabold select-none cursor-pointer">
                  Publish blog post immediately (visible in public directory)
                </label>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setEditorMode("list")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm border flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? "border-slate-800 text-slate-350 hover:bg-slate-900"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FiX /> Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-teal-700/20 transform active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiCheck /> Save Publication
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
