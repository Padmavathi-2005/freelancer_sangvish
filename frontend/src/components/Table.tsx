"use client";

import React from "react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  // Pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  // Selection
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  getRowId?: (row: T) => string | number;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No items found.",
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  selectedIds = [],
  onSelectionChange,
  getRowId,
}: TableProps<T>) {
  
  // Calculate index range
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array helper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show page 1
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      {/* Table Content Scroll wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {onSelectionChange && getRowId && (
                <th className="px-6 py-4 w-12 text-center select-none">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every((row) => selectedIds.includes(getRowId(row)))}
                    onChange={(e) => {
                      const currentPageIds = data.map((row) => getRowId(row));
                      if (e.target.checked) {
                        const newSelection = Array.from(new Set([...selectedIds, ...currentPageIds]));
                        onSelectionChange(newSelection);
                      } else {
                        const newSelection = selectedIds.filter((id) => !currentPageIds.includes(id));
                        onSelectionChange(newSelection);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Loading skeletons
              Array.from({ length: itemsPerPage }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/10">
                  {onSelectionChange && getRowId && (
                    <td className="px-6 py-4.5 w-12 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded animate-pulse mx-auto" />
                    </td>
                  )}
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className="h-4 bg-slate-200/60 rounded-md animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state row
              <tr>
                <td colSpan={columns.length + (onSelectionChange && getRowId ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <svg className="w-10 h-10 stroke-current text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18M2.25 13.5l1.125-11.25a2.25 2.25 0 012.237-2.025h12.776a2.25 2.25 0 012.236 2.025l1.125 11.25M2.25 13.5v7.5A2.25 2.25 0 004.5 23.25h15a2.25 2.25 0 002.25-2.25v-7.5" />
                    </svg>
                    <span className="text-sm font-semibold">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              // Render records
              data.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {onSelectionChange && getRowId && (
                    <td className="px-6 py-4.5 w-12 text-center select-none">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(getRowId(row))}
                        onChange={(e) => {
                          const rowId = getRowId(row);
                          if (e.target.checked) {
                            onSelectionChange([...selectedIds, rowId]);
                          } else {
                            onSelectionChange(selectedIds.filter((id) => id !== rowId));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col, cIdx) => {
                    let cellVal;
                    if (typeof col.accessor === "function") {
                      cellVal = col.accessor(row, rIdx);
                    } else {
                      cellVal = row[col.accessor] as React.ReactNode;
                    }
                    return (
                      <td
                        key={cIdx}
                        className={`px-6 py-4.5 text-sm text-slate-700 font-medium ${col.className || ""}`}
                      >
                        {cellVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 0 && (
        <div className="px-6 py-4.5 bg-slate-50/40 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500 font-bold select-none">
            Showing <span className="text-slate-700">{startIdx}</span> to <span className="text-slate-700">{endIdx}</span> of <span className="text-slate-700">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-1">
            {/* Prev button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Previous Page"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page buttons */}
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-slate-400 text-sm font-black select-none"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={idx}
                  onClick={() => onPageChange(Number(pageNum))}
                  disabled={loading}
                  className={`min-w-[36px] h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary-light text-primary border border-primary/20 shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-350"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Next Page"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
