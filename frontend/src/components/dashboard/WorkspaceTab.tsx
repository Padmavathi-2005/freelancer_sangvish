import React, { useState, useMemo } from "react";
import { FiCheckCircle, FiCircle, FiLock } from "react-icons/fi";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";
import GigMilestoneTracker from "./GigMilestoneTracker";

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  completed: boolean;
}

interface Contract {
  id: string;
  client: string;
  project: string;
  budget: number;
  status: "In Progress" | "Under Review" | "Completed";
  progress: number;
}

interface WorkspaceTabProps {
  userRole: string | null;
  userName: string;
  isProfileIncomplete: boolean;
  stepsStatus: any[];
  profileCompletionProgress: number;
  onOpenProfileWizard?: () => void;
  setActiveTab: (tab: any) => void;
  setProfileStep: (step: number) => void;
  clientJobs: any[];
  allJobs: any[];
  freelancerProposals: any[];
  gigs: any[];
  clientGigs: any[];
  gigApplications: any[];
  clientApplications: any[];
  hiredFreelancers: any[];
  selectedProjectDetails: any | null;
  setSelectedProjectDetails: (details: any) => void;
  selectedGigOrderDetails: any | null;
  setSelectedGigOrderDetails: (details: any) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
  triggerToast: any;
  fetchClientJobs: () => Promise<void>;
  fetchAllJobs: () => Promise<void>;
  fetchFreelancerProposals: () => Promise<void>;
  fetchGigs: () => Promise<void>;
  fetchClientGigs: () => Promise<void>;
  fetchFreelancerApplications: () => Promise<void>;
  fetchClientApplications: () => Promise<void>;
  fetchHiredFreelancers: () => Promise<void>;
}

const monthlyEarnings = [
  { month: "Jan", amount: 4800 },
  { month: "Feb", amount: 6200 },
  { month: "Mar", amount: 8400 },
  { month: "Apr", amount: 7300 },
  { month: "May", amount: 9800 },
  { month: "Jun", amount: 11400 },
];
const maxEarning = Math.max(...monthlyEarnings.map((d) => d.amount));

const activeContracts: Contract[] = [
  { id: "c1", client: "Acme SaaS", project: "Web Application Redesign", budget: 10800, status: "In Progress", progress: 40 },
  { id: "c2", client: "Fintech Lab", project: "Stripe API & Checkout Flow", budget: 5500, status: "Under Review", progress: 100 },
  { id: "c3", client: "Nova AI", project: "AI Chat Agent Integration", budget: 8200, status: "In Progress", progress: 15 },
];

