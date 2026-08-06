"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect, useRef } from "react";
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiTrash2, FiUpload, FiX, FiSearch, FiCheck } from "react-icons/fi";

function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

type Plan = {
  plan_id?: number;
  name: string;
  plan_role: "buyer" | "seller";
  plan_type: "Day(s)" | "Month(s)" | "Year(s)";
  plan_duration: number;
  price: number;
  credits: number;
  profile_featured_duration: number;
  job_posting_limit: number;
  featured_project_limit: number;
  featured_project_duration: number;
  badge_image: string;
  gig_discount_percent: number;
  proposal_limit: number;
  transaction_fee_percent: number;
  featured_job_allowance: boolean;
  description: string;
  period: string;
  features: string[] | string;
  button_text: string;
  is_popular: boolean;
  is_current: boolean;
  is_enabled?: boolean;
};

const BadgeAvatar = ({ src, name }: { src?: string; name: string }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-300 flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-sm font-black text-teal-900 uppercase">{name ? name.charAt(0) : "P"}</span>
    </div>
  );
};

const emptyForm = (): Plan => ({
  name: "",
  plan_role: "seller",
  plan_type: "Day(s)",
  plan_duration: 30,
  price: 0,
  credits: 10,
  profile_featured_duration: 0,
  job_posting_limit: 3,
  featured_project_limit: 0,
  featured_project_duration: 0,
  badge_image: "",
  gig_discount_percent: 0,
  proposal_limit: 5,
  transaction_fee_percent: 5,
  featured_job_allowance: false,
  description: "",
  period: "/month",
  features: "",
  button_text: "Get Started",
  is_popular: false,
  is_current: false,
  is_enabled: true,
});

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<"seller" | "buyer">("seller");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Plan>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ title: string; text: string } | null>(null);
  const badgeInputRef = useRef<HTMLInputElement>(null);

  // Package options settings state
  const [packageOption, setPackageOption] = useState("Free listing for both type of users");
  const [creditsPerProject, setCreditsPerProject] = useState(1);
  const [savingSettings, setSavingSettings] = useState(false);

  const triggerToast = (title: string, text: string) => {
    setToast({ title, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/subscription-plans`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (res.ok) setPlans(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const pkgOpts = data.find((s: any) => s.setting_key === "package_options_settings");
        if (pkgOpts?.setting_value) {
          const val = typeof pkgOpts.setting_value === "string"
            ? JSON.parse(pkgOpts.setting_value)
            : pkgOpts.setting_value;
          setPackageOption(val.package_option || "Free listing for both type of users");
          setCreditsPerProject(val.credits_per_project ?? 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchSettings();
  }, []);

  const handleSavePackageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          category: "general",
          setting_key: "package_options_settings",
          setting_value: {
            package_option: packageOption,
            credits_per_project: creditsPerProject,
          },
        }),
      });
      if (res.ok) {
        triggerToast("Settings Saved", "Package options settings updated successfully!");
      } else {
        triggerToast("Error", "Failed to save settings.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error", "Network error.");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchRole = p.plan_role === roleTab;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const setField = (field: keyof Plan, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === undefined || form.price === null || isNaN(form.price)) {
      triggerToast("Validation Error", "Package name and price are required.");
      return;
    }
    setSaving(true);
    try {
      let parsedFeatures = form.features;
      if (typeof parsedFeatures === "string") {
        parsedFeatures = parsedFeatures.split("\n").map((f) => f.trim()).filter(Boolean);
      }

      const payload = {
        ...form,
        plan_type: "Day(s)",
        features: parsedFeatures,
        button_text: form.button_text || "Get Started",
      };

      const url = editingId
        ? `${API_URL}/admin/subscription-plans/${editingId}`
        : `${API_URL}/admin/subscription-plans`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerToast(
          editingId ? "Plan Updated" : "Plan Created",
          `Package "${form.name}" ${editingId ? "updated" : "added"} successfully!`
        );
        setForm(emptyForm());
        setEditingId(null);
        fetchPlans();
      } else {
        const err = await res.json();
        triggerToast("Error", err.message || "Failed to save package.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setForm({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : plan.features || "",
    });
    setEditingId(plan.plan_id!);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete package "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/subscription-plans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (res.ok) {
        triggerToast("Deleted", `Package "${name}" removed.`);
        fetchPlans();
      } else {
        triggerToast("Error", "Failed to delete package.");
      }
    } catch {
      triggerToast("Error", "Network error.");
    }
  };

  const handleToggleEnabled = async (plan: Plan) => {
    // Toggle using update endpoint with is_current flipped
    try {
      let parsedFeatures = plan.features;
      if (typeof parsedFeatures === "string") {
        parsedFeatures = parsedFeatures.split("\n").map((f: string) => f.trim()).filter(Boolean);
      }
      const res = await fetch(`${API_URL}/admin/subscription-plans/${plan.plan_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          ...plan,
          features: parsedFeatures,
          is_enabled: !plan.is_enabled,
        }),
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      triggerToast("Error", "Only jpg, jpeg, png, gif, webp allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerToast("Error", "File size must be under 5MB.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.path || data.file_url || "";
        setField("badge_image", url);
        triggerToast("Uploaded", "Badge image uploaded successfully.");
      } else {
        triggerToast("Error", "Failed to upload image.");
      }
    } catch {
      triggerToast("Error", "Network error on upload.");
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 transition placeholder-slate-350";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1";

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Manage pricing packages for freelancers and clients separately.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── LEFT PANEL: Add / Edit Package Form ── */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          {/* Package options settings card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-slate-800">
              Package options settings
            </h3>
            <form onSubmit={handleSavePackageSettings} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Package options</label>
                <select
                  value={packageOption}
                  onChange={(e) => setPackageOption(e.target.value)}
                  className={inputClass}
                >
                  <option value="Free listing for both type of users">Free listing for both type of users</option>
                  <option value="Paid listing for both">Paid listing for both</option>
                  <option value="Paid listing for sellers">Paid listing for sellers</option>
                  <option value="Paid listing for buyers">Paid listing for buyers</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Credits to apply on a single project</label>
                <input
                  type="number"
                  min={0}
                  value={creditsPerProject}
                  onChange={(e) => setCreditsPerProject(parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Add credits"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingSettings ? "Saving..." : "Save settings"}
              </button>
            </form>
          </div>

          {/* Form card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800">
                {editingId ? "Edit Package" : "Add Package"}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setForm(emptyForm()); setEditingId(null); }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Package for */}
              <div>
                <label className={labelClass}>Package for</label>
                <div className="flex gap-5 mt-1">
                  {(["buyer", "seller"] as const).map((role) => (
                    <label key={role} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="plan_role"
                        value={role}
                        checked={form.plan_role === role}
                        onChange={() => setField("plan_role", role)}
                        className="accent-teal-600"
                      />
                      {role === "buyer" ? "Client" : "Freelancer"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Package name */}
              <div>
                <label className={labelClass}>Package name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={inputClass}
                  placeholder="Add package name"
                  required
                />
              </div>

              {/* Package duration */}
              <div>
                <label className={labelClass}>Package duration (in days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.plan_duration}
                  onChange={(e) => setField("plan_duration", parseInt(e.target.value) || 1)}
                  className={inputClass}
                  placeholder="Add package duration in days"
                />
              </div>

              {/* Package price */}
              <div>
                <label className={labelClass}>Package price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", parseFloat(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Add package price"
                  required
                />
              </div>

              {/* Number of credits */}
              <div>
                <label className={labelClass}>Number of credits</label>
                <input
                  type="number"
                  min={0}
                  value={form.credits}
                  onChange={(e) => setField("credits", parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Add number of credits"
                />
              </div>

              {/* Profile featured duration */}
              <div>
                <label className={labelClass}>Profile featured duration (in days)</label>
                <input
                  type="number"
                  min={0}
                  value={form.profile_featured_duration}
                  onChange={(e) => setField("profile_featured_duration", parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Add feature duration"
                />
              </div>

              {/* Number of projects to post */}
              <div>
                <label className={labelClass}>Number of projects to post</label>
                <input
                  type="number"
                  min={0}
                  value={form.job_posting_limit}
                  onChange={(e) => setField("job_posting_limit", parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Number of projects to post"
                />
              </div>

              {/* Featured projects */}
              <div>
                <label className={labelClass}>Featured projects</label>
                <input
                  type="number"
                  min={0}
                  value={form.featured_project_limit}
                  onChange={(e) => setField("featured_project_limit", parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Featured projects"
                />
              </div>

              {/* Featured projects duration */}
              <div>
                <label className={labelClass}>Featured projects duration</label>
                <input
                  type="number"
                  min={0}
                  value={form.featured_project_duration}
                  onChange={(e) => setField("featured_project_duration", parseInt(e.target.value) || 0)}
                  className={inputClass}
                  placeholder="Featured projects duration"
                />
              </div>

              {/* Upload image */}
              <div>
                <label className={labelClass}>Upload image</label>
                <div
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs text-slate-500 cursor-pointer hover:border-teal-300 transition"
                  onClick={() => badgeInputRef.current?.click()}
                >
                  {form.badge_image ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={form.badge_image}
                        alt="badge"
                        className="w-8 h-8 object-cover rounded-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="truncate text-teal-700 font-semibold">{form.badge_image.split("/").pop()}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setField("badge_image", ""); }}
                        className="ml-auto text-slate-400 hover:text-rose-500"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="leading-relaxed">
                        You can upload <span className="text-rose-500 font-bold">.jpg, .jpeg, .gif, .png</span> file formats only. Make sure your file size should not exceed <span className="font-bold">5MB</span>.
                      </p>
                      <p className="text-teal-600 font-bold mt-1 flex items-center gap-1">
                        <FiUpload className="w-3 h-3" /> Click here to upload
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={badgeInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.gif,.png,.webp"
                  className="hidden"
                  onChange={handleBadgeUpload}
                />
              </div>

              {/* Features textarea */}
              <div>
                <label className={labelClass}>Features (one per line)</label>
                <textarea
                  rows={3}
                  value={typeof form.features === "string" ? form.features : (form.features as string[]).join("\n")}
                  onChange={(e) => setField("features", e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder={"Feature 1\nFeature 2"}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? "Saving..." : (editingId ? "Update & Save" : "Add Package")}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: Packages Table ── */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800">Packages</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 w-40"
                  />
                </div>
              </div>
            </div>

            {/* Role Tabs */}
            <div className="flex border-b border-slate-100 px-5">
              {(["seller", "buyer"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleTab(role)}
                  className={`px-5 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 -mb-px ${
                    roleTab === role
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {role === "seller" ? "Freelancer" : "Client"}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Package For</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-xs text-slate-400 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-t-teal-600 border-slate-200 rounded-full animate-spin" />
                          Loading packages...
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-xs text-slate-400 font-semibold">
                        No packages found for {roleTab === "seller" ? "Freelancers" : "Clients"}.
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map((plan) => (
                      <tr key={plan.plan_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <BadgeAvatar src={plan.badge_image} name={plan.name} />
                            <span className="text-xs font-extrabold text-teal-700">{plan.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-xs font-semibold text-slate-600 capitalize">
                            {plan.plan_role === "seller" ? "Freelancer" : "Client"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-xs font-bold text-slate-800">{plan.price}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                            plan.is_enabled !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${plan.is_enabled !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {plan.is_enabled !== false ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              title="Edit"
                              onClick={() => handleEdit(plan)}
                              className="text-slate-400 hover:text-teal-700 transition-colors cursor-pointer p-1 rounded-lg hover:bg-teal-50"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title={plan.is_enabled !== false ? "Disable" : "Enable"}
                              onClick={() => handleToggleEnabled(plan)}
                              className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-amber-50"
                            >
                              {plan.is_enabled !== false
                                ? <FiEyeOff className="w-3.5 h-3.5" />
                                : <FiEye className="w-3.5 h-3.5" />
                              }
                            </button>
                            <button
                              title="Delete"
                              onClick={() => handleDelete(plan.plan_id!, plan.name)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-rose-50"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-fadeIn max-w-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            ✓
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">{toast.title || "Notification"}</span>
            {toast.text && (
              <span className="text-[11px] text-slate-300 font-semibold mt-0.5 leading-snug">{toast.text}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
