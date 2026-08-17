"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { FiCalendar, FiUser, FiClock, FiChevronLeft, FiFolder, FiFacebook, FiTwitter, FiLinkedin, FiLink, FiAlertCircle } from "react-icons/fi";

interface BlogDetailClientProps {
  initialBlog: any;
}

export default function BlogDetailClient({ initialBlog }: BlogDetailClientProps) {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [blog, setBlog] = useState<any | null>(initialBlog || null);
  const [loading, setLoading] = useState(initialBlog ? false : true);
  const [copied, setCopied] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;

    if (initialBlog && (initialBlog.slug === slug || initialBlog.blog_id === parseInt(slug as string))) {
      setBlog(initialBlog);
      setLoading(false);
      loadRelatedBlogs(initialBlog.category, initialBlog.blog_id);
      return;
    }

    const loadBlogData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/blogs/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
          // Fetch related blogs from same category
          loadRelatedBlogs(data.category, data.blog_id);
        } else {
          setBlog(null);
        }
      } catch (error) {
        console.error("Error loading blog details:", error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, [slug]);

  const loadRelatedBlogs = async (category: string, currentId: number) => {
    try {
      const url = `${API_URL}/blogs?category=${encodeURIComponent(category || "General")}&limit=4`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.blogs || []).filter((b: any) => b.blog_id !== currentId);
        setRelatedBlogs(filtered.slice(0, 3));
      }
    } catch (e) {
      console.error("Failed to load related blogs:", e);
    }
  };

  const calculateReadTime = (content: string) => {
    const words = content ? content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const time = Math.max(1, Math.ceil(words / 200));
    return `${time} ${t("blog_min_read", "min read")}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">{t("blog_loading", "Loading publication details...")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full">
        <Header />
        <div className="flex-1 max-w-xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-3xl flex items-center justify-center">
            <FiAlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t("blog_not_found", "Article Not Found")}</h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
            {t("blog_not_found_desc", "The publication you are looking for may have been drafted, removed, or is temporarily unavailable.")}
          </p>
          <button
            onClick={() => router.push("/blogs")}
            className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm px-6 py-3 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-teal-700/15 cursor-pointer transition-all duration-200"
          >
            <FiChevronLeft className="w-4 h-4" /> {t("blog_back_to_pubs", "Back to Publications")}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* Styled Article Scope Container */}
      <style jsx global>{`
        .blog-post-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
          color: #334155; /* slate-700 */
          font-size: 1.05rem;
          font-weight: 500;
        }
        .blog-post-content h2 {
          font-size: 1.75rem;
          font-weight: 900;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          color: #0f172a; /* slate-900 */
          letter-spacing: -0.025em;
        }
        .blog-post-content h3 {
          font-size: 1.4rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .blog-post-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: #334155;
        }
        .blog-post-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: #334155;
        }
        .blog-post-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
          font-size: 1.025rem;
          font-weight: 500;
        }
        .blog-post-content blockquote {
          border-left: 4px solid #0f766e; /* teal-750 */
          padding-left: 1.25rem;
          font-style: italic;
          margin: 2rem 0;
          color: #475569; /* slate-600 */
          font-size: 1.125rem;
          font-weight: 500;
          background-color: #f8fafc;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-radius: 0 0.75rem 0.75rem 0;
        }
        .blog-post-content strong {
          color: #0f172a;
          font-weight: 700;
        }
        .blog-post-content pre {
          background-color: #0f172a;
          color: #f8fafc;
          padding: 1.25rem;
          border-radius: 1rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .blog-post-content code {
          background-color: #f1f5f9;
          color: #0f766e;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        .blog-post-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }
      `}</style>

      {/* ARTICLE LAYOUT GRID */}
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16 w-full flex flex-col gap-8">
        
        {/* BREADCRUMBS & BACK BUTTON */}
        <div className="flex items-center justify-between">
          <Link
            href="/blogs"
            className="text-slate-500 hover:text-teal-750 font-bold text-xs flex items-center gap-1.5 transition-colors group"
          >
            <FiChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("blog_back_to_pubs", "Back to Publications")}
          </Link>
          <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
            {blog.category || "General"}
          </span>
        </div>

        {/* TITLE & METADATA HEADER */}
        <header className="flex flex-col gap-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 font-display">
            {blog.title}
          </h1>

          {/* AUTHOR & DATE */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-slate-200/60 py-4 text-xs font-semibold text-slate-450">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-250">
                <FiUser className="w-4 h-4 text-slate-450" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-800 font-black">{blog.author_name || "Administrator"}</span>
                <span className="text-[10px] text-slate-400">{t("blog_author_editor", "Author & editor")}</span>
              </div>
            </div>
            
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block" />

            <span className="flex items-center gap-1.5">
              <FiCalendar className="w-4 h-4 text-slate-400" />
              {t("blog_published", "Published")} {new Date(blog.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </span>

            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block" />

            <span className="flex items-center gap-1.5">
              <FiClock className="w-4 h-4 text-slate-400" />
              {calculateReadTime(blog.content)}
            </span>
          </div>
        </header>

        {/* COVER IMAGE */}
        {blog.cover_image && (
          <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md">
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ARTICLE BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-4">
          
          {/* Main Article Content */}
          <article className="lg:col-span-3 blog-post-content">
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          </article>

          {/* Right Sidebar: Social Actions & Sharing */}
          <aside className="lg:col-span-1 flex flex-col gap-6 self-start lg:sticky lg:top-24 border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-200">
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-450">{t("blog_share_article", "Share Article")}</h4>
              
              <div className="flex items-center gap-2">
                {/* Facebook Share */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-slate-200 hover:border-teal-500 hover:text-teal-650 flex items-center justify-center text-slate-500 transition-all shadow-sm"
                  title="Share on Facebook"
                >
                  <FiFacebook className="w-4 h-4" />
                </a>

                {/* Twitter Share */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(blog.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-slate-200 hover:border-teal-500 hover:text-teal-650 flex items-center justify-center text-slate-500 transition-all shadow-sm"
                  title="Share on Twitter"
                >
                  <FiTwitter className="w-4 h-4" />
                </a>

                {/* LinkedIn Share */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-slate-200 hover:border-teal-500 hover:text-teal-650 flex items-center justify-center text-slate-500 transition-all shadow-sm"
                  title="Share on LinkedIn"
                >
                  <FiLinkedin className="w-4 h-4" />
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                    copied 
                      ? "bg-teal-700 border-teal-750 text-white" 
                      : "border-slate-200 hover:border-teal-500 text-slate-500 hover:text-teal-650"
                  }`}
                  title="Copy link"
                >
                  <FiLink className="w-4 h-4" />
                </button>
              </div>
              
              {copied && (
                <span className="text-[10px] font-bold text-teal-650 animate-fadeIn">
                  {t("blog_copied", "Link copied to clipboard!")}
                </span>
              )}
            </div>
            
            {/* Tag Badges */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/60">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-450">{t("blog_category", "Category")}</h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-655 bg-slate-100 px-3 py-1 rounded-lg">
                  <FiFolder className="w-3 h-3 text-slate-400" />
                  {blog.category || "General"}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* RELATED ARTICLES SECTION */}
        {relatedBlogs.length > 0 && (
          <section className="border-t border-slate-200/60 pt-12 mt-8 flex flex-col gap-6">
            <h3 className="text-xl font-black text-slate-850">{t("blog_related_pubs", "Related Publications")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((rel) => (
                <Link
                  key={rel.blog_id}
                  href={`/blogs/${rel.slug}`}
                  className="group flex flex-col gap-3 p-4 bg-white border border-slate-200/50 hover:border-teal-500/25 rounded-2xl transition-all shadow-sm hover:shadow-md"
                >
                  {rel.cover_image && (
                    <div className="aspect-[2/1] rounded-xl overflow-hidden bg-slate-100 w-full">
                      <img
                        src={rel.cover_image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                      />
                    </div>
                  )}
                  <span className="text-[10px] font-extrabold text-teal-700 uppercase">
                    {rel.category || "General"}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-teal-750 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer background layout wrapper */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 border-t border-slate-200/60 w-full mt-auto">
        <div className="relative z-10 w-full">
          <Footer transparent={true} />
        </div>
      </div>
    </div>
  );
}