export default function WorkspaceTab({
  userRole,
  userName,
  isProfileIncomplete,
  stepsStatus,
  profileCompletionProgress,
  onOpenProfileWizard,
  setActiveTab,
  setProfileStep,
  clientJobs,
  allJobs,
  freelancerProposals,
  gigs,
  clientGigs,
  gigApplications,
  clientApplications,
  hiredFreelancers,
  selectedProjectDetails,
  setSelectedProjectDetails,
  selectedGigOrderDetails,
  setSelectedGigOrderDetails,
  setSelectedFreelancerProfile,
  triggerToast,
  fetchClientJobs,
  fetchAllJobs,
  fetchFreelancerProposals,
  fetchGigs,
  fetchClientGigs,
  fetchFreelancerApplications,
  fetchClientApplications,
  fetchHiredFreelancers,
}: WorkspaceTabProps) {
  // 1. Milestone Tracking State
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "m1", title: "Project discovery & high-fidelity prototypes", dueDate: "June 25", amount: 1500, completed: true },
    { id: "m2", title: "Setup Next.js 16 core structure & design system", dueDate: "July 02", amount: 2000, completed: true },
    { id: "m3", title: "Integrate database schemas & auth modules", dueDate: "July 15", amount: 2500, completed: false },
    { id: "m4", title: "Payment gateway & subscription flows setup", dueDate: "July 30", amount: 3000, completed: false },
    { id: "m5", title: "Final deployment, QA audits & handoff", dueDate: "August 10", amount: 1800, completed: false },
  ]);

  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const completedCount = useMemo(() => milestones.filter((m) => m.completed).length, [milestones]);
  const progressPercent = useMemo(() => Math.round((completedCount / milestones.length) * 100), [completedCount, milestones]);
  const completedAmount = useMemo(() => milestones.reduce((sum, m) => sum + (m.completed ? m.amount : 0), 0), [milestones]);
  const totalAmount = useMemo(() => milestones.reduce((sum, m) => sum + m.amount, 0), [milestones]);

  // 2. Proposal Bid Simulator State
  const [bidPrice, setBidPrice] = useState(4800);
  const [timelineWeeks, setTimelineWeeks] = useState(4);
  const platformFeePercent = 5; // LancerFlow elite fee is only 5%
  const feeAmount = useMemo(() => (bidPrice * platformFeePercent) / 100, [bidPrice]);
  const netEarnings = useMemo(() => bidPrice - feeAmount, [bidPrice, feeAmount]);

  // 3. Mock Chat State
  const [messages, setMessages] = useState([
    { sender: "client", text: "Hey Liam! The prototyping milestone looks fantastic. Love the transitions.", time: "10:14 AM" },
    { sender: "freelancer", text: "Thanks Sarah! Glad you like them. I am transitioning into the Next.js frontend structure today.", time: "10:18 AM" },
    { sender: "client", text: "Excellent. Will we be on track for the July 15 database integration checkpoint?", time: "10:20 AM" },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      sender: "freelancer",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    // Simulate automated client response after 1.5 seconds
    setTimeout(() => {
      const clientReplies = [
        "Sounds like a plan! Let me know if you hit any roadblocks.",
        "Perfect, keep up the great work!",
        "Awesome! I'll review and approve the milestones once completed.",
      ];
      const randomReply = clientReplies[Math.floor(Math.random() * clientReplies.length)];
      setMessages((prev) => [
        ...prev,
        {
          sender: "client",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="relative z-10 flex flex-col gap-8 w-full">
      {/* Profile Completion Progress Card */}
      {isProfileIncomplete && (
        <div 
          onClick={() => {
            if (onOpenProfileWizard) {
              onOpenProfileWizard();
            } else {
              const firstIncomplete = stepsStatus.find((s) => !s.done)?.number || 1;
              setActiveTab("settings");
              setProfileStep(firstIncomplete);
            }
          }}
          className="bg-gradient-to-r from-teal-600/5 to-cyan-500/5 border border-teal-650/30 hover:border-teal-600/70 hover:shadow-md cursor-pointer transition-all duration-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-fadeIn relative z-10 group"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider group-hover:bg-primary/20 transition-all">Profile Status</span>
              <span className="text-xs font-black text-slate-800">{profileCompletionProgress}% Complete</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors">
              {userRole === "client" ? "Complete your Client Profile step-by-step" : "Complete your Freelancer Profile step-by-step"}
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {userRole === "client" 
                ? "Filling in your company basics, online presence details, and hiring contact representative info unlocks remote talent lists."
                : "Filling in your professional title, experience history, education, certifications, and skills unlocks direct job placement contracts."}
            </p>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/65 mt-3.5 max-w-md">
              <div className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300" style={{ width: `${profileCompletionProgress}%` }}></div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {stepsStatus.map((step) => (
              <button
                key={step.number}
                onClick={() => {
                  if (onOpenProfileWizard) {
                    onOpenProfileWizard();
                  } else {
                    setActiveTab("settings");
                    setProfileStep(step.number);
                  }
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  step.done
                    ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100"
                    : "bg-white text-slate-600 border-slate-250 hover:border-primary/50 hover:bg-slate-50"
                }`}
              >
                {step.done ? (
                  <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                ) : (
                  <FiCircle className="text-slate-350 w-4 h-4 shrink-0" />
                )}
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative w-full z-10">
        {isProfileIncomplete && (
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-[6px] rounded-3xl flex flex-col items-center justify-center text-center p-8 z-30 select-none border border-slate-200/50 shadow-inner">
            <div className="w-14 h-14 bg-white border border-slate-200/60 text-slate-800 rounded-full flex items-center justify-center shadow-md animate-bounce mb-4">
              <FiLock className="w-6 h-6 text-slate-750" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 max-w-md">Workspace Hub Locked</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-sm font-semibold leading-relaxed">
              {userRole === "client"
                ? "You must complete your client profile to unlock active project milestones, cost calculators, messaging threads, and contractor stats."
                : "You must complete your freelancer profile to unlock active milestones, bidding simulators, messaging threads, and contract stats."}
            </p>
            <button
              onClick={() => {
                if (onOpenProfileWizard) {
                  onOpenProfileWizard();
                } else {
                  const firstIncomplete = stepsStatus.find((s) => !s.done)?.number || 1;
                  setActiveTab("settings");
                  setProfileStep(firstIncomplete);
                }
              }}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer mt-5 hover:scale-105"
            >
              Complete Profile Wizard
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${isProfileIncomplete ? "pointer-events-none opacity-40 select-none" : ""}`}>
          {/* LEFT COLUMN: ACTIVE WORKSPACE (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Milestone Progress Tracker */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {userRole === "client" ? "Active Contractor Milestones" : "Acme SaaS Project Milestones"}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">
                    {userRole === "client" ? "Review contract checkpoints and milestone approvals" : "Click a milestone checkpoint to toggle completion"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Milestones Paid: </span>
                  <span className="text-sm font-extrabold text-cyan-600 block sm:inline-block sm:ml-1">${completedAmount.toLocaleString()} / ${totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Custom Progress Bar */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Contract Progress</span>
                  <span className="text-slate-800">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checkpoint list */}
              <div className="flex flex-col gap-3">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMilestone(m.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${m.completed
                        ? "bg-primary-light/50 border-primary/20 hover:bg-primary-light"
                        : "bg-slate-50/30 border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 pr-4">
                      <button
                        type="button"
                        className={`w-5.5 h-5.5 rounded-md flex items-center justify-center border transition-all duration-150 ${m.completed
                            ? "bg-primary border-primary text-white"
                            : "border-slate-300 bg-white hover:border-slate-400"
                          }`}
                      >
                        {m.completed && (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <div>
                        <p className={`text-sm font-bold leading-snug transition-all duration-200 ${m.completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"
                          }`}>
                          {m.title}
                        </p>
                        <span className="text-xxs text-slate-400 font-semibold mt-1 block">Due: {m.dueDate}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-extrabold shrink-0 ${m.completed ? "text-primary/70" : "text-slate-800"}`}>
                      ${m.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Proposal / Bidding Simulator */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {userRole === "client" ? "Active Cost & Budget Simulator" : "Active Bidding & Payout Simulator"}
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  {userRole === "client" 
                    ? "Configure project budget to see platform service fee and total contractor payout."
                    : "Configure bid price to see platform fees and net freelancer payout."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left sliders */}
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-500">Bid Amount</span>
                      <span className="text-sm font-extrabold text-slate-800">${bidPrice.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="15000"
                      step="200"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-500">Timeline Duration</span>
                      <span className="text-sm font-extrabold text-slate-800">{timelineWeeks} Weeks</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={timelineWeeks}
                      onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* Right Summary */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 flex flex-col gap-3.5 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>{userRole === "client" ? "Project Budget Total:" : "Gross Bidding Total:"}</span>
                    <span className="text-slate-800 font-extrabold">${bidPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>{userRole === "client" ? "LancerFlow Client Fee (5%):" : `LancerFlow Service Fee (${platformFeePercent}%):`}</span>
                    <span className="text-rose-600 font-extrabold">-${feeAmount.toLocaleString()}</span>
                  </div>
                  <hr className="border-slate-200 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">{userRole === "client" ? "Total Contractor Payout:" : "Your Take-Home Net:"}</span>
                    <span className="text-base font-extrabold text-gradient-purple-cyan">${netEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Project Chat Box */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-extrabold text-white shadow-sm">
                  SC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Sarah Chen</h3>
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Product Lead @ Acme SaaS</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="h-48 overflow-y-auto pr-1 flex flex-col gap-4 no-scrollbar">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "freelancer" ? "self-end items-end" : "self-start items-start"
                      }`}
                  >
                    <div
                      className={`py-2.5 px-4 rounded-2xl text-sm leading-relaxed ${msg.sender === "freelancer"
                          ? "bg-primary text-white rounded-tr-none shadow-sm"
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                        }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xxs text-slate-400 font-semibold mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Input field */}
              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-4.5 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT COLUMN: FINANCIALS & CONTRACTS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Stats widgets */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between h-28 transition-all duration-300">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{userRole === "client" ? "Total Spends" : "Net Earnings"}</span>
                <span className="text-2xl font-black text-slate-900">
                  {userRole === "client" ? "$25,650" : `$${(14850 + completedAmount).toLocaleString()}`}
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between h-28 transition-all duration-300">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{userRole === "client" ? "Active Projects" : "Active Bids"}</span>
                <span className="text-2xl font-black text-slate-900">{userRole === "client" ? "3" : "4"}</span>
              </div>
            </section>

            {/* Monthly Earnings Chart */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{userRole === "client" ? "Monthly Spending Trend" : "Monthly Earning Trend"}</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">{userRole === "client" ? "Sleek expenditure projections & history" : "Sleek financial projections & history"}</p>
              </div>

              {/* Custom Bar Graph */}
              <div className="h-40 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
                {monthlyEarnings.map((data, idx) => {
                  const heightPercent = Math.max(10, Math.round((data.amount / maxEarning) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="relative w-full flex justify-center">
                        {/* Tooltip on Hover */}
                        <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white text-xxs font-extrabold py-1 px-1.5 rounded shadow-md pointer-events-none z-20">
                          ${data.amount.toLocaleString()}
                        </span>
                        {/* Interactive Bar */}
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-primary/70 to-cyan-500/70 group-hover:from-primary group-hover:to-cyan-400 transition-all duration-300"
                          style={{ height: `${heightPercent}px`, minHeight: "12px" }}
                        />
                      </div>
                      <span className="text-xxs text-slate-400 font-bold group-hover:text-slate-800 transition-colors">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Active Client/Freelancer Contracts Table */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{userRole === "client" ? "Active Freelancer Contracts" : "Active Client Contracts"}</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Review status and milestone metrics.</p>
              </div>

              <div className="flex flex-col gap-3">
                {userRole === "client" ? (
                  [
                    { id: "c1", contractor: "Liam O'Connor", role: "Next.js Core Developer", project: "Web Application Redesign", budget: 10800, status: "In Progress", progress: 40 },
                    { id: "c2", contractor: "Sophia Chen", role: "UI/UX Designer", project: "Figma Mockups & Prototype", budget: 5500, status: "Under Review", progress: 100 },
                    { id: "c3", contractor: "Marcus Vance", role: "Growth Marketer", project: "SaaS SEO Campaign Setup", budget: 8200, status: "In Progress", progress: 15 },
                  ].map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 transition-all">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider truncate">{c.contractor} • {c.role}</span>
                        <span className="text-sm font-extrabold text-slate-800 truncate mt-0.5">{c.project}</span>
                        <span className="text-xxs text-slate-500 font-semibold mt-1 block">Contract Budget: ${c.budget.toLocaleString()}</span>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className={`text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${c.progress === 100
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : c.status === "Under Review"
                              ? "bg-amber-50 text-amber-700 border-amber-200/60"
                              : "bg-cyan-50 text-cyan-700 border-cyan-200/60"
                          }`}>
                          {c.progress === 100 ? "Under Review" : c.status}
                        </span>
                        <span className="text-xxs text-slate-400 font-bold">{c.progress}% approved</span>
                      </div>
                    </div>
                  ))
                ) : (
                  activeContracts.map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 transition-all">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider truncate">{c.client}</span>
                        <span className="text-sm font-extrabold text-slate-800 truncate mt-0.5">{c.project}</span>
                        <span className="text-xxs text-slate-500 font-semibold mt-1 block">Budget: ${c.budget.toLocaleString()}</span>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className={`text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${c.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : c.status === "Under Review"
                              ? "bg-amber-50 text-amber-700 border-amber-200/60"
                              : "bg-cyan-50 text-cyan-700 border-cyan-200/60"
                          }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
