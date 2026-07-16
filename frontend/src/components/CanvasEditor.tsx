"use client";
import { API_URL } from "@/config/api";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FiX, FiImage, FiType, FiSquare, FiTrash2,
  FiChevronUp, FiChevronDown, FiUpload, FiSave,
  FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiLayers, FiEye,
} from "react-icons/fi";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ElementType = "text" | "image" | "rect";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity: number;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  // Image
  imageUrl?: string;
  borderRadius?: number;
  objectFit?: "cover" | "contain" | "fill";
  // Shape
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

type BgType = "solid" | "gradient" | "image";

export interface CanvasBackground {
  type: BgType;
  solidColor: string;
  gradient: { from: string; to: string; direction: string };
  imageUrl: string;
  imageSize: "cover" | "contain" | "auto";
}

interface DragState {
  elementId: string;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
}

interface ResizeState {
  elementId: string;
  handle: string;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

export interface CanvasEditorProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
  initialElements?: CanvasElement[];
  initialBackground?: CanvasBackground;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  "Inter", "Roboto", "Poppins", "Montserrat", "Open Sans",
  "Lato", "Oswald", "Raleway", "Playfair Display", "Plus Jakarta Sans",
  "Georgia", "Times New Roman", "Arial", "Verdana", "Trebuchet MS", "Courier New",
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=Roboto:wght@300;400;700;900&family=Poppins:wght@300;400;600;700;900&family=Montserrat:wght@300;400;600;700;900&family=Open+Sans:wght@300;400;700&family=Lato:wght@300;400;700&family=Oswald:wght@300;400;700&family=Raleway:wght@300;400;700&family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap";

const GRADIENT_DIRECTIONS = [
  { label: "→", value: "to right" },
  { label: "↓", value: "to bottom" },
  { label: "↘", value: "135deg" },
  { label: "↗", value: "45deg" },
];

const RESIZE_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const HANDLE_CURSORS: Record<string, string> = {
  nw: "nw-resize", n: "n-resize",   ne: "ne-resize",
  e:  "e-resize",  se: "se-resize", s:  "s-resize",
  sw: "sw-resize", w:  "w-resize",
};

const HANDLE_POSITIONS: Record<string, React.CSSProperties> = {
  nw: { top: -5, left: -5 },
  n:  { top: -5, left: "calc(50% - 5px)" },
  ne: { top: -5, right: -5 },
  e:  { top: "calc(50% - 5px)", right: -5 },
  se: { bottom: -5, right: -5 },
  s:  { bottom: -5, left: "calc(50% - 5px)" },
  sw: { bottom: -5, left: -5 },
  w:  { top: "calc(50% - 5px)", left: -5 },
};

let _idCounter = 0;
const genId = () => `el_${Date.now()}_${_idCounter++}`;

// ─── Helper ────────────────────────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CanvasEditor({
  onSave,
  onClose,
  canvasWidth = 800,
  canvasHeight = 400,
  initialElements = [],
  initialBackground,
}: CanvasEditorProps) {
  const defaultBg: CanvasBackground = {
    type: "solid",
    solidColor: "#0f172a",
    gradient: { from: "#0f172a", to: "#0d9488", direction: "to right" },
    imageUrl: "",
    imageSize: "cover",
  };

  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [bg, setBg] = useState<CanvasBackground>(initialBackground ?? defaultBg);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"bg" | "elements">("bg");
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  // ── Load Google Fonts ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = GOOGLE_FONTS_URL;
      document.head.appendChild(link);
    }
  }, []);

  // Keyboard delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const active = document.activeElement as HTMLElement;
        if (active?.isContentEditable || active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
        setElements((p) => p.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateEl = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const getRelPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ── Add Elements ──────────────────────────────────────────────────────────

  const addText = () => {
    const el: CanvasElement = {
      id: genId(), type: "text",
      x: 60, y: 60, width: 340, height: 64,
      zIndex: elements.length + 1, opacity: 1,
      text: "Type your text here",
      fontSize: 28, fontFamily: "Inter", fontWeight: "700",
      fontStyle: "normal", textDecoration: "none",
      color: "#ffffff", textAlign: "left", lineHeight: 1.3,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
    setLeftTab("elements");
  };

  const addImageFrame = () => {
    const el: CanvasElement = {
      id: genId(), type: "image",
      x: 120, y: 80, width: 200, height: 160,
      zIndex: elements.length + 1, opacity: 1,
      imageUrl: "", borderRadius: 8, objectFit: "cover",
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
    setLeftTab("elements");
  };

  const addRect = () => {
    const el: CanvasElement = {
      id: genId(), type: "rect",
      x: 100, y: 100, width: 200, height: 100,
      zIndex: elements.length + 1, opacity: 1,
      fillColor: "#0d9488", borderRadius: 8,
      strokeColor: "transparent", strokeWidth: 0,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
    setLeftTab("elements");
  };

  // ── Mouse Events ──────────────────────────────────────────────────────────

  const onElemMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      const el = elements.find((el) => el.id === id);
      if (!el) return;
      setSelectedId(id);
      const pos = getRelPos(e);
      setDragging({ elementId: id, startMouseX: pos.x, startMouseY: pos.y, origX: el.x, origY: el.y });
    },
    [elements]
  );

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent, id: string, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      const el = elements.find((el) => el.id === id);
      if (!el) return;
      const pos = getRelPos(e);
      setResizing({ elementId: id, handle, startMouseX: pos.x, startMouseY: pos.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height });
    },
    [elements]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging && !resizing) return;
      const pos = getRelPos(e);

      if (dragging) {
        const dx = pos.x - dragging.startMouseX;
        const dy = pos.y - dragging.startMouseY;
        updateEl(dragging.elementId, {
          x: Math.max(0, dragging.origX + dx),
          y: Math.max(0, dragging.origY + dy),
        });
      }

      if (resizing) {
        const { handle, origX, origY, origW, origH, startMouseX, startMouseY } = resizing;
        const dx = pos.x - startMouseX;
        const dy = pos.y - startMouseY;
        let nx = origX, ny = origY, nw = origW, nh = origH;

        if (handle.includes("e")) nw = Math.max(40, origW + dx);
        if (handle.includes("s")) nh = Math.max(20, origH + dy);
        if (handle.includes("w")) { nx = origX + dx; nw = Math.max(40, origW - dx); }
        if (handle.includes("n")) { ny = origY + dy; nh = Math.max(20, origH - dy); }

        updateEl(resizing.elementId, { x: nx, y: ny, width: nw, height: nh });
      }
    },
    [dragging, resizing, updateEl]
  );

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  // ── Image Upload ──────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (r.ok) return (await r.json()).url as string;
    } catch {}
    return URL.createObjectURL(file);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    elementId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (elementId) {
      updateEl(elementId, { imageUrl: url });
    } else {
      setBg((p) => ({ ...p, imageUrl: url, type: "image" }));
    }
    e.target.value = "";
  };

  // ── Layer Ops ─────────────────────────────────────────────────────────────

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((p) => p.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const bringForward = () => {
    if (!selected) return;
    updateEl(selectedId!, { zIndex: selected.zIndex + 1 });
  };

  const sendBackward = () => {
    if (!selected || selected.zIndex <= 1) return;
    updateEl(selectedId!, { zIndex: selected.zIndex - 1 });
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setSaving(true);
    try {
      const off = document.createElement("canvas");
      off.width = canvasWidth;
      off.height = canvasHeight;
      const ctx = off.getContext("2d")!;

      // Background
      if (bg.type === "solid") {
        ctx.fillStyle = bg.solidColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bg.type === "gradient") {
        const { from, to, direction } = bg.gradient;
        let grad: CanvasGradient;
        if (direction === "to right")  grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        else if (direction === "to bottom") grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        else if (direction === "135deg")    grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        else                                grad = ctx.createLinearGradient(canvasWidth, 0, 0, canvasHeight);
        grad.addColorStop(0, from);
        grad.addColorStop(1, to);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bg.type === "image" && bg.imageUrl) {
        try {
          const img = await loadImg(bg.imageUrl);
          const s = bg.imageSize;
          if (s === "cover") {
            const sc = Math.max(canvasWidth / img.width, canvasHeight / img.height);
            const w = img.width * sc, h = img.height * sc;
            ctx.drawImage(img, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
          } else if (s === "contain") {
            const sc = Math.min(canvasWidth / img.width, canvasHeight / img.height);
            const w = img.width * sc, h = img.height * sc;
            ctx.drawImage(img, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
          } else {
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          }
        } catch {}
      }

      // Elements
      for (const el of [...elements].sort((a, b) => a.zIndex - b.zIndex)) {
        ctx.save();
        ctx.globalAlpha = el.opacity;

        if (el.type === "rect") {
          ctx.fillStyle = el.fillColor || "#0d9488";
          const r = el.borderRadius || 0;
          if (r > 0) { drawRoundedRect(ctx, el.x, el.y, el.width, el.height, r); ctx.fill(); }
          else ctx.fillRect(el.x, el.y, el.width, el.height);
          if (el.strokeWidth && el.strokeColor && el.strokeColor !== "transparent") {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
          }
        }

        if (el.type === "text" && el.text) {
          const size = el.fontSize || 16;
          ctx.font = `${el.fontStyle || "normal"} ${el.fontWeight || "400"} ${size}px "${el.fontFamily || "Inter"}", sans-serif`;
          ctx.fillStyle = el.color || "#ffffff";
          ctx.textAlign = (el.textAlign || "left") as CanvasTextAlign;
          ctx.textBaseline = "top";
          const lh = size * (el.lineHeight || 1.3);
          el.text.split("\n").forEach((line, i) => {
            const tx = el.textAlign === "center" ? el.x + el.width / 2
                      : el.textAlign === "right" ? el.x + el.width
                      : el.x;
            ctx.fillText(line, tx, el.y + i * lh);
          });
        }

        if (el.type === "image" && el.imageUrl) {
          try {
            const img = await loadImg(el.imageUrl);
            ctx.save();
            const r = el.borderRadius || 0;
            if (r > 0) { drawRoundedRect(ctx, el.x, el.y, el.width, el.height, r); ctx.clip(); }
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
            ctx.restore();
          } catch {}
        }

        ctx.restore();
      }

      onSave(off.toDataURL("image/png"));
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Background CSS ────────────────────────────────────────────────────────

  const bgStyle = (): React.CSSProperties => {
    if (bg.type === "solid") return { backgroundColor: bg.solidColor };
    if (bg.type === "gradient") {
      return { background: `linear-gradient(${bg.gradient.direction}, ${bg.gradient.from}, ${bg.gradient.to})` };
    }
    if (bg.type === "image" && bg.imageUrl) {
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: bg.imageSize,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    return { backgroundColor: "#0f172a" };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "rgba(2,6,23,0.96)" }}>

      {/* ══ Top Bar ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0d1117] border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-black text-white tracking-tight ml-1">Canvas Image Editor</span>
          <span className="text-[10px] text-slate-500 font-semibold bg-slate-800 px-2 py-0.5 rounded-full">
            {canvasWidth} × {canvasHeight}px
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-black rounded-lg transition cursor-pointer shadow-lg shadow-teal-900/40"
          >
            <FiSave className="w-3.5 h-3.5" />
            {saving ? "Exporting…" : "Save & Use Image"}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══ Main 3-Column Layout ══════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ──── Left Panel ──────────────────────────────────────────────────── */}
        <div className="w-[216px] shrink-0 bg-[#0d1117] border-r border-slate-700/60 flex flex-col overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-slate-700/60 shrink-0">
            {(["bg", "elements"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest cursor-pointer transition border-b-2 ${
                  leftTab === tab
                    ? "border-teal-400 text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === "bg" ? "Background" : "Elements"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4 text-left">

            {/* ────── Background Tab ────── */}
            {leftTab === "bg" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="label-xs">Background Type</span>
                  <div className="flex gap-1">
                    {(["solid", "gradient", "image"] as BgType[]).map((t) => (
                      <button key={t} onClick={() => setBg((p) => ({ ...p, type: t }))}
                        className={`flex-1 py-1.5 text-[8px] font-black rounded-lg capitalize cursor-pointer transition ${
                          bg.type === t ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {bg.type === "solid" && (
                  <div className="flex flex-col gap-1.5">
                    <span className="label-xs">Color</span>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={bg.solidColor}
                        onChange={(e) => setBg((p) => ({ ...p, solidColor: e.target.value }))}
                        className="w-9 h-9 rounded-lg cursor-pointer p-0.5 border border-slate-600 bg-transparent shrink-0" />
                      <input type="text" value={bg.solidColor}
                        onChange={(e) => setBg((p) => ({ ...p, solidColor: e.target.value }))}
                        className="input-field flex-1" />
                    </div>
                  </div>
                )}

                {bg.type === "gradient" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {(["from", "to"] as const).map((k) => (
                        <div key={k} className="flex flex-col gap-1">
                          <span className="label-xs">{k === "from" ? "From" : "To"}</span>
                          <input type="color" value={bg.gradient[k]}
                            onChange={(e) => setBg((p) => ({ ...p, gradient: { ...p.gradient, [k]: e.target.value } }))}
                            className="w-full h-9 rounded-lg cursor-pointer p-0.5 border border-slate-600 bg-transparent" />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="label-xs">Direction</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GRADIENT_DIRECTIONS.map((d) => (
                          <button key={d.value} onClick={() => setBg((p) => ({ ...p, gradient: { ...p.gradient, direction: d.value } }))}
                            className={`py-2 text-base font-black rounded-lg cursor-pointer transition ${
                              bg.gradient.direction === d.value ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >{d.label}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {bg.type === "image" && (
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center gap-2 p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-teal-500 transition">
                      <FiUpload className="w-5 h-5 text-slate-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase">Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                    </label>
                    {bg.imageUrl && (
                      <>
                        <img src={bg.imageUrl} className="w-full h-20 object-cover rounded-xl border border-slate-700" alt="" />
                        <div className="flex flex-col gap-1">
                          <span className="label-xs">Fit Mode</span>
                          <select value={bg.imageSize}
                            onChange={(e) => setBg((p) => ({ ...p, imageSize: e.target.value as any }))}
                            className="input-field">
                            <option value="cover">Cover (fill)</option>
                            <option value="contain">Contain (fit)</option>
                            <option value="auto">Original</option>
                          </select>
                        </div>
                        <button onClick={() => setBg((p) => ({ ...p, imageUrl: "" }))}
                          className="text-[9px] font-black text-rose-400 hover:underline text-left">
                          Clear image
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ────── Elements Tab ────── */}
            {leftTab === "elements" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="label-xs mb-0.5">Add Element</span>
                  <button onClick={addText}
                    className="elem-btn">
                    <FiType className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Text Layer
                  </button>
                  <button onClick={addImageFrame}
                    className="elem-btn">
                    <FiImage className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Image Frame
                  </button>
                  <button onClick={addRect}
                    className="elem-btn">
                    <FiSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Shape
                  </button>
                </div>

                {elements.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-slate-700/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <FiLayers className="w-3 h-3 text-slate-500" />
                      <span className="label-xs">Layers</span>
                    </div>
                    {[...elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
                      <button key={el.id}
                        onClick={() => setSelectedId(el.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[10px] font-bold text-left cursor-pointer transition border ${
                          selectedId === el.id
                            ? "bg-teal-600/20 border-teal-500/50 text-teal-300"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {el.type === "text"  ? <FiType className="w-3 h-3 shrink-0" />
                          : el.type === "image" ? <FiImage className="w-3 h-3 shrink-0" />
                          : <FiSquare className="w-3 h-3 shrink-0" />}
                        <span className="truncate flex-1">
                          {el.type === "text"
                            ? (el.text?.slice(0, 16) || "Text")
                            : el.type === "image" ? "Image Frame"
                            : "Shape"}
                        </span>
                        <FiEye className="w-3 h-3 shrink-0 text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ──── Canvas Area ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center bg-[#161b22] overflow-auto p-10"
          onClick={() => setSelectedId(null)}
        >
          {/* Grid dots bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.35,
            }}
          />

          <div
            ref={canvasRef}
            style={{
              width: canvasWidth,
              height: canvasHeight,
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              cursor: dragging ? "grabbing" : "default",
              borderRadius: 12,
              boxShadow: "0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
              ...bgStyle(),
            }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
            {[...elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => {
              const isSel = selectedId === el.id;
              return (
                <div
                  key={el.id}
                  style={{
                    position: "absolute",
                    left: el.x, top: el.y,
                    width: el.width, height: el.height,
                    opacity: el.opacity,
                    zIndex: el.zIndex,
                    outline: isSel ? "2px solid #14b8a6" : "none",
                    outlineOffset: 1,
                    cursor: dragging?.elementId === el.id ? "grabbing" : "grab",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => el.type !== "text" && onElemMouseDown(e, el.id)}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                >
                  {/* ── Shape ── */}
                  {el.type === "rect" && (
                    <div
                      style={{
                        width: "100%", height: "100%",
                        backgroundColor: el.fillColor,
                        borderRadius: el.borderRadius,
                        border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.strokeColor}` : "none",
                      }}
                      onMouseDown={(e) => onElemMouseDown(e, el.id)}
                    />
                  )}

                  {/* ── Text (contentEditable) ── */}
                  {el.type === "text" && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                      onInput={(e) => updateEl(el.id, { text: (e.currentTarget as HTMLDivElement).innerText })}
                      style={{
                        width: "100%", height: "100%",
                        fontSize: el.fontSize,
                        fontFamily: `"${el.fontFamily}", sans-serif`,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        textDecoration: el.textDecoration,
                        color: el.color,
                        textAlign: el.textAlign,
                        lineHeight: el.lineHeight,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        outline: "none",
                        cursor: "text",
                        padding: 2,
                        boxSizing: "border-box" as const,
                      }}
                    />
                  )}

                  {/* ── Image Frame ── */}
                  {el.type === "image" && (
                    <div
                      style={{
                        width: "100%", height: "100%",
                        borderRadius: el.borderRadius,
                        overflow: "hidden",
                        backgroundColor: "#1e293b",
                        border: el.imageUrl ? "none" : "1.5px dashed #334155",
                      }}
                      onMouseDown={(e) => onElemMouseDown(e, el.id)}
                    >
                      {el.imageUrl ? (
                        <img src={el.imageUrl} alt="" draggable={false}
                          style={{ width: "100%", height: "100%", objectFit: el.objectFit || "cover", display: "block" }} />
                      ) : (
                        <label style={{
                          width: "100%", height: "100%",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          cursor: "pointer", gap: 6,
                        }}>
                          <FiUpload style={{ color: "#475569", fontSize: 22 }} />
                          <span style={{ color: "#475569", fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                            Click to upload
                          </span>
                          <input type="file" accept="image/*" style={{ display: "none" }}
                            onChange={(e) => { e.stopPropagation(); handleImageUpload(e, el.id); }} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* ── 8 Resize Handles ── */}
                  {isSel && RESIZE_HANDLES.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        width: 10, height: 10,
                        backgroundColor: "white",
                        border: "2px solid #14b8a6",
                        borderRadius: 2,
                        cursor: HANDLE_CURSORS[h],
                        zIndex: 9999,
                        ...HANDLE_POSITIONS[h],
                      }}
                      onMouseDown={(e) => onHandleMouseDown(e, el.id, h)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ──── Right Properties Panel ───────────────────────────────────────── */}
        <div className="w-[220px] shrink-0 bg-[#0d1117] border-l border-slate-700/60 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-700/60 shrink-0">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  {selected.type === "text" ? "✏️ Text"
                    : selected.type === "image" ? "🖼 Frame"
                    : "⬜ Shape"} Properties
                </span>
                <button onClick={deleteSelected}
                  className="p-1.5 text-rose-400 hover:bg-rose-900/30 rounded-lg transition cursor-pointer"
                  title="Delete (Del)">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4 text-left">

                {/* Position & Size */}
                <div className="flex flex-col gap-1.5">
                  <span className="label-xs">Position & Size</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["x", "y", "width", "height"] as const).map((f) => (
                      <div key={f} className="flex flex-col gap-0.5">
                        <span className="text-[7px] font-bold text-slate-600 uppercase">{f}</span>
                        <input type="number"
                          value={Math.round(selected[f] as number)}
                          onChange={(e) => updateEl(selected.id, { [f]: parseInt(e.target.value) || 0 })}
                          className="input-field" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="label-xs">Opacity</span>
                    <span className="text-[8px] text-slate-400">{Math.round(selected.opacity * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01}
                    value={selected.opacity}
                    onChange={(e) => updateEl(selected.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full accent-teal-500 h-1 cursor-pointer" />
                </div>

                {/* Layer order */}
                <div className="flex gap-1.5">
                  <button onClick={sendBackward}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <FiChevronDown className="w-3 h-3" /> Back
                  </button>
                  <button onClick={bringForward}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <FiChevronUp className="w-3 h-3" /> Front
                  </button>
                </div>

                {/* ── Text Properties ── */}
                {selected.type === "text" && (
                  <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="label-xs">Text Content</span>
                      <textarea value={selected.text} rows={3}
                        onChange={(e) => updateEl(selected.id, { text: e.target.value })}
                        className="input-field resize-none" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="label-xs">Font Family</span>
                      <select value={selected.fontFamily}
                        onChange={(e) => updateEl(selected.id, { fontFamily: e.target.value })}
                        style={{ fontFamily: selected.fontFamily }}
                        className="input-field">
                        {FONT_FAMILIES.map((f) => (
                          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase">Size</span>
                        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                          <button onClick={() => updateEl(selected.id, { fontSize: Math.max(8, (selected.fontSize || 16) - 2) })}
                            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer text-sm">−</button>
                          <input type="number" value={selected.fontSize}
                            onChange={(e) => updateEl(selected.id, { fontSize: parseInt(e.target.value) || 16 })}
                            className="flex-1 min-w-0 bg-transparent text-white text-[11px] text-center focus:outline-none" />
                          <button onClick={() => updateEl(selected.id, { fontSize: (selected.fontSize || 16) + 2 })}
                            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer text-sm">+</button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase">Weight</span>
                        <select value={selected.fontWeight}
                          onChange={(e) => updateEl(selected.id, { fontWeight: e.target.value })}
                          className="input-field">
                          <option value="300">Light</option>
                          <option value="400">Regular</option>
                          <option value="600">Semi Bold</option>
                          <option value="700">Bold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>
                    </div>

                    {/* Style toggles */}
                    <div className="flex gap-1">
                      {/* Italic */}
                      <button title="Italic"
                        onClick={() => updateEl(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}
                        className={`w-8 h-8 text-xs font-black italic rounded-lg cursor-pointer transition border ${
                          selected.fontStyle === "italic"
                            ? "bg-teal-600 border-teal-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}>I</button>
                      {/* Underline */}
                      <button title="Underline"
                        onClick={() => updateEl(selected.id, { textDecoration: selected.textDecoration === "underline" ? "none" : "underline" })}
                        className={`w-8 h-8 text-xs font-black underline rounded-lg cursor-pointer transition border ${
                          selected.textDecoration === "underline"
                            ? "bg-teal-600 border-teal-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}>U</button>
                      {/* Alignment */}
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a}
                          onClick={() => updateEl(selected.id, { textAlign: a })}
                          className={`flex-1 h-8 flex items-center justify-center rounded-lg cursor-pointer transition border ${
                            selected.textAlign === a
                              ? "bg-teal-600 border-teal-500 text-white"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                          }`}>
                          {a === "left" ? <FiAlignLeft className="w-3 h-3" />
                            : a === "center" ? <FiAlignCenter className="w-3 h-3" />
                            : <FiAlignRight className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>

                    {/* Text Color */}
                    <div className="flex flex-col gap-1">
                      <span className="label-xs">Text Color</span>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={selected.color || "#ffffff"}
                          onChange={(e) => updateEl(selected.id, { color: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border border-slate-600 bg-transparent shrink-0" />
                        <input type="text" value={selected.color}
                          onChange={(e) => updateEl(selected.id, { color: e.target.value })}
                          className="input-field flex-1" />
                      </div>
                    </div>

                    {/* Line Height */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="label-xs">Line Height</span>
                        <span className="text-[8px] text-slate-400">{selected.lineHeight}×</span>
                      </div>
                      <input type="range" min={1} max={3} step={0.1}
                        value={selected.lineHeight}
                        onChange={(e) => updateEl(selected.id, { lineHeight: parseFloat(e.target.value) })}
                        className="w-full accent-teal-500 h-1 cursor-pointer" />
                    </div>
                  </div>
                )}

                {/* ── Image Frame Properties ── */}
                {selected.type === "image" && (
                  <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-3">
                    <label className="elem-btn cursor-pointer">
                      <FiUpload className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {selected.imageUrl ? "Replace Image" : "Upload Image"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleImageUpload(e, selected.id)} />
                    </label>
                    {selected.imageUrl && (
                      <>
                        <img src={selected.imageUrl} className="w-full h-16 object-cover rounded-lg border border-slate-700" alt="" />
                        <button onClick={() => updateEl(selected.id, { imageUrl: "" })}
                          className="text-[9px] font-black text-rose-400 hover:underline text-left">Clear image</button>
                      </>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="label-xs">Object Fit</span>
                      <select value={selected.objectFit}
                        onChange={(e) => updateEl(selected.id, { objectFit: e.target.value as any })}
                        className="input-field">
                        <option value="cover">Cover (fill frame)</option>
                        <option value="contain">Contain (fit inside)</option>
                        <option value="fill">Fill (stretch)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="label-xs">Border Radius</span>
                        <span className="text-[8px] text-slate-400">{selected.borderRadius}px</span>
                      </div>
                      <input type="range" min={0}
                        max={Math.floor(Math.min(selected.width, selected.height) / 2)} step={1}
                        value={selected.borderRadius || 0}
                        onChange={(e) => updateEl(selected.id, { borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-teal-500 h-1 cursor-pointer" />
                    </div>
                  </div>
                )}

                {/* ── Shape Properties ── */}
                {selected.type === "rect" && (
                  <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="label-xs">Fill Color</span>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={selected.fillColor || "#0d9488"}
                          onChange={(e) => updateEl(selected.id, { fillColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border border-slate-600 bg-transparent shrink-0" />
                        <input type="text" value={selected.fillColor || "#0d9488"}
                          onChange={(e) => updateEl(selected.id, { fillColor: e.target.value })}
                          className="input-field flex-1" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="label-xs">Border Radius</span>
                        <span className="text-[8px] text-slate-400">{selected.borderRadius || 0}px</span>
                      </div>
                      <input type="range" min={0}
                        max={Math.floor(Math.min(selected.width, selected.height) / 2)} step={1}
                        value={selected.borderRadius || 0}
                        onChange={(e) => updateEl(selected.id, { borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-teal-500 h-1 cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase">Stroke Color</span>
                        <input type="color" value={selected.strokeColor || "#ffffff"}
                          onChange={(e) => updateEl(selected.id, { strokeColor: e.target.value })}
                          className="w-full h-8 rounded-lg cursor-pointer p-0.5 border border-slate-600 bg-transparent" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-extrabold text-slate-500 uppercase">Stroke Width</span>
                        <input type="number" min={0} max={20}
                          value={selected.strokeWidth || 0}
                          onChange={(e) => updateEl(selected.id, { strokeWidth: parseInt(e.target.value) || 0 })}
                          className="input-field" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5 text-center">
              <FiLayers className="w-8 h-8 text-slate-700" />
              <p className="text-[10px] font-semibold text-slate-600 leading-relaxed">
                Click any element on the canvas to edit its properties here
              </p>
              <p className="text-[9px] text-slate-700 font-semibold">
                Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">Del</kbd> to delete selected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Utility CSS classes injected via style tag */}
      <style>{`
        .label-xs { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
        .input-field { background: #1e293b; border: 1px solid #334155; color: white; font-size: 11px; padding: 6px 8px; border-radius: 8px; width: 100%; outline: none; font-weight: 600; }
        .input-field:focus { border-color: #14b8a6; }
        .elem-btn { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; color: white; font-size: 12px; font-weight: 700; border-radius: 12px; cursor: pointer; transition: all 0.15s; width: 100%; }
        .elem-btn:hover { background: #263245; border-color: #475569; }
      `}</style>
    </div>
  );
}
