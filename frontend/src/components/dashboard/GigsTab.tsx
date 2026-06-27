import React, { useState, useEffect } from "react";
import CustomSelect from "../CustomSelect";
import { FiAlertTriangle, FiCheckCircle, FiCheck } from "react-icons/fi";

interface GigsTabProps {
  triggerToast: any;
}

const GigsTab: React.FC<GigsTabProps> = ({ triggerToast }) => {
  // Gig Creation and Listing States
  const [gigs, setGigs] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [isCreatingGig, setIsCreatingGig] = useState(false);

  // Gig Form Fields
  const [gigTitle, setGigTitle] = useState("");
  const [gigDescription, setGigDescription] = useState("");
  const [gigPrice, setGigPrice] = useState("");
  const [gigCurrencyId, setGigCurrencyId] = useState("");
  const [gigDeliveryDays, setGigDeliveryDays] = useState("3");
  const [gigRevisions, setGigRevisions] = useState("3");
  const [gigImages, setGigImages] = useState("");
  const [gigVideoUrl, setGigVideoUrl] = useState("");
  const [gigDocuments, setGigDocuments] = useState("");
  const [gigCategoryId, setGigCategoryId] = useState("");
  const [gigSubCategoryId, setGigSubCategoryId] = useState("");
  const [gigSelectedSkills, setGigSelectedSkills] = useState<number[]>([]);
  const [gigError, setGigError] = useState("");
  const [gigSuccess, setGigSuccess] = useState(false);
  const [gigPublishing, setGigPublishing] = useState(false);

  // Lists for Gig Selectors
  const [gigCategories, setGigCategories] = useState<any[]>([]);
  const [gigSubCategories, setGigSubCategories] = useState<any[]>([]);
  const [gigAvailableSkills, setGigAvailableSkills] = useState<any[]>([]);

  // Gig creation upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const fetchGigs = async () => {
    try {
      setLoadingGigs(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/gigs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGigs(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch gigs:", e);
    } finally {
      setLoadingGigs(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/currencies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
        if (data.length > 0) {
          const usd = data.find((c: any) => c.code === "USD");
          setGigCurrencyId(usd ? usd.currency_id.toString() : data[0].currency_id.toString());
        }
      }
    } catch (e) {
      console.error("Failed to fetch currencies:", e);
    }
  };

  const fetchGigCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/categories");
      if (res.ok) {
        setGigCategories(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    }
  };

  const fetchGigSubCategories = async (catId?: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/sub-categories");
      if (res.ok) {
        const data = await res.json();
        if (catId) {
          setGigSubCategories(data.filter((sub: any) => sub.category_id.toString() === catId));
        } else {
          setGigSubCategories(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sub-categories:", e);
    }
  };

  const fetchGigSkills = async (subCatId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/skills/subcategory/${subCatId}`);
      if (res.ok) {
        setGigAvailableSkills(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch skills:", e);
    }
  };

  // Upload API query helper
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingImages(true);
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigImages ? gigImages.split(",").map((u) => u.trim()).filter(Boolean) : [];
      setGigImages([...existing, ...urls].join(", "));
      triggerToast("success", "Images uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingVideo(true);
      const url = await uploadFile(e.target.files[0]);
      setGigVideoUrl(url);
      triggerToast("success", "Video uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingDocs(true);
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigDocuments ? gigDocuments.split(",").map((u) => u.trim()).filter(Boolean) : [];
      setGigDocuments([...existing, ...urls].join(", "));
      triggerToast("success", "Documents uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  // Form Field Change Handlers
  const handleGigCategoryChange = (catId: string) => {
    setGigCategoryId(catId);
    setGigSubCategoryId("");
    setGigSelectedSkills([]);
    setGigAvailableSkills([]);
    fetchGigSubCategories(catId);
  };

  const handleGigSubCategoryChange = (subCatId: string) => {
    setGigSubCategoryId(subCatId);
    setGigSelectedSkills([]);
    if (subCatId) {
      fetchGigSkills(subCatId);
    } else {
      setGigAvailableSkills([]);
    }
  };

  const handleGigToggleSkill = (skillId: number) => {
    setGigSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleCreateGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGigError("");
    setGigSuccess(false);

    if (!gigTitle.trim() || !gigDescription.trim() || !gigPrice || !gigCurrencyId || !gigDeliveryDays) {
      setGigError("Please fill out all required fields marked with *");
      return;
    }

    try {
      setGigPublishing(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: gigCategoryId ? parseInt(gigCategoryId) : null,
          sub_category_id: gigSubCategoryId ? parseInt(gigSubCategoryId) : null,
          title: gigTitle.trim(),
          description: gigDescription.trim(),
          price: parseFloat(gigPrice),
          currency_id: parseInt(gigCurrencyId),
          delivery_days: parseInt(gigDeliveryDays),
          revisions: gigRevisions ? parseInt(gigRevisions) : null,
          images: gigImages ? gigImages.split(",").map((url) => url.trim()) : [],
          video_url: gigVideoUrl.trim() || null,
          documents: gigDocuments ? gigDocuments.split(",").map((url) => url.trim()) : [],
          skills: gigSelectedSkills,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGigSuccess(true);
        // Reset form
        setGigTitle("");
        setGigDescription("");
        setGigPrice("");
        setGigDeliveryDays("3");
        setGigRevisions("3");
        setGigImages("");
        setGigVideoUrl("");
        setGigDocuments("");
        setGigCategoryId("");
        setGigSubCategoryId("");
        setGigSelectedSkills([]);
        
        // Return to listing
        setTimeout(() => {
          setIsCreatingGig(false);
          setGigSuccess(false);
          fetchGigs();
        }, 1500);
      } else {
        setGigError(data.message || "Failed to publish service gig.");
      }
    } catch (err: any) {
      setGigError("Network error. Please try again.");
    } finally {
      setGigPublishing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
    fetchCurrencies();
    fetchGigCategories();
  }, []);

  return (
    isCreatingGig ? (
      <div className="relative z-10 max-w-3xl mx-auto w-full animate-fadeIn text-left">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-slate-800">
          
          {/* Form Header */}
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Create a Service Gig</h2>
                <p className="text-slate-404 text-xs mt-0.5">Package your expert skills into a purchaseable service.</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsCreatingGig(false);
                setGigError("");
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60"
            >
              ← Back to Gigs
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateGigSubmit} className="flex flex-col gap-4">
            
            {gigError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gigError}</span>
              </div>
            )}
            {gigSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-650 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Service Gig published successfully! Redirecting...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gig Title */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold block mb-1 text-slate-650">Gig Title *</label>
                <input
                  type="text"
                  placeholder="e.g. I will build a premium responsive Next.js landing page"
                  value={gigTitle}
                  onChange={(e) => setGigTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-650">Category *</label>
                <CustomSelect
                  options={gigCategories.map((c) => ({ value: c.category_id.toString(), label: c.category_name }))}
                  value={gigCategoryId}
                  onChange={handleGigCategoryChange}
                  placeholder="Select Category"
                />
              </div>

              {/* Subcategory Selection */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-650">Sub-category *</label>
                <CustomSelect
                  options={gigSubCategories.map((sc) => ({ value: sc.sub_category_id.toString(), label: sc.sub_category_name }))}
                  value={gigSubCategoryId}
                  onChange={handleGigSubCategoryChange}
                  placeholder="Select Subcategory"
                  disabled={!gigCategoryId}
                />
              </div>

              {/* Pricing */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-655">Price *</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={gigPrice}
                  onChange={(e) => setGigPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Currency Selector */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-655">Currency *</label>
                <CustomSelect
                  options={currencies.map((c) => ({ value: c.currency_id.toString(), label: `${c.name} (${c.symbol})` }))}
                  value={gigCurrencyId}
                  onChange={(val: string) => setGigCurrencyId(val)}
                  placeholder="Select Currency"
                />
              </div>

              {/* Delivery Days */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-655">Delivery Days *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={gigDeliveryDays}
                  onChange={(e) => setGigDeliveryDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Revisions */}
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-655">Revisions</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3 (0 for unlimited)"
                  value={gigRevisions}
                  onChange={(e) => setGigRevisions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Showcase Image URL & Upload */}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold block text-slate-655">Showcase Images *</label>
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Image preview cards */}
                  {gigImages.split(",").map(u => u.trim()).filter(Boolean).map((imgUrl, index) => (
                    <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-xl overflow-hidden group/thumb">
                      <img src={imgUrl} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const list = gigImages.split(",").map(u => u.trim()).filter(Boolean);
                          list.splice(index, 1);
                          setGigImages(list.join(", "));
                        }}
                        className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload Card */}
                  <label className="w-20 h-20 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400">
                    {uploadingImages ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-lg">📷</span>
                        <span className="text-[9px] font-black uppercase text-slate-505">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingImages}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Paste image URLs here (comma-separated) or click above to upload"
                  value={gigImages}
                  onChange={(e) => setGigImages(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Showcase Video URL & Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold block text-slate-655">Showcase Video</label>
                <div className="flex items-center gap-3">
                  {gigVideoUrl ? (
                    <div className="relative w-28 h-20 border border-slate-200 rounded-xl overflow-hidden group/vid bg-slate-950">
                      <video src={gigVideoUrl} className="w-full h-full object-cover" controls />
                      <button
                        type="button"
                        onClick={() => setGigVideoUrl("")}
                        className="absolute top-1 right-1 bg-slate-900/60 hover:bg-rose-600 text-white rounded-full p-1 transition-all text-[8px] font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 flex-1 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400">
                      {uploadingVideo ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-lg">🎥</span>
                          <span className="text-[9px] font-black uppercase text-slate-505">Upload Video</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        disabled={uploadingVideo}
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste video URL here or click above to upload"
                  value={gigVideoUrl}
                  onChange={(e) => setGigVideoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Documents / PDF Link & Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold block text-slate-655">Showcase Documents</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {gigDocuments.split(",").map(u => u.trim()).filter(Boolean).map((docUrl, index) => {
                    const name = docUrl.split("/").pop();
                    return (
                      <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold">
                        <span className="text-slate-400">📄</span>
                        <span className="text-slate-600 max-w-[80px] truncate" title={name}>{name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = gigDocuments.split(",").map(u => u.trim()).filter(Boolean);
                            list.splice(index, 1);
                            setGigDocuments(list.join(", "));
                          }}
                          className="text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  
                  <label className="h-9 px-4 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex items-center justify-center cursor-pointer transition-all gap-1.5 select-none text-slate-400 text-xs">
                    {uploadingDocs ? (
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-sm">📄</span>
                        <span className="text-[9px] font-black uppercase text-slate-505">Upload Doc</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.zip"
                      multiple
                      disabled={uploadingDocs}
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Paste document URLs (comma-separated) or click above to upload"
                  value={gigDocuments}
                  onChange={(e) => setGigDocuments(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Detailed Description */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold block mb-1 text-slate-655">Gig Description *</label>
                <textarea
                  placeholder="Provide a detailed description of your service, deliverables, and scope of work..."
                  value={gigDescription}
                  onChange={(e) => setGigDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none h-32 resize-none"
                />
              </div>

              {/* Skills tags selection */}
              {gigAvailableSkills.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold block mb-2 text-slate-655">Associated Skills *</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {gigAvailableSkills.map((skill) => {
                      const isChecked = gigSelectedSkills.includes(skill.skill_id);
                      return (
                        <button
                          type="button"
                          key={skill.skill_id}
                          onClick={() => handleGigToggleSkill(skill.skill_id)}
                          className={`px-3 py-1.5 rounded-lg text-xxs font-extrabold transition-all border cursor-pointer select-none ${
                            isChecked
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                          }`}
                        >
                          {skill.skill_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            <button
              type="submit"
              disabled={gigPublishing}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 self-end hover:scale-[1.02] active:scale-95 mt-4 disabled:opacity-50 font-display"
            >
              {gigPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>Publishing Gig...</span>
                </>
              ) : (
                <>
                  <span>Publish Service Gig</span>
                  <FiCheck className="w-3.5 h-3.5" />
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    ) : (
      <div className="relative z-10 w-full animate-fadeIn flex flex-col gap-6 text-slate-800 text-left">
        
        {/* Header Info */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">My Service Gigs</h2>
            <p className="text-slate-404 text-xs mt-0.5">List and offer pre-priced services directly to clients.</p>
          </div>
          <button
            onClick={() => setIsCreatingGig(true)}
            className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4.5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 self-start sm:self-auto font-display"
          >
            <span>+ Create New Gig</span>
          </button>
        </div>

        {loadingGigs ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-404 text-xs font-semibold">Loading your service gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4.5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center text-2xl font-bold animate-pulse">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">No active service gigs</h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                Package your core professional skills into standardized, flat-rate services (e.g. logo design, database setups) so clients can purchase them instantly.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingGig(true)}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer font-display"
            >
              Create Your First Gig
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => {
              const gigImg = gig.images && Array.isArray(gig.images) && gig.images.length > 0
                ? gig.images[0]
                : null;
              return (
                <div key={gig.gig_id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between relative group">
                  
                  <span className={`absolute top-3.5 right-3.5 z-10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border ${
                    gig.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {gig.status}
                  </span>

                  <div className="relative w-full h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {gigImg ? (
                      <img
                        src={gigImg}
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary/5 to-cyan-500/5 flex flex-col items-center justify-center text-slate-400 gap-1 font-mono text-[10px] select-none">
                        <span className="text-xl">🎨</span>
                        <span className="font-extrabold text-slate-500 uppercase tracking-widest text-[8px]">No Image Preview</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-grow flex flex-col gap-3 justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
                        {gig.sub_category_name || gig.category_name || "General Service"}
                      </span>

                      <h3 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
                        {gig.title}
                      </h3>

                      <p className="text-[10px] leading-relaxed text-slate-455 font-medium line-clamp-2 text-left">
                        {gig.description}
                      </p>
                    </div>

                    {gig.skills && Array.isArray(gig.skills) && gig.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                        {gig.skills.slice(0, 3).map((s: any) => (
                          <span key={s.skill_id} className="text-[8px] font-bold text-slate-650 bg-slate-100/50 border border-slate-200/50 px-2 py-0.5 rounded">
                            {s.skill_name}
                          </span>
                        ))}
                        {gig.skills.length > 3 && (
                          <span className="text-[8px] font-black text-slate-400 px-1 py-0.5">
                            +{gig.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <span className="text-[9px] font-extrabold text-slate-450 uppercase flex items-center gap-1">
                      ⏱ {gig.delivery_days} Days
                    </span>
                    
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400">STARTING AT</span>
                      <span className="text-sm font-black text-slate-900">
                        {gig.currency_symbol || "$"}{gig.price}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    )
  );
};

export default GigsTab;
