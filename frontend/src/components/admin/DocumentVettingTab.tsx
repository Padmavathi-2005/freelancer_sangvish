"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiAlertCircle, FiFileText, FiSearch } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { useAdmin } from "@/app/admin/AdminContext";

interface DocumentField {
  field_id: number;
  field_key: string;
  field_name: string;
  field_description: string;
  is_required: boolean;
  is_enabled: boolean;
  has_expiry: boolean;
  applicable_to: string;
  field_type: string;
  step_number?: number;
  is_system?: boolean;
}

export default function DocumentVettingTab() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [fields, setFields] = useState<DocumentField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drag to scroll table state
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("a")) {
      return;
    }
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Form states (for Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<DocumentField | null>(null);
  const [formData, setFormData] = useState({
    field_name: "",
    field_description: "",
    is_required: true,
    is_enabled: true,
    has_expiry: true,
    applicable_to: "freelancer",
    field_type: "file_any",
    step_number: 5,
  });

  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchFields();
    setMounted(true);
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/documents/admin/fields`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch document fields.");
      }
      const data = await res.json();
      setFields(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        field.field_name.toLowerCase().includes(query) ||
        field.field_key.toLowerCase().includes(query) ||
        (field.field_description && field.field_description.toLowerCase().includes(query));

      // Step match
      const fieldStep = field.step_number || (field.applicable_to === "client" ? 4 : 5);
      const matchesStep = stepFilter === "all" || String(fieldStep) === stepFilter;

      // Role match
      const matchesRole =
        roleFilter === "all" ||
        field.applicable_to === roleFilter ||
        (roleFilter !== "both" && field.applicable_to === "both");

      return matchesSearch && matchesStep && matchesRole;
    });
  }, [fields, searchQuery, stepFilter, roleFilter]);

  const totalItems = filteredFields.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedFields = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredFields.slice(startIndex, startIndex + pageSize);
  }, [filteredFields, currentPage, pageSize]);

  const handleOpenAddModal = () => {
    setEditingField(null);
    setFormData({
      field_name: "",
      field_description: "",
      is_required: true,
      is_enabled: true,
      has_expiry: true,
      applicable_to: "freelancer",
      field_type: "file_any",
      step_number: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (field: DocumentField) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_description: field.field_description,
      is_required: field.is_required,
      is_enabled: field.is_enabled,
      has_expiry: field.has_expiry,
      applicable_to: field.applicable_to || "freelancer",
      field_type: field.field_type || "file_any",
      step_number: field.step_number || (field.applicable_to === "client" ? 4 : 5),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.field_name.trim()) {
      alert("Field name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("adminToken");
      
      let res;
      if (editingField) {
        // Edit API call
        res = await fetch(`${API_URL}/documents/admin/fields/${editingField.field_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Add API call
        res = await fetch(`${API_URL}/documents/admin/fields`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to save document field.");
      }

      setSuccess(editingField ? "Field updated successfully!" : "Field created successfully!");
      fetchFields();
      handleCloseModal();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document requirement? This will also delete any files uploaded by freelancers for this field.")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/documents/admin/fields/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || "Failed to delete document field.");
      }

      setSuccess("Field deleted successfully!");
      fetchFields();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred.");
    }
  };

  const handleToggleStatus = async (field: DocumentField) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/documents/admin/fields/${field.field_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          field_name: field.field_name,
          field_description: field.field_description,
          is_required: field.is_required,
          is_enabled: !field.is_enabled,
          has_expiry: field.has_expiry,
          applicable_to: field.applicable_to || "freelancer",
          field_type: field.field_type || "file_any",
        }),
      });

      if (res.ok) {
        fetchFields();
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left text-slate-800">
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-teal-700" />
            Document Verification Requirements
          </h2>
          <p className="text-slate-500 dark:text-slate-350 text-xs mt-1 font-semibold">
            Manage the list of documents freelancers are required or prompted to upload during onboarding verification.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black tracking-wider rounded-xl transition cursor-pointer shadow-sm shadow-teal-700/10 border border-teal-650 dark:border-teal-500"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Requirement</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
          <FiCheck className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Table Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* Search & Filter Controls */}
        <div className="p-4 bg-slate-50/75 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, key, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 focus:border-teal-700 rounded-xl pl-10 pr-8 py-2 text-xs focus:outline-none transition-all font-semibold text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Step Filter */}
            <div className="relative shrink-0">
              <select
                value={stepFilter}
                onChange={(e) => {
                  setStepFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-700 hover:border-slate-355 dark:hover:border-slate-600 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-7"
              >
                <option value="all">All Steps</option>
                <option value="1">Step 1</option>
                <option value="2">Step 2</option>
                <option value="3">Step 3</option>
                <option value="4">Step 4</option>
                <option value="5">Step 5</option>
                <option value="6">Step 6</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative shrink-0">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-700 hover:border-slate-355 dark:hover:border-slate-600 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-7"
              >
                <option value="all">All Roles</option>
                <option value="freelancer">Freelancer only</option>
                <option value="client">Client only</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent border-teal-700 rounded-full animate-spin" />
          </div>
        ) : fields.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs">
            No document verification fields configured yet. Click "Add Requirement" to create one.
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs bg-slate-50/50">
            No fields found matching your filters.
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`overflow-x-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-wider select-none">
                    <th className="px-6 py-4">Field Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Applies To</th>
                    <th className="px-6 py-4 text-center">Field Type</th>
                    <th className="px-6 py-4 text-center">Step</th>
                    <th className="px-6 py-4 text-center">Required</th>
                    <th className="px-6 py-4 text-center">Expiry Date Required</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                  {paginatedFields.map((field) => (
                    <tr key={field.field_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-slate-800 dark:text-slate-100">{field.field_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Key: {field.field_key}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs text-slate-550 leading-relaxed">
                        {field.field_description || <span className="text-slate-300 italic">No description</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          field.applicable_to === "both"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                            : field.applicable_to === "client"
                            ? "bg-blue-50 text-blue-705 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                            : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                        }`}>
                          {field.applicable_to || "freelancer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center capitalize text-[10px] font-bold text-slate-500 dark:text-slate-350">
                        {field.field_type ? field.field_type.replace("file_", "File: ") : "Any File"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-slate-808 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                          Step {field.step_number || (field.applicable_to === 'client' ? 4 : 5)}
                          {field.is_system && <span className="text-[7.5px] text-teal-650 ml-1 uppercase font-black tracking-wide">System</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          field.is_required
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-350 dark:border-rose-800"
                            : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800"
                        }`}>
                          {field.is_required ? "Required" : "Optional"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          field.has_expiry
                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                            : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800"
                        }`}>
                          {field.has_expiry ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(field)}
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            field.is_enabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {field.is_enabled ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(field)}
                            className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-355 border border-slate-200 dark:border-slate-800 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                            title="Edit Settings"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          {!field.is_system ? (
                            <button
                              onClick={() => handleDelete(field.field_id)}
                              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-150 dark:border-rose-900/60 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                              title="Delete Requirement"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-400 p-2 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-center cursor-not-allowed" title="System Field (Locked)">
                              <FiX className="w-3.5 h-3.5 opacity-50" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredFields.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 font-bold select-none text-xs">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                  <span className="text-slate-400 ml-2 font-semibold">
                    Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)} to{" "}
                    {Math.min(totalItems, currentPage * pageSize)} of {totalItems} entries
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border transition-all font-bold cursor-pointer ${
                        page === currentPage
                          ? "bg-teal-700 border-teal-700 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex justify-center items-start p-4 backdrop-blur-[1px] overflow-y-auto select-none">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn text-left flex flex-col my-8">
            <div className="bg-white border-b border-slate-150 px-6 py-4 flex justify-between items-center text-slate-800 shrink-0">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-905">
                {editingField ? "Edit Requirement Settings" : "Add New Document Requirement"}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {editingField?.is_system && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-[10px] text-teal-800 leading-relaxed font-bold select-none">
                  ℹ️ This is a System Profile Field. The field key, name, role, and type are locked, but you can configure its Description, Step Number, and toggles below.
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Field Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ID Proof, Address Proof"
                  value={formData.field_name}
                  onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                  className={`bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-800 font-bold ${
                    editingField?.is_system ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""
                  }`}
                  required
                  disabled={editingField?.is_system}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Applies To
                </label>
                <select
                  value={formData.applicable_to}
                  onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
                  className={`bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-800 font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 cursor-pointer ${
                    editingField?.is_system ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""
                  }`}
                  disabled={editingField?.is_system}
                >
                  <option value="freelancer">Freelancer only</option>
                  <option value="client">Client only</option>
                  <option value="both">Both Freelancer & Client</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Field Type
                </label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                  className={`bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-800 font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 cursor-pointer ${
                    editingField?.is_system ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""
                  }`}
                  disabled={editingField?.is_system}
                >
                  <optgroup label="Text Inputs">
                    <option value="text">Short Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date Picker</option>
                  </optgroup>
                  <optgroup label="File Uploads">
                    <option value="file_pdf">PDF Document Only</option>
                    <option value="file_image">Image Only (PNG/JPG)</option>
                    <option value="file_word">Word Document (.doc, .docx)</option>
                    <option value="file_any">Any File</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Onboarding Step *
                </label>
                <select
                  value={formData.step_number}
                  onChange={(e) => setFormData({ ...formData, step_number: Number(e.target.value) })}
                  className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-800 font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 cursor-pointer"
                >
                  <option value={1}>Step 1</option>
                  <option value={2}>Step 2</option>
                  <option value={3}>Step 3</option>
                  <option value={4}>Step 4</option>
                  <option value={5}>Step 5</option>
                  <option value={6}>Step 6</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Requirement Description
                </label>
                <textarea
                  placeholder="Upload instructions or criteria for the freelancer..."
                  value={formData.field_description}
                  onChange={(e) => setFormData({ ...formData, field_description: e.target.value })}
                  className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-870 font-medium min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-3.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4 accent-teal-750"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">Required Field</span>
                    <span className="text-[9px] text-slate-400">Freelancers cannot complete onboarding without this document.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.has_expiry}
                    onChange={(e) => setFormData({ ...formData, has_expiry: e.target.checked })}
                    className="w-4 h-4 accent-teal-750"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">Requires Expiry Date</span>
                    <span className="text-[9px] text-slate-400">Freelancers must enter a valid document expiration date.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-750"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">Enable Field</span>
                    <span className="text-[9px] text-slate-400">Display this document requirement to onboarding freelancers.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Requirement"}
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
