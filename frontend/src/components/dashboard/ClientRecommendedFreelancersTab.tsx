import { API_URL } from "@/config/api";
import React, { useState, useEffect } from "react";

interface Freelancer {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  skills: string[];
  bio: string;
  verified: boolean;
  category: "development" | "design" | "marketing" | "ai";
  email?: string;
  profileImage?: string;
}

const FALLBACK_FREELANCERS: Freelancer[] = [
  {
    id: "1",
    name: "Alex Rivera",
    avatarColor: "from-violet-500 to-indigo-500",
    role: "Senior Full-Stack Developer",
    rating: 4.9,
    completedJobs: 142,
    hourlyRate: 95,
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
    bio: "Ex-Stripe engineer specializing in high-performance web applications and financial integrations.",
    verified: true,
    category: "development",
    email: "alex.rivera@lancerflow.net",
  },
  {
    id: "2",
    name: "Sophia Chen",
    avatarColor: "from-cyan-500 to-blue-500",
    role: "Product & UI/UX Designer",
    rating: 5.0,
    completedJobs: 89,
    hourlyRate: 85,
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    bio: "Creating beautiful, conversion-focused digital products for series A startups and enterprises.",
    verified: true,
    category: "design",
    email: "sophia.chen@lancerflow.net",
  },
  {
    id: "3",
    name: "Marcus Vance",
    avatarColor: "from-emerald-500 to-teal-500",
    role: "Growth & Acquisition Marketer",
    rating: 4.8,
    completedJobs: 115,
    hourlyRate: 75,
    skills: ["SEO", "Google Ads", "Conversion Rate Optimization", "Copywriting"],
    bio: "Helping SaaS companies scale from $10k to $100k MRR through data-driven performance marketing.",
    verified: false,
    category: "marketing",
    email: "marcus.vance@lancerflow.net",
  },
  {
    id: "4",
    name: "Elena Rostova",
    avatarColor: "from-rose-500 to-pink-500",
    role: "AI Integration & ML Engineer",
    rating: 4.9,
    completedJobs: 54,
    hourlyRate: 120,
    skills: ["Python", "PyTorch", "LLM Fine-tuning", "FastAPI", "OpenAI API"],
    bio: "Building smart conversational agents and recommendation engines integrated directly into production apps.",
    verified: true,
    category: "ai",
    email: "elena.rostova@lancerflow.net",
  },
  {
    id: "5",
    name: "Liam O'Connor",
    avatarColor: "from-amber-500 to-orange-500",
    role: "Next.js Core Developer",
    rating: 4.7,
    completedJobs: 73,
    hourlyRate: 90,
    skills: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    bio: "Specialist in server components, performance optimization, and custom Next.js deployment solutions.",
    verified: true,
    category: "development",
    email: "liam.oconnor@lancerflow.net",
  },
  {
    id: "6",
    name: "Amina Al-Jamil",
    avatarColor: "from-purple-500 to-fuchsia-500",
    role: "Brand Identity Designer",
    rating: 5.0,
    completedJobs: 104,
    hourlyRate: 80,
    skills: ["Illustrator", "Brand Strategy", "Typography", "Packaging Design"],
    bio: "Developing memorable visual identities and design languages for modern eco-friendly brands.",
    verified: true,
    category: "design",
    email: "amina.jamil@lancerflow.net",
  },
];

const getGradient = (name: string) => {
  const gradients = [
    "from-violet-500 to-indigo-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-purple-500 to-fuchsia-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

interface ClientRecommendedFreelancersTabProps {
  setSelectedFreelancerProfile: (profile: any) => void;
}

export default function ClientRecommendedFreelancersTab({
  setSelectedFreelancerProfile,
}: ClientRecommendedFreelancersTabProps) {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/freelancer/client/recommendations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Freelancer[] = data.map((f: any) => ({
              id: f.user_id?.toString() || Math.random().toString(),
              name: f.name || "Freelancer Partner",
              avatarColor: getGradient(f.name || ""),
              role: f.professional_title || "Elite Specialist",
              rating: parseFloat(f.avg_rating) || 5.0,
              completedJobs: parseInt(f.completed_contracts) || 0,
              hourlyRate: parseInt(f.hourly_rate) || 50,
              skills: Array.isArray(f.skills)
                ? f.skills.map((s: any) => (typeof s === "string" ? s : s.skill_name)).filter(Boolean)
                : [],
              bio: f.bio || "No professional overview bio provided yet by this freelancer partner.",
              verified: f.vetting_status === "Approved",
              category: (f.category_name?.toLowerCase() || "development") as any,
              email: f.email,
              profileImage: f.profile_image,
            }));
            setFreelancers(mapped);
          } else {
            setFreelancers(FALLBACK_FREELANCERS);
          }
        } else {
          setFreelancers(FALLBACK_FREELANCERS);
        }
      } catch (err) {
        console.error("Failed to fetch recommended freelancers:", err);
        setFreelancers(FALLBACK_FREELANCERS);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommended Freelancers
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-semibold">Top matching remote talent recommended based on active requirements and ratings.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold text-slate-400">Loading recommended talent...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-350 transition-all duration-300 relative overflow-hidden">
              <div className="flex flex-col gap-4">
                {/* Avatar & Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${freelancer.avatarColor} flex items-center justify-center font-black text-white shadow-sm shrink-0 overflow-hidden relative`}>
                    <span className="text-sm font-black">
                      {freelancer.name ? freelancer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : ""}
                    </span>
                    {freelancer.profileImage && (
                      <img
                        src={`https://freelancer.sangvish.com${freelancer.profileImage}`}
                        alt={freelancer.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => setSelectedFreelancerProfile({
                        user_id: parseInt(freelancer.id) || freelancer.id,
                        name: freelancer.name,
                        role: freelancer.role,
                        email: freelancer.email || "developer@lancerflow.net",
                        skills: freelancer.skills,
                        hourlyRate: freelancer.hourlyRate,
                        rating: freelancer.rating,
                        completedJobs: freelancer.completedJobs,
                        bio: freelancer.bio
                      })}
                      className="font-extrabold text-slate-800 hover:text-primary transition-colors text-sm text-left block truncate cursor-pointer"
                    >
                      {freelancer.name}
                    </button>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider truncate">{freelancer.role}</p>
                  </div>
                </div>

                {/* Bio & Details */}
                <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3">{freelancer.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {freelancer.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 border border-slate-200/40 text-[9px] font-bold px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                  {freelancer.skills.length > 3 && (
                    <span className="bg-slate-50 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      +{freelancer.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <i className="fa-solid fa-star text-amber-500"></i>
                  <span className="text-slate-700">{freelancer.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-semibold">({freelancer.completedJobs} contracts)</span>
                </div>
                <span className="text-primary font-extrabold text-xs">${freelancer.hourlyRate}/hr</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
