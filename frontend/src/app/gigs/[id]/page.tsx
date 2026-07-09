"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  FiBriefcase, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiCheck, 
  FiX, 
  FiFileText, 
  FiClock, 
  FiStar, 
  FiUser, 
  FiMessageSquare,
  FiShoppingBag,
  FiSend,
  FiArrowLeft,
  FiInfo,
  FiExternalLink
} from "react-icons/fi";
import { createPortal } from "react-dom";

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

export default function GigDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const id = params?.id as string;

  const [gig, setGig] = useState<any | null>(null);
  const [similarGigs, setSimilarGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Package Selector State
  const [activePackageTab, setActivePackageTab] = useState<string>("basic");
  
  // Showcase Images State
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Ordering Flow State
  const [isApplying, setIsApplying] = useState(false);
  const [orderRequirements, setOrderRequirements] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [previewRequirements, setPreviewRequirements] = useState(false);
  const [customProposedPrice, setCustomProposedPrice] = useState("");
  const [orderMilestones, setOrderMilestones] = useState<any[]>([]);
  
  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Wishlist States
  const [isSaved, setIsSaved] = useState(false);
  const [isOwnGig, setIsOwnGig] = useState(false);

  useEffect(() => {
    if (!gig) return;

    // Check ownership
    const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (loggedUser && loggedUser.user_id && gig.freelancer_id) {
      setIsOwnGig(parseInt(loggedUser.user_id) === parseInt(gig.freelancer_id));
    }

    // Check if in wishlist
    const wishlist = JSON.parse(localStorage.getItem("lancerflow_wishlist") || "[]");
    const found = wishlist.some((item: any) => item.gig_id === gig.gig_id);
    setIsSaved(found);
    // Set default package tab
    const parsed = gig.plans ? (typeof gig.plans === "string" ? JSON.parse(gig.plans) : gig.plans) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      setActivePackageTab(parsed[0].name);
    } else {
      setActivePackageTab("basic");
    }

    // Dynamic SEO Metadata Injection
    let seoTitle = gig.title;
    let seoDesc = gig.description ? gig.description.replace(/<[^>]*>/g, '').substring(0, 150) + "..." : "";
    let seoImg = "";
    if (gig.images) {
      try {
        const parsedImgs = typeof gig.images === 'string' ? JSON.parse(gig.images) : gig.images;
        if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
          seoImg = resolveMediaUrl(parsedImgs[0]);
        }
      } catch (e) {
        console.error("Error parsing images for SEO:", e);
      }
    }

    if (gig.seo) {
      try {
        const parsedSeo = typeof gig.seo === 'string' ? JSON.parse(gig.seo) : gig.seo;
        if (parsedSeo.title) seoTitle = parsedSeo.title;
        if (parsedSeo.description) seoDesc = parsedSeo.description;
        if (parsedSeo.image) seoImg = resolveMediaUrl(parsedSeo.image);
      } catch (e) {
        console.error("Error parsing gig SEO:", e);
      }
    }

    // Update document title
    document.title = `${seoTitle} | Buy2Lancer`;

    // Helper to create or update meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Standard SEO Tags
    updateMetaTag('description', seoDesc, false);

    // Open Graph (Facebook, LinkedIn, WhatsApp)
    updateMetaTag('og:site_name', 'Buy2Lancer');
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:title', seoTitle);
    updateMetaTag('og:description', seoDesc);
    if (seoImg) {
      updateMetaTag('og:image', seoImg);
    }
    updateMetaTag('og:url', window.location.href);

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDesc);
    if (seoImg) {
      updateMetaTag('twitter:image', seoImg);
    }
  }, [gig]);

  const toggleWishlist = async () => {
    if (!gig) return;
    const wishlist = JSON.parse(localStorage.getItem("lancerflow_wishlist") || "[]");
    const foundIdx = wishlist.findIndex((item: any) => item.gig_id === gig.gig_id);
    const action = foundIdx > -1 ? "remove" : "add";

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`https://freelancer.sangvish.com/api/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ action })
        });
      }
    } catch (e) {
      console.error("Failed to sync wishlist on backend:", e);
    }

    if (foundIdx > -1) {
      wishlist.splice(foundIdx, 1);
      setIsSaved(false);
      showToast("success", "Removed from wishlist");
    } else {
      wishlist.push(gig);
      setIsSaved(true);
      showToast("success", "Saved to wishlist");
    }
    localStorage.setItem("lancerflow_wishlist", JSON.stringify(wishlist));
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Mock fallback gigs for offline/empty-db demo experience
  const MOCK_GIGS_DATA: Record<string, any> = {
    "1": {
      gig_id: 1,
      title: "Complete Modern React & Next.js Website Development",
      category_name: "Web Development",
      views: 120,
      wishlist_count: 32,
      reviews_count: 2,
      reviews_avg_rating: 4.9,
      price: 199,
      delivery_days: 3,
      images: [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34281-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/Web_Development_Agreement.pdf",
        "https://freelancer.sangvish.com/public/documents/onboard/API_Specification_v1.docx"
      ],
      freelancer_id: 999991,
      freelancer_name: "John Doe",
      freelancer_title: "Senior Full Stack Engineer",
      freelancer_hourly_rate: "45.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Get a highly performant, fully responsive, and SEO-optimized website built with Next.js, React, and Tailwind CSS. Perfect for startups, e-commerce, and business landing pages.",
      negotiation: true,
      skills: [
        { skill_id: 1, skill_name: "Next.js" },
        { skill_id: 2, skill_name: "React" },
        { skill_id: 3, skill_name: "TypeScript" }
      ],
      reviews: [
        {
          review_id: 101,
          client_name: "Sarah Parker",
          client_image: "",
          rating: 5,
          created_at: "2026-06-25T10:00:00Z",
          comment: "Exceptional speed and attention to detail. The website ranks highly on Google and looks brilliant!"
        },
        {
          review_id: 102,
          client_name: "David Miller",
          client_image: "",
          rating: 4.8,
          created_at: "2026-06-20T10:00:00Z",
          comment: "Excellent developer. Delivered the project ahead of time and answered all my questions."
        }
      ]
    },
    "2": {
      gig_id: 2,
      title: "Premium UI/UX Design for Mobile App and Web Platforms",
      category_name: "UI/UX Design",
      views: 95,
      wishlist_count: 18,
      reviews_count: 1,
      reviews_avg_rating: 4.8,
      price: 149,
      delivery_days: 5,
      images: [
        "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-web-designer-working-on-a-tablet-design-34282-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/Figma_Design_Assets.pdf"
      ],
      freelancer_id: 999992,
      freelancer_name: "Jane Smith",
      freelancer_title: "Lead Product Designer",
      freelancer_hourly_rate: "50.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Craft a modern, interactive, and visually stunning design prototype for your mobile app or website. Includes Figma files, user personas, wireframes, and design system elements.",
      negotiation: false,
      skills: [
        { skill_id: 4, skill_name: "Figma" },
        { skill_id: 5, skill_name: "UI/UX Design" },
        { skill_id: 6, skill_name: "Prototyping" }
      ],
      reviews: [
        {
          review_id: 103,
          client_name: "Emma Watson",
          client_image: "",
          rating: 4.8,
          created_at: "2026-06-18T10:00:00Z",
          comment: "Incredibly creative design. Our users love the new app interface!"
        }
      ]
    },
    "3": {
      gig_id: 3,
      title: "Custom AI Automation Workflow Integration & API Setup",
      category_name: "AI Automation",
      views: 145,
      wishlist_count: 45,
      reviews_count: 1,
      reviews_avg_rating: 5.0,
      price: 299,
      delivery_days: 7,
      images: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-server-room-rack-servers-blinking-led-lights-43283-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/AI_Integration_Blueprint.pdf"
      ],
      freelancer_id: 999993,
      freelancer_name: "Alex Johnson",
      freelancer_title: "AI & Automation Architect",
      freelancer_hourly_rate: "75.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Automate your daily workflows and integrate AI features using OpenAI GPT, Make.com, Zapier, and custom API connections. Streamline your sales, support, and marketing pipelines.",
      negotiation: true,
      skills: [
        { skill_id: 7, skill_name: "AI Integrations" },
        { skill_id: 8, skill_name: "API Integrations" },
        { skill_id: 9, skill_name: "Zapier & Make" }
      ],
      reviews: [
        {
          review_id: 104,
          client_name: "Robert Downey",
          client_image: "",
          rating: 5,
          created_at: "2026-06-22T10:00:00Z",
          comment: "Saved us hundreds of manual hours per week. Incredible expertise in AI workflows."
        }
      ]
    },
    "9991": {
      gig_id: 9991,
      title: "Complete Modern React & Next.js Website Development",
      category_name: "Web Development",
      views: 120,
      wishlist_count: 32,
      reviews_count: 2,
      reviews_avg_rating: 4.9,
      price: 199,
      delivery_days: 3,
      images: [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34281-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/Web_Development_Agreement.pdf",
        "https://freelancer.sangvish.com/public/documents/onboard/API_Specification_v1.docx"
      ],
      freelancer_id: 999991,
      freelancer_name: "John Doe",
      freelancer_title: "Senior Full Stack Engineer",
      freelancer_hourly_rate: "45.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Get a highly performant, fully responsive, and SEO-optimized website built with Next.js, React, and Tailwind CSS. Perfect for startups, e-commerce, and business landing pages.",
      negotiation: true,
      skills: [
        { skill_id: 1, skill_name: "Next.js" },
        { skill_id: 2, skill_name: "React" },
        { skill_id: 3, skill_name: "TypeScript" }
      ],
      reviews: [
        {
          review_id: 101,
          client_name: "Sarah Parker",
          client_image: "",
          rating: 5,
          created_at: "2026-06-25T10:00:00Z",
          comment: "Exceptional speed and attention to detail. The website ranks highly on Google and looks brilliant!"
        },
        {
          review_id: 102,
          client_name: "David Miller",
          client_image: "",
          rating: 4.8,
          created_at: "2026-06-20T10:00:00Z",
          comment: "Excellent developer. Delivered the project ahead of time and answered all my questions."
        }
      ]
    },
    "9992": {
      gig_id: 9992,
      title: "Premium UI/UX Design for Mobile App and Web Platforms",
      category_name: "UI/UX Design",
      views: 95,
      wishlist_count: 18,
      reviews_count: 1,
      reviews_avg_rating: 4.8,
      price: 149,
      delivery_days: 5,
      images: [
        "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-web-designer-working-on-a-tablet-design-34282-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/Figma_Design_Assets.pdf"
      ],
      freelancer_id: 999992,
      freelancer_name: "Jane Smith",
      freelancer_title: "Lead Product Designer",
      freelancer_hourly_rate: "50.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Craft a modern, interactive, and visually stunning design prototype for your mobile app or website. Includes Figma files, user personas, wireframes, and design system elements.",
      negotiation: false,
      skills: [
        { skill_id: 4, skill_name: "Figma" },
        { skill_id: 5, skill_name: "UI/UX Design" },
        { skill_id: 6, skill_name: "Prototyping" }
      ],
      reviews: [
        {
          review_id: 103,
          client_name: "Emma Watson",
          client_image: "",
          rating: 4.8,
          created_at: "2026-06-18T10:00:00Z",
          comment: "Incredibly creative design. Our users love the new app interface!"
        }
      ]
    },
    "9993": {
      gig_id: 9993,
      title: "Custom AI Automation Workflow Integration & API Setup",
      category_name: "AI Automation",
      views: 145,
      wishlist_count: 45,
      reviews_count: 1,
      reviews_avg_rating: 5.0,
      price: 299,
      delivery_days: 7,
      images: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80"
      ],
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-server-room-rack-servers-blinking-led-lights-43283-large.mp4",
      documents: [
        "https://freelancer.sangvish.com/public/documents/onboard/AI_Integration_Blueprint.pdf"
      ],
      freelancer_id: 999993,
      freelancer_name: "Alex Johnson",
      freelancer_title: "AI & Automation Architect",
      freelancer_hourly_rate: "75.00",
      freelancer_image: "",
      currency_symbol: "$",
      currency_code: "USD",
      description: "Automate your daily workflows and integrate AI features using OpenAI GPT, Make.com, Zapier, and custom API connections. Streamline your sales, support, and marketing pipelines.",
      negotiation: true,
      skills: [
        { skill_id: 7, skill_name: "AI Integrations" },
        { skill_id: 8, skill_name: "API Integrations" },
        { skill_id: 9, skill_name: "Zapier & Make" }
      ],
      reviews: [
        {
          review_id: 104,
          client_name: "Robert Downey",
          client_image: "",
          rating: 5,
          created_at: "2026-06-22T10:00:00Z",
          comment: "Saved us hundreds of manual hours per week. Incredible expertise in AI workflows."
        }
      ]
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchGigDetails = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`https://freelancer.sangvish.com/api/freelancer/client/gigs/${id}`, { headers });

        if (res.ok) {
          const data = await res.json();
          setGig(data);
          setError("");
        } else {
          // Check if loading fallback mock data on API failure/404
          if (MOCK_GIGS_DATA[id]) {
            setGig(MOCK_GIGS_DATA[id]);
            setError("");
          } else {
            setError("Gig not found or not active.");
          }
        }
      } catch (err) {
        console.error("Failed to load gig details:", err);
        if (MOCK_GIGS_DATA[id]) {
          setGig(MOCK_GIGS_DATA[id]);
          setError("");
        } else {
          setError("Network error. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarGigs = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`https://freelancer.sangvish.com/api/freelancer/client/gigs/${id}/similar`, { headers });

        if (res.ok) {
          const data = await res.json();
          setSimilarGigs(data);
        } else {
          if (MOCK_GIGS_DATA[id]) {
            const otherIds = Object.keys(MOCK_GIGS_DATA).filter(x => x !== id);
            setSimilarGigs(otherIds.map(x => MOCK_GIGS_DATA[x]).slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load similar gigs:", err);
        if (MOCK_GIGS_DATA[id]) {
          const otherIds = Object.keys(MOCK_GIGS_DATA).filter(x => x !== id);
          setSimilarGigs(otherIds.map(x => MOCK_GIGS_DATA[x]).slice(0, 4));
        }
      }
    };

    fetchGigDetails();
    fetchSimilarGigs();
  }, [id]);

  const handleApplyGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess(false);

    if (!orderRequirements.trim() || !gig) {
      setOrderError("Please fill out your project requirements.");
      return;
    }

    try {
      setOrderSubmitting(true);
      const token = localStorage.getItem("token");

      let finalPrice = getDiscountedPackagePrice(getPackagePrice());
      if (gig.negotiation && customProposedPrice.trim()) {
        finalPrice = parseFloat(customProposedPrice.trim());
      }

      if (isNaN(finalPrice) || finalPrice <= 0) {
        setOrderError("Please enter a valid price greater than 0.");
        setOrderSubmitting(false);
        return;
      }

      const res = await fetch("https://freelancer.sangvish.com/api/freelancer/client/gigs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: gig.gig_id,
          requirements: `[Plan Ordered: ${activePackageTab.toUpperCase()}]\n\n${orderRequirements.trim()}`,
          price: finalPrice,
          currency_id: gig.currency_id,
          milestones: orderMilestones
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setOrderRequirements("");
        setCustomProposedPrice("");
        setOrderMilestones([]);
        showToast("success", "Service ordered successfully!");
        setTimeout(() => {
          setIsApplying(false);
          setOrderSuccess(false);
          router.push("/dashboard?tab=client_orders");
        }, 1500);
      } else {
        setOrderError(data.message || "Failed to order service.");
      }
    } catch (err) {
      setOrderError("Network error. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const insertRequirementFormat = (tag: string) => {
    const textarea = document.getElementById("project-requirements-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let replacement = "";
    if (tag === "bold") replacement = `<strong>${selected || "bold text"}</strong>`;
    else if (tag === "italic") replacement = `<em>${selected || "italic text"}</em>`;
    else if (tag === "bullet") replacement = `\n<ul>\n  <li>${selected || "bullet item"}</li>\n</ul>\n`;
    else if (tag === "heading") replacement = `<h3>${selected || "Heading"}</h3>`;
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setOrderRequirements(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Helper to resolve media URLs to backend host if relative
  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `https://freelancer.sangvish.com${cleanPath}`;
  };

  // Helper to parse images array safely
  const getGigImages = () => {
    if (!gig) return [];
    if (Array.isArray(gig.images)) return gig.images;
    try {
      if (typeof gig.images === "string") {
        const parsed = JSON.parse(gig.images);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  };

  // Helper to parse documents array safely
  const getGigDocuments = () => {
    if (!gig) return [];
    if (Array.isArray(gig.documents)) return gig.documents;
    try {
      if (typeof gig.documents === "string") {
        const parsed = JSON.parse(gig.documents);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const parsedPlans = gig && gig.plans 
    ? (typeof gig.plans === "string" ? JSON.parse(gig.plans) : gig.plans)
    : null;

  const hasCustomPlans = Array.isArray(parsedPlans) && parsedPlans.length > 0;
  
  const activePlan = hasCustomPlans 
    ? parsedPlans.find((p: any) => p.name.toLowerCase() === activePackageTab.toLowerCase()) || parsedPlans[0]
    : null;

  // Dynamically calculate price based on selected package tab and discount
  const getBasePrice = () => {
    if (!gig) return 0;
    if (hasCustomPlans && activePlan) {
      return parseFloat(activePlan.price || 0);
    }
    const base = parseFloat(gig.price);
    if (activePackageTab === "popular") return base * 1.5;
    if (activePackageTab === "premium") return base * 2.0;
    return base;
  };

  const hasPlanDiscount = gig && gig.plan_discount_percent > 0;
  const planDiscountPercent = gig ? parseInt(gig.plan_discount_percent) : 0;
  
  const getDiscountedPackagePrice = (originalPrice: number) => {
    if (!hasPlanDiscount) return originalPrice;
    return parseFloat((originalPrice - (originalPrice * planDiscountPercent / 100)).toFixed(2));
  };

  const getPackagePrice = () => {
    const base = getBasePrice();
    if (gig?.discount_percent && parseFloat(gig.discount_percent) > 0) {
      return base * (1 - parseFloat(gig.discount_percent) / 100);
    }
    return base;
  };

  const getPackageDeliveryDays = () => {
    if (!gig) return 0;
    if (hasCustomPlans && activePlan) {
      return parseInt(activePlan.delivery_days || 0);
    }
    const days = parseInt(gig.delivery_days);
    if (activePackageTab === "popular") return Math.max(1, days - 1);
    if (activePackageTab === "premium") return Math.max(1, days - 2);
    return days;
  };

  const getPackageRevisions = () => {
    if (!gig) return "0";
    if (hasCustomPlans && activePlan) {
      const revs = activePlan.revisions;
      return revs === 0 || revs === "0" ? "Unlimited Revisions" : `${revs} Revisions`;
    }
    if (activePackageTab === "popular") return "5 Revisions";
    if (activePackageTab === "premium") return "Unlimited Revisions";
    return gig.revisions ? `${gig.revisions} Revisions` : "No Revisions";
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-slate-404 text-xs font-bold tracking-wider uppercase">Loading Gig Details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center">
          <FiAlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-800">Authentication Required</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            You must be logged in to view detailed gig listings and place orders.
          </p>
          <button
            onClick={() => openLoginModal(window.location.pathname)}
            className="mt-6 bg-teal-700 hover:bg-teal-650 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all transform active:scale-95 border-none cursor-pointer"
          >
            Log In to Continue
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center">
          <h1 className="text-7xl font-black text-slate-200 tracking-tight font-display select-none">404</h1>
          <h2 className="text-xl font-extrabold text-slate-800 mt-4">Gig Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">{error || "The service you are looking for does not exist."}</p>
          <a
            href="/dashboard?tab=explore_gigs"
            className="mt-6 bg-teal-750 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all"
          >
            Browse Explore Services
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  const gigImages = getGigImages();
  const gigDocuments = getGigDocuments();

  const getGigFaqs = () => {
    if (gig.faqs) {
      try {
        const parsed = typeof gig.faqs === 'string' ? JSON.parse(gig.faqs) : gig.faqs;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing gig FAQs:", e);
      }
    }
    return [
      {
        q: "What do I need to supply to initiate this service?",
        a: "Upon placing the order, you will be prompted to provide detailed requirements, brand design assets, project scope details, or wireframe references. Providing clear requirements will accelerate delivery."
      },
      {
        q: "Does this gig support budget custom negotiations?",
        a: gig.negotiation 
          ? "Yes, this gig supports budget proposals. You can input your negotiated price in the order requirements drawer and I will review it." 
          : "No, this is a fixed pricing service. If you need custom services, please message me directly to negotiate a custom contract."
      },
      {
        q: "What if I require supplementary revisions?",
        a: `The base package contains ${getPackageRevisions()}. If you require extra rounds of revisions, you can add them as milestones / extra features in the order builder.`
      }
    ];
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border bg-white animate-slideIn">
          {toast.type === "success" ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Breadcrumbs & Navigation */}
      <div className="bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-teal-750 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
            <span>Gigs</span>
            <span className="text-slate-300 font-medium">/</span>
            <span className="text-slate-600">{gig.category_name || "Category"}</span>
            {gig.sub_category_name && (
              <>
                <span className="text-slate-300 font-medium">/</span>
                <span className="text-teal-750">{gig.sub_category_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Title and Top Info */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-150 px-2.5 py-1 rounded uppercase tracking-wider">
              {gig.category_name || "Service Package"}
            </span>
            {gig.discount_percent && parseFloat(gig.discount_percent) > 0 && (
              <span className="text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-150 px-2 py-0.5 rounded uppercase tracking-wider">
                {parseFloat(gig.discount_percent)}% OFF SPECIAL
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4.5xl font-black text-slate-900 leading-tight tracking-tight max-w-4xl">
            {gig.title}
          </h1>

          {/* Quick Stats Header */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-slate-505 border-b border-slate-200/60 pb-5">
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="font-bold text-slate-800">
                {gig.reviews_count && parseInt(gig.reviews_count) > 0 
                  ? parseFloat(gig.reviews_avg_rating).toFixed(1) 
                  : "0.0"}
              </span>
              <span className="text-slate-400 font-medium">({gig.reviews_count || 0} reviews)</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span>{gig.views || 0} views</span>
            </div>
            {!isOwnGig && (
              <>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <button
                  onClick={toggleWishlist}
                  className="flex items-center gap-1 text-teal-700 hover:text-teal-800 font-bold transition-all duration-200 cursor-pointer"
                >
                  <svg 
                    className={`w-4.5 h-4.5 shrink-0 ${isSaved ? "fill-teal-700 text-teal-700" : "text-slate-400"}`} 
                    fill={isSaved ? "currentColor" : "none"} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2.2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isSaved ? "Saved" : "Save to Wishlist"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: Media, Description, FAQs */}
           {/* LEFT COLUMN: Media, Description, FAQs */}
           <div className="lg:col-span-2 flex flex-col gap-8">
             
             {/* Image Showcase */}
             <div className="flex flex-col gap-4">
               {gigImages.length > 0 ? (
                 <>
                   <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/50">
                     <img 
                       src={resolveMediaUrl(gigImages[activeImageIdx])} 
                       className="w-full h-full object-cover transition-all duration-300" 
                       alt="Showcase Preview"
                       onError={(e) => {
                         e.currentTarget.onerror = null;
                         e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394a3b8' dominant-baseline='middle' text-anchor='middle'>Showcase Asset Preview</text></svg>";
                       }}
                     />
                   </div>
                   {gigImages.length > 1 && (
                     <div className="flex flex-wrap gap-2.5">
                       {gigImages.map((img: string, idx: number) => (
                         <button
                           key={idx}
                           onClick={() => setActiveImageIdx(idx)}
                           className={`w-20 h-14 rounded-xl border overflow-hidden bg-slate-50 transition-all ${
                             idx === activeImageIdx 
                               ? "border-teal-700 ring-2 ring-teal-500/20 scale-[1.03]" 
                               : "border-slate-200 hover:border-slate-350"
                           }`}
                         >
                           <img 
                             src={resolveMediaUrl(img)} 
                             className="w-full h-full object-cover" 
                             onError={(e) => {
                               e.currentTarget.onerror = null;
                               e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='70' viewBox='0 0 100 70'><rect width='100%' height='100%' fill='%23e2e8f0'/></svg>";
                             }}
                           />
                         </button>
                       ))}
                     </div>
                   )}
                 </>
               ) : (
                 <div className="w-full aspect-video bg-gradient-to-tr from-teal-700/5 to-cyan-500/5 flex flex-col items-center justify-center text-slate-400 gap-1 rounded-2xl border border-slate-200">
                   <FiShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
                   <span className="font-extrabold text-slate-500 uppercase tracking-widest text-xs">Premium Service Showcase</span>
                 </div>
               )}
             </div>
 
             <hr className="border-t border-slate-200/60" />
 
             {/* Description */}
             <div className="flex flex-col gap-4 text-left">
               <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
                 Service Description
               </h2>
               <div 
                 className="text-sm leading-relaxed text-slate-600 font-medium prose prose-slate max-w-full text-left"
                 dangerouslySetInnerHTML={{ __html: gig.description }}
               />
               
               {/* Core Skills & Expertise */}
               {gig.skills && gig.skills.length > 0 && (
                 <div className="mt-4 bg-slate-50 rounded-2xl p-5 border border-slate-200/40">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Core Expertise & Skills:</h4>
                   <div className="flex flex-wrap gap-2">
                     {gig.skills.map((skill: any, idx: number) => (
                       <span 
                         key={idx} 
                         className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-sm"
                       >
                         {skill.skill_name || skill}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
 
             {/* Video & Documents showcase */}
             {(gig.video_url || gigDocuments.length > 0) && (
               <>
                 <hr className="border-t border-slate-200/60" />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {gig.video_url && (
                     <div className="text-left">
                       <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">Showcase Video</h3>
                       <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-inner">
                         <video src={resolveMediaUrl(gig.video_url)} controls className="w-full h-full object-cover" />
                       </div>
                     </div>
                   )}
                   {gigDocuments.length > 0 && (
                     <div className="text-left">
                       <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">Showcase Documents</h3>
                       <div className="flex flex-col gap-2.5">
                         {gigDocuments.map((doc: string, idx: number) => {
                           const name = doc.split("/").pop() || `document_${idx + 1}`;
                           const isPdf = name.toLowerCase().endsWith(".pdf");
                           const fileType = isPdf ? "PDF Document" : "Attachment File";
                           return (
                             <a 
                               key={idx} 
                               href={resolveMediaUrl(doc)} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-teal-50/30 border border-slate-200 rounded-xl hover:border-teal-500/30 transition-all duration-200 group/doc shadow-sm hover:shadow-md"
                             >
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover/doc:scale-105 transition-transform ${isPdf ? "bg-rose-500/10 text-rose-605" : "bg-teal-500/10 text-teal-700"}`}>
                                 <FiFileText className="w-5 h-5" />
                               </div>
                               <div className="flex-1 min-w-0 text-left">
                                 <p className="text-xs font-extrabold text-slate-700 truncate group-hover/doc:text-teal-750 transition-colors" title={name}>
                                   {name}
                                 </p>
                                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{fileType}</span>
                               </div>
                               <div className="text-teal-700 hover:text-teal-800 text-[10px] font-black bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 shrink-0 group-hover/doc:bg-teal-700 group-hover/doc:text-white group-hover/doc:border-teal-750 transition-all">
                                 <span>Download</span>
                               </div>
                             </a>
                           );
                         })}
                       </div>
                     </div>
                   )}
                 </div>
               </>
             )}
 
             <hr className="border-t border-slate-200/60" />
 
             {/* FAQ Accordion Section */}
             <div className="flex flex-col gap-4 text-left">
               <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
                 Frequently Asked Questions
               </h2>
               <div className="flex flex-col gap-3.5">
                 {getGigFaqs().map((faq: any, idx: number) => (
                   <details 
                     key={idx} 
                     className="group border border-slate-150 rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:bg-slate-50/50 transition-colors"
                   >
                     <summary className="flex justify-between items-center focus:outline-none">
                       <span className="text-xs sm:text-sm font-black text-slate-800 text-left">
                         {faq.q}
                       </span>
                       <span className="text-slate-450 group-open:rotate-180 group-open:text-teal-700 transition-all duration-200">
                         <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                         </svg>
                       </span>
                     </summary>
                     <p className="text-xs leading-relaxed text-slate-500 font-medium mt-3 border-t border-slate-100 pt-3 text-left">
                       {faq.a}
                     </p>
                   </details>
                 ))}
               </div>
             </div>
 
             <hr className="border-t border-slate-200/60" />
 
             {/* Customer Reviews Section */}
             <div className="flex flex-col gap-4 text-left">
               <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                 <span>Customer Reviews</span>
                 <span className="text-xs font-bold text-slate-400">
                   {gig.reviews_count || 0} reviews
                 </span>
               </h2>
               {gig.reviews && gig.reviews.length > 0 ? (
                 <div className="flex flex-col gap-6 divide-y divide-slate-100">
                   {gig.reviews.map((rev: any, idx: number) => (
                     <div key={rev.review_id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                       <div className="flex items-center gap-3">
                         {rev.client_image ? (
                           <img
                             src={resolveMediaUrl(rev.client_image)}
                             alt={rev.client_name}
                             className="w-10 h-10 rounded-full object-cover"
                           />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600">
                             {rev.client_name.substring(0, 2).toUpperCase()}
                           </div>
                         )}
                         <div>
                           <p className="text-xs font-black text-slate-800">{rev.client_name}</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <div className="flex text-amber-400">
                               {Array.from({ length: Math.round(parseFloat(rev.rating)) }).map((_, i) => (
                                 <FiStar key={i} className="w-3 h-3 fill-current" />
                               ))}
                             </div>
                             <span className="text-[10px] text-slate-455 font-bold">
                               {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                             </span>
                           </div>
                         </div>
                       </div>
                       <p className="text-xs text-slate-650 leading-relaxed font-semibold mt-3 bg-slate-50/50 p-3 rounded-xl border border-slate-150/40">
                         {rev.comment}
                       </p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-6 border border-dashed border-slate-150 rounded-2xl bg-slate-50/20">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Reviews Yet</p>
                 </div>
               )}
             </div>

          </div>

          {/* RIGHT COLUMN: Pricing Tabs Card & About Seller Card */}
          <div className="flex flex-col gap-6 sticky top-6">
            
            {/* PACKAGE PRICING CARD */}
            <div className="bg-white border border-slate-200 shadow-lg rounded-3xl overflow-hidden flex flex-col text-left">
              {/* Package Tabs */}
              <div className="flex border-b border-slate-155 bg-slate-50/80">
                {hasCustomPlans ? (
                  parsedPlans.map((p: any) => (
                    <button
                      key={p.name}
                      onClick={() => setActivePackageTab(p.name)}
                      className={`flex-1 text-center py-3.5 text-xs font-black capitalize border-b-2 transition-all cursor-pointer ${
                        activePackageTab.toLowerCase() === p.name.toLowerCase()
                          ? "border-teal-700 text-teal-700 bg-white"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {p.title?.trim() ? p.title : `${p.name} Package`}
                    </button>
                  ))
                ) : (
                  (["basic", "popular", "premium"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePackageTab(tab)}
                      className={`flex-1 text-center py-3.5 text-xs font-black capitalize border-b-2 transition-all cursor-pointer ${
                        activePackageTab === tab
                          ? "border-teal-700 text-teal-700 bg-white"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))
                )}
              </div>

              {/* Package Content */}
              <div className="p-6 flex flex-col gap-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 block font-bold uppercase tracking-widest text-[9px]">
                    {hasCustomPlans && activePlan ? (activePlan.title?.trim() ? activePlan.title : `${activePlan.name} Package`) : (activePackageTab === "popular" ? "🚀 Recommended TIER" : "Pricing Package")}
                  </span>
                  <div className="text-right flex flex-col items-end">
                    {hasPlanDiscount ? (
                      <>
                        <span className="text-slate-450 text-xs font-bold line-through">
                          {gig.currency_symbol || "$"}{parseFloat(getPackagePrice().toFixed(2)).toLocaleString()}
                        </span>
                        <span className="text-2xl font-black text-slate-900">
                          {gig.currency_symbol || "$"}{parseFloat(getDiscountedPackagePrice(getPackagePrice()).toFixed(2)).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-black text-slate-900">
                        {gig.currency_symbol || "$"}{parseFloat(getPackagePrice().toFixed(2)).toLocaleString()}
                      </span>
                    )}
                    <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider block">
                      {gig.currency_code} 
                      {hasPlanDiscount 
                        ? ` (${planDiscountPercent}% off with ${gig.plan_name})` 
                        : (gig.discount_percent && parseFloat(gig.discount_percent) > 0 ? ` (${parseFloat(gig.discount_percent)}% off)` : "")
                      }
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-550 leading-relaxed">
                  {hasCustomPlans && activePlan ? (
                    <p className="font-bold text-slate-700">{activePlan.description || `${activePlan.name} package deliverables.`}</p>
                  ) : (
                    <>
                      {activePackageTab === "basic" && (
                        <p>Standard delivery package of the service, containing basic setup, core deliverables, and initial configuration.</p>
                      )}
                      {activePackageTab === "popular" && (
                        <p>Recommended complete service package, including intermediate features, custom revisions, and priority support.</p>
                      )}
                      {activePackageTab === "premium" && (
                        <p>Elite full-scale service delivery package, including comprehensive source deliverables, maximum revisions, and post-delivery assistance.</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Delivery in {getPackageDeliveryDays()} Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{getPackageRevisions()}</span>
                  </div>
                </div>

                {/* Custom Features Checklist */}
                {hasCustomPlans && activePlan && activePlan.features && (
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">What's Included</span>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const allFeatures = Array.from(new Set(parsedPlans.flatMap((p: any) => Object.keys(p.features || {}))));
                        return allFeatures.map((featName: any) => {
                          const val = activePlan.features[featName];
                          const isIncluded = val === true || (typeof val === "string" && val.trim() !== "" && val !== "0" && val.toLowerCase() !== "no" && val.toLowerCase() !== "false");
                          
                          if (isIncluded) {
                            return (
                              <div key={featName} className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>
                                  {featName}
                                  {typeof val === "string" && val.toLowerCase() !== "yes" && val.toLowerCase() !== "true" && ` (${val})`}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div key={featName} className="flex items-center gap-2 text-slate-350 select-none text-xs font-semibold">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-200 shrink-0">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="line-through">{featName}</span>
                              </div>
                            );
                          }
                        });
                      })()}
                    </div>
                  </div>
                )}

                {hasPlanDiscount && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xxs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                    <span>🎉 <strong>{gig.plan_name} Plan Discount</strong> automatically applied to this service!</span>
                  </div>
                )}

                {/* Instant Order CTA */}
                <button
                  onClick={() => setIsApplying(true)}
                  className="w-full bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <FiShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Order Service Now</span>
                </button>

                {gig.negotiation && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-150 p-2.5 rounded-xl font-bold flex items-center gap-1.5 leading-relaxed">
                    <FiInfo className="w-3.5 h-3.5 shrink-0" />
                    <span>Flexible pricing! Custom budget proposals allowed.</span>
                  </p>
                )}
              </div>
            </div>

            {/* ABOUT THE SELLER CARD */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                About the Seller
              </h3>
              
              <div className="flex gap-4 items-center">
                {gig.freelancer_image ? (
                  <img
                    src={resolveMediaUrl(gig.freelancer_image)}
                    alt={gig.freelancer_name}
                    className="w-14 h-14 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-teal-700/10 flex items-center justify-center font-black text-lg text-teal-700 border border-teal-500/10 shrink-0 select-none">
                    {gig.freelancer_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-slate-900 text-sm truncate">
                      {gig.freelancer_name}
                    </span>
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {gig.freelancer_title || "Freelancer Specialist"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold">
                    <span className="text-amber-500">
                      ★ {gig.reviews_count && parseInt(gig.reviews_count) > 0 
                          ? parseFloat(gig.reviews_avg_rating).toFixed(1) 
                          : "0.0"}
                    </span>
                    <span className="text-slate-400 font-semibold">({gig.reviews_count || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Starting Rate</span>
                  <span className="font-extrabold text-slate-950">
                    {gig.freelancer_hourly_rate ? `$${parseFloat(gig.freelancer_hourly_rate).toFixed(2)}/hr` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Views</span>
                  <span className="font-extrabold text-slate-950">{gig.views || 0}</span>
                </div>
              </div>

              {/* View Public Profile CTA */}
              <button
                onClick={() => router.push(`/freelancer/${gig.freelancer_slug || gig.freelancer_id}`)}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiUser className="w-4 h-4 shrink-0" />
                <span>View Full Profile</span>
              </button>
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: SIMILAR GIGS */}
        <div className="mt-16 border-t border-slate-200 pt-12 text-left">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-xl sm:text-2.5xl font-black text-slate-900 leading-tight">
                Similar Gigs You May Like
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Explore services from other elite professionals within the same category.
              </p>
            </div>
          </div>

          {similarGigs.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center bg-white">
              <FiShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Similar Gigs Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarGigs.map((sg) => {
                let gigImages: string[] = [];
                try {
                  if (Array.isArray(sg.images)) gigImages = sg.images;
                  else if (typeof sg.images === "string") gigImages = JSON.parse(sg.images);
                } catch (e) {}

                // Mock dynamic rating and likes for beautiful display matching Popular Services
                const likesCount = 10 + (sg.gig_id % 29);
                const ratingScore = (4.0 + (sg.gig_id % 11) / 10).toFixed(1);
                const ratingCount = 5 + (sg.gig_id % 45);

                return (
                  <div
                    key={sg.gig_id}
                    onClick={() => {
                      setActiveImageIdx(0);
                      router.push(`/gigs/${sg.slug || sg.gig_id}`);
                    }}
                    className="bg-[#f3f4f6]/40 border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-teal-500/35 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Image container with badges overlaid */}
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100 border-b border-slate-200">
                        {gigImages.length > 0 ? (
                          <img 
                            src={gigImages[0].startsWith("http") ? gigImages[0] : `https://freelancer.sangvish.com${gigImages[0]}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            alt={sg.title} 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 select-none text-xs">
                            💼 Service Preview
                          </div>
                        )}
                        
                        {/* Overlay badges */}
                        <span className="absolute top-3 left-3 bg-[#e6f4f2]/90 backdrop-blur-sm text-teal-800 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm select-none border border-teal-100/50">
                          {sg.category_name || "Service"}
                        </span>
                        
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm select-none">
                          <span className="text-[10px]">❤️</span>
                          <span>{likesCount}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-teal-900 transition-colors">
                          {sg.title}
                        </h3>
                        <p className="text-slate-400 text-[9px] font-black block mt-1 uppercase tracking-wider select-none">By {sg.freelancer_name}</p>
                        
                        {/* Rating & Delivery Info Line */}
                        <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold text-slate-400 select-none">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <span className="text-xs">★</span>
                            <span className="text-slate-800 font-extrabold">{ratingScore}</span>
                            <span className="text-slate-400 font-normal">({ratingCount})</span>
                          </div>
                          <div className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-slate-400" />
                            <span>{sg.delivery_days}d delivery</span>
                          </div>
                        </div>

                        <p className="text-slate-500 text-xs mt-4 leading-relaxed font-semibold line-clamp-2">
                          {stripHtml(sg.description)}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 mt-auto flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Starting At</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {sg.currency_symbol || "$"}{parseFloat(sg.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      <Footer />

      {/* Order Gig Application Modal Portal */}
      {isApplying && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative max-h-[95vh] flex flex-col">
            <button
              onClick={() => {
                setIsApplying(false);
                setOrderError("");
                setCustomProposedPrice("");
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              Close
            </button>

            <div className="border-b border-slate-100 pb-4 pr-16 text-left">
              <span className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-1">Place Service Order</span>
              <h2 className="text-base font-black text-slate-855 line-clamp-1">{gig.title}</h2>
              <p className="text-slate-405 text-xs font-semibold mt-1">Service provider: {gig.freelancer_name}</p>
            </div>

            <form onSubmit={handleApplyGigSubmit} className="flex-grow flex flex-col overflow-hidden min-h-0">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200/60 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 mt-5 text-left">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
              {orderSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-650 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5 shrink-0 mt-5 text-left">
                  <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Order request submitted successfully!</span>
                </div>
              )}

              <div className="flex-grow overflow-y-auto my-4 flex flex-col gap-5 pr-1.5 min-h-0 text-left">
                
                {/* Price Details banner */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex justify-between items-center text-xs shrink-0 text-left">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                      Selected Package Price
                    </span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block">
                      {gig.currency_symbol || "$"}{parseFloat(getPackagePrice().toFixed(2)).toLocaleString()}{" "}{gig.currency_code}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Delivery Timeline</span>
                    <span className="text-slate-800 font-extrabold mt-0.5 block">{getPackageDeliveryDays()} days (with {getPackageRevisions()})</span>
                  </div>
                </div>

                {/* Price Negotiation Section */}
                {gig.negotiation && (
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-2 text-left">
                    <label className="text-xs font-bold text-slate-700 block">Propose a Negotiated Price</label>
                    <p className="text-[10px] text-slate-505 font-semibold mb-1">
                      The freelancer allows budget proposals for this gig. Enter your offer below if you wish to negotiate:
                    </p>
                    <div className="relative flex items-center max-w-xs">
                      <span className="absolute left-3 text-xs text-slate-450 font-bold">{gig.currency_symbol || "$"}</span>
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        value={customProposedPrice}
                        onChange={(e) => setCustomProposedPrice(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl pl-7 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Payment info notice */}
                <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-left">
                  <FiInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-800">Payment is requested after the freelancer accepts</p>
                    <p className="text-[10px] text-blue-705 font-semibold mt-0.5 leading-relaxed">
                      No charge is made when you place this order. Once the freelancer accepts, you'll be prompted to pay via <strong>Stripe</strong>, <strong>PayPal</strong>, or your <strong>Wallet</strong> from My Orders.
                    </p>
                  </div>
                </div>

                {/* Extra Features / Add-ons Builder */}
                <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-left">
                  <div className="flex justify-between items-center text-left">
                    <div>
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wide">Extra Features / Add-ons</label>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                        Add extra deliverables on top of the base package.
                        {orderMilestones.length > 0 ? (
                          <span className="text-amber-600 font-bold"> · 100% paid upfront into Escrow.</span>
                        ) : (
                          <span className="text-slate-400"> · 100% paid upfront.</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderMilestones([...orderMilestones, { title: "", amount: "", start_date: "", end_date: "", description: "" }]);
                      }}
                      className="shrink-0 text-[10px] bg-white hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg border border-slate-200/60 transition-all cursor-pointer ml-3 shadow-sm"
                    >
                      + Add Feature
                    </button>
                  </div>

                  {orderMilestones.length > 0 && (
                    <div className="flex flex-col gap-3.5 mt-1 border-t border-slate-150 pt-3">
                      {orderMilestones.map((m, idx) => (
                        <div key={idx} className="flex flex-col gap-2 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm relative text-left">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...orderMilestones];
                              updated.splice(idx, 1);
                              setOrderMilestones(updated);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-50 border border-rose-250 text-rose-600 flex items-center justify-center hover:bg-rose-100 cursor-pointer shadow-sm text-xs font-black"
                          >
                            ×
                          </button>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Feature / Milestone Title *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Extra Revision Round"
                                value={m.title}
                                onChange={(e) => {
                                  const updated = [...orderMilestones];
                                  updated[idx].title = e.target.value;
                                  setOrderMilestones(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Extra Cost ({gig.currency_symbol || "$"})</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={m.amount}
                                onChange={(e) => {
                                  const updated = [...orderMilestones];
                                  updated[idx].amount = e.target.value;
                                  setOrderMilestones(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Start Date</label>
                              <input
                                type="date"
                                value={m.start_date || ""}
                                onChange={(e) => {
                                  const updated = [...orderMilestones];
                                  updated[idx].start_date = e.target.value;
                                  setOrderMilestones(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">End Date</label>
                              <input
                                type="date"
                                value={m.end_date || ""}
                                onChange={(e) => {
                                  const updated = [...orderMilestones];
                                  updated[idx].end_date = e.target.value;
                                  setOrderMilestones(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 focus:outline-none focus:bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Description / Scope</label>
                            <textarea
                              rows={1}
                              placeholder="Describe specific tasks or scope..."
                              value={m.description || ""}
                              onChange={(e) => {
                                const updated = [...orderMilestones];
                                updated[idx].description = e.target.value;
                                setOrderMilestones(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white resize-none font-medium"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Cost breakdown */}
                      <div className="bg-white border border-slate-150 rounded-xl p-3.5 mt-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>Base Package</span>
                          <span className="font-extrabold text-slate-700">
                            {gig.currency_symbol || "$"}{(
                              getPackagePrice()
                            ).toLocaleString()}
                          </span>
                        </div>
                        {orderMilestones.map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 font-bold mt-1.5">
                            <span className="text-slate-400">+ {m.title || `Add-on #${i + 1}`}</span>
                            <span className="font-extrabold text-slate-650">{gig.currency_symbol || "$"}{parseFloat(m.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center">
                          <span className="text-[11px] font-black text-slate-800">Total Estimated Cost</span>
                          <span className="text-[11px] font-black text-teal-700">
                            {gig.currency_symbol || "$"}{(
                              getPackagePrice() + orderMilestones.reduce((acc, m) => acc + parseFloat(m.amount || 0), 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements text box */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Project Requirements *</label>
                    <button
                      type="button"
                      onClick={() => setPreviewRequirements(!previewRequirements)}
                      className="text-[10px] font-black text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {previewRequirements ? "Edit Requirements" : "Preview Markdown"}
                    </button>
                  </div>
                  
                  {previewRequirements ? (
                    <div 
                      className="bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 min-h-[120px] overflow-y-auto font-medium prose prose-slate max-w-full text-left"
                      dangerouslySetInnerHTML={{ __html: orderRequirements || '<span class="italic text-slate-400">No requirements entered yet.</span>' }}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 border border-b-0 border-slate-205 bg-slate-50 p-1.5 rounded-t-xl select-none">
                        <button
                          type="button"
                          onClick={() => insertRequirementFormat("bold")}
                          title="Bold <strong>"
                          className="p-1 hover:text-slate-800 hover:bg-slate-200/60 rounded cursor-pointer"
                        >
                          <b>B</b>
                        </button>
                        <button
                          type="button"
                          onClick={() => insertRequirementFormat("italic")}
                          title="Italic <em>"
                          className="p-1 hover:text-slate-800 hover:bg-slate-200/60 rounded cursor-pointer"
                        >
                          <i>I</i>
                        </button>
                        <button
                          type="button"
                          onClick={() => insertRequirementFormat("heading")}
                          title="Heading <h3>"
                          className="p-1 hover:text-slate-800 hover:bg-slate-200/60 rounded cursor-pointer text-xs font-bold"
                        >
                          H
                        </button>
                        <button
                          type="button"
                          onClick={() => insertRequirementFormat("bullet")}
                          title="Bullet List <ul>"
                          className="p-1 hover:text-slate-800 hover:bg-slate-200/60 rounded cursor-pointer text-xs"
                        >
                          • List
                        </button>
                      </div>
                      <textarea
                        id="project-requirements-textarea"
                        required
                        rows={4}
                        placeholder="Provide detailed instructions, references, guidelines, specifications or requirements..."
                        value={orderRequirements}
                        onChange={(e) => setOrderRequirements(e.target.value)}
                        className="bg-slate-50/50 border border-slate-205 hover:border-slate-350 rounded-b-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 font-medium resize-none"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-2 shrink-0 pt-3.5 border-t border-slate-100 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplying(false);
                    setOrderError("");
                    setPreviewRequirements(false);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-805 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="bg-teal-750 hover:bg-teal-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {orderSubmitting ? "Ordering..." : "Submit Order Request"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
