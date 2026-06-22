import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useDragControls } from "framer-motion";
import { Minus, Plus, Trash2, MoreVertical } from "lucide-react";
import type { Note } from "@/store/useBoardStore";

export type CollapseMode = "pill" | "fold";

type StickyNoteProps = {
  note: Note;
  zoomScale: number;
  collapseMode: CollapseMode;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onTextChange: (id: string, text: string) => void;
  onToggleMinimize: (id: string) => void;
  onDelete: (id: string) => void;
};

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MIN_SIZE = { width: 184, height: 132 };
const COLLAPSED_PILL = { width: 160, height: 50 };
const COLLAPSED_FOLD = { width: 72, height: 160 };

function directionCursor(direction: ResizeDirection) {
  switch (direction) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
  }
}

export function StickyNote({
  note,
  zoomScale,
  collapseMode,
  onMove,
  onResize,
  onTextChange,
  onToggleMinimize,
  onDelete,
}: StickyNoteProps) {
  const dragControls = useDragControls();
  const resizeState = useRef<{
    active: boolean;
    direction: ResizeDirection | null;
    pointerId: number | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
  }>({
    active: false,
    direction: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  });
  const [collapseMotion, setCollapseMotion] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCollapseMotion(true);
    const timeout = window.setTimeout(() => setCollapseMotion(false), 180);
    return () => window.clearTimeout(timeout);
  }, [note.isMinimized]);

  const collapsedSize = collapseMode === "pill" ? COLLAPSED_PILL : COLLAPSED_FOLD;
  const isCollapsed = note.isMinimized;

  const shellStyle = useMemo(() => {
    const width = isCollapsed ? collapsedSize.width : note.width;
    const height = isCollapsed ? collapsedSize.height : note.height;
    return { width, height };
  }, [collapsedSize.height, collapsedSize.width, isCollapsed, note.height, note.width]);

  const updateResize = (clientX: number, clientY: number) => {
    const session = resizeState.current;
    if (!session.active || !session.direction) return;

    const deltaX = (clientX - session.startX) / zoomScale;
    const deltaY = (clientY - session.startY) / zoomScale;

    let nextWidth = session.startWidth;
    let nextHeight = session.startHeight;
    let nextLeft = session.startLeft;
    let nextTop = session.startTop;

    if (session.direction.includes("e")) {
      nextWidth = session.startWidth + deltaX;
    }
    if (session.direction.includes("s")) {
      nextHeight = session.startHeight + deltaY;
    }
    if (session.direction.includes("w")) {
      nextWidth = session.startWidth - deltaX;
      nextLeft = session.startLeft + deltaX;
    }
    if (session.direction.includes("n")) {
      nextHeight = session.startHeight - deltaY;
      nextTop = session.startTop + deltaY;
    }

    if (nextWidth < MIN_SIZE.width) {
      if (session.direction.includes("w")) {
        nextLeft -= MIN_SIZE.width - nextWidth;
      }
      nextWidth = MIN_SIZE.width;
    }

    if (nextHeight < MIN_SIZE.height) {
      if (session.direction.includes("n")) {
        nextTop -= MIN_SIZE.height - nextHeight;
      }
      nextHeight = MIN_SIZE.height;
    }

    onResize(note.id, nextWidth, nextHeight);
    onMove(note.id, nextLeft, nextTop);
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      updateResize(event.clientX, event.clientY);
    };

    const endResize = () => {
      const session = resizeState.current;
      if (!session.active) return;
      session.active = false;
      session.direction = null;
      session.pointerId = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endResize);
    window.addEventListener("pointercancel", endResize);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endResize);
      window.removeEventListener("pointercancel", endResize);
    };
  }, [note.id, note.x, note.y, onMove, onResize, zoomScale]);

  const startResize = (direction: ResizeDirection) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeState.current = {
      active: true,
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: note.width,
      startHeight: note.height,
      startLeft: note.x,
      startTop: note.y,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = directionCursor(direction);
  };

  const startDrag = (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    dragControls.start(event);
  };

  const previewText = note.text.trim().split(/\s+/).slice(0, 2).join(" ") || "Open note";

  const noteChrome = `linear-gradient(145deg, rgba(255,255,255,0.52), rgba(255,255,255,0.1)), ${note.color}`;

  return (
    <motion.div
      className={`absolute ${collapseMotion ? "transition-[width,height,opacity,transform] duration-150 ease-linear" : ""}`}
      style={{ left: note.x, top: note.y, zIndex: note.isMinimized ? 24 : 14, ...shellStyle }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0, ease: "easeOut" }}
      drag
      dragConstraints={{ left: 0, top: 0, right: 2500, bottom: 1800 }}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        const newX = Math.max(
          -300,
        Math.min(1200, note.x + info.offset.x / zoomScale)
      );

        const newY = Math.max(
          -200,
          Math.min(700, note.y + info.offset.y / zoomScale)
        );
        console.log("X:", newX,"Y:", newY,"Zoom:", zoomScale);
        onMove(note.id, newX, newY);
    }}
      onPointerDown={isCollapsed ? startDrag : undefined}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-3xl border border-white/45 shadow-[0_24px_70px_rgba(16,24,40,0.22),inset_0_1px_0_rgba(255,255,255,0.42)]"
        style={{ background: noteChrome, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), 0 22px 60px rgba(15,23,42,0.25)" }}
      >
        {!isCollapsed ? (
          <>
            <div
              className="flex h-10 cursor-grab select-none items-center justify-between px-3 active:cursor-grabbing"
              onPointerDown={startDrag}
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-900/60">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900/35" />
                Sticky
              </div>
              <div className="flex items-center gap-0.5">
                {/*Minus button*/}
                {/*Delete button*/}
                {/* Three dots button */}
              </div>

              <button
                type="button"
                aria-label={collapseMode === "pill" ? "Minimize note" : "Fold note"}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/35 text-slate-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_rgba(15,23,42,0.16)] transition-colors duration-200 ease-out hover:bg-white/55"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMinimize(note.id);
                }}
              >
                <Minus className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Delete note"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/35 text-slate-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_rgba(15,23,42,0.16)] transition-colors duration-200 ease-out hover:text-red-500"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                
              </button>
              <div className="relative">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/35 text-slate-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_rgba(15,23,42,0.16)]"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen((prev) => !prev);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-10 top-0 z-50 flex rounded-xl bg-white p-2 shadow-xl gap-1"
                    >
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      🤩
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      👻
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      🚀
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      ❤️
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      🤙
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100">
                      🥸
                    </button>
                  </div>
            )}
            </div>
            </div>

            <div className="flex h-[calc(100%-40px)] flex-col px-3 pb-3">
              <textarea
                value={note.text}
                onChange={(event) => onTextChange(note.id, event.target.value)}
                placeholder="Type a thought..."
                className="h-full w-full resize-none border-none bg-transparent text-[15px] leading-6 text-slate-950 outline-none placeholder:text-slate-900/38"
                spellCheck={false}
                data-note-input="true"
                onPointerDown={(event) => event.stopPropagation()}
              />
            </div>

            {!note.isMinimized && (
              <div className="pointer-events-none absolute inset-0">
                {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeDirection[]).map((direction) => {
                  const positionClass =
                    direction === "n"
                      ? "left-1/2 top-0 h-2.5 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"
                      : direction === "s"
                        ? "bottom-0 left-1/2 h-2.5 w-10 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"
                        : direction === "e"
                          ? "right-0 top-1/2 h-10 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
                          : direction === "w"
                            ? "left-0 top-1/2 h-10 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
                            : direction === "ne"
                              ? "right-0 top-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
                              : direction === "nw"
                                ? "left-0 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"
                                : direction === "se"
                                  ? "bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"
                                  : "bottom-0 left-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize";

                  return (
                    <button
                      key={direction}
                      type="button"
                      aria-label={`Resize note ${direction}`}
                      className={`pointer-events-auto absolute ${positionClass}`}
                      onPointerDown={startResize(direction)}
                    >
                      <span className="block h-full w-full rounded-full bg-white/35 opacity-0 transition-opacity duration-150 ease-linear hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : collapseMode === "pill" ? (
          <div className="flex h-full cursor-grab items-center justify-between gap-3 px-4 py-3 active:cursor-grabbing" onPointerDown={startDrag}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-slate-900/45 shadow-[0_0_0_4px_rgba(255,255,255,0.18)]" />
              <span className="truncate text-sm font-medium text-slate-950/88">{previewText}</span>
            </div>
            <button
              type="button"
              aria-label="Expand note"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/35 text-slate-900/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_rgba(15,23,42,0.16)] transition-colors duration-150 ease-linear hover:bg-white/55"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMinimize(note.id);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="flex h-full cursor-grab flex-col justify-between px-2 py-3 active:cursor-grabbing" onPointerDown={startDrag}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-28 w-full items-center justify-center rounded-[18px] bg-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                <div className="-rotate-90 whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.32em] text-slate-950/78">
                  {previewText}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Expand note"
              className="grid h-8 w-8 place-items-center self-end rounded-full bg-white/35 text-slate-900/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_rgba(15,23,42,0.16)] transition-colors duration-150 ease-linear hover:bg-white/55"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMinimize(note.id);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
