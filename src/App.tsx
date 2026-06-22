import { useEffect, useMemo, useState, type CSSProperties, type WheelEvent as ReactWheelEvent } from "react";
import * as Avatar from "@radix-ui/react-avatar";
import * as Switch from "@radix-ui/react-switch";
import { AnimatePresence, motion } from "framer-motion";
import { Eraser, MoonStar, Plus, SunMedium, ZoomIn, ZoomOut } from "lucide-react";
import { FluidParticles } from "@/components/FluidParticles";
import { StickyNote, type CollapseMode } from "@/components/StickyNote";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import {
  DEFAULT_NOTE_SIZE,
  useBoardStore,
  type User,
} from "@/store/useBoardStore";

type ThemeMode = "light" | "dark";

const palette = ["#FFF2A8", "#BDEBFF", "#FFC5D3", "#C6F6D5", "#E9C5FF"];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function GhostCursor({ user, zoomScale }: { user: User; zoomScale: number }) {
  const cursorStyle: CSSProperties = {
    left: user.cursorX,
    top: user.cursorY,
    transitionProperty: "left, top",
    transitionDuration: `${Math.max(1800, 3200 / zoomScale)}ms`,
    transitionTimingFunction: "linear",
  };

  return (
    <div className="pointer-events-none absolute z-20" style={cursorStyle}>
      <div className="relative -translate-x-1 -translate-y-1">
        <svg
          className="drop-shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
          width="22"
          height="24"
          viewBox="0 0 22 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 2.5L17.4 18.2L12.1 18.8L15.8 22L13.6 24L10 20.7L8.1 25L2 2.5Z" fill={user.color} />
          <path d="M2 2.5L17.4 18.2L12.1 18.8L15.8 22L13.6 24L10 20.7L8.1 25L2 2.5Z" fill="white" fillOpacity="0.18" />
        </svg>

        <div
          className="absolute left-5 top-0 rounded-full border border-white/35 px-2.5 py-1 text-[11px] font-medium text-white shadow-[0_10px_26px_rgba(15,23,42,0.18)]"
          style={{ backgroundColor: user.color }}
        >
          {user.name}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar.Root className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/40 shadow-[0_8px_18px_rgba(15,23,42,0.14)]">
      <Avatar.Fallback
        className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white"
        style={{ backgroundColor: user.color }}
        delayMs={0}
      >
        {initials(user.name)}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [collapseMode, setCollapseMode] = useState<CollapseMode>("pill");
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const notes = useBoardStore((state) => state.notes);
  const users = useBoardStore((state) => state.users);
  const zoomScale = useBoardStore((state) => state.zoomScale);
  const deleteNote = useBoardStore((state) => state.deleteNote);
  const activity = useBoardStore((state) => state.activity);

  const addNote = useBoardStore((state) => state.addNote);
  const clearNotes = useBoardStore((state) => state.clearNotes);
  const setZoomScale = useBoardStore((state) => state.setZoomScale);
  const updateNotePosition = useBoardStore((state) => state.updateNotePosition);
  const updateNoteDimensions = useBoardStore((state) => state.updateNoteDimensions);
  const updateNoteText = useBoardStore((state) => state.updateNoteText);
  const toggleMinimizeNote = useBoardStore((state) => state.toggleMinimizeNote);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.body.style.backgroundColor = theme === "light" ? "#FFC5D3" : "#1A1025";
    document.body.style.color = theme === "light" ? "#0f172a" : "#f8fafc";
  }, [theme]);

  useMultiplayer(viewport);

  const boardStyle = useMemo<CSSProperties>(() => {
    const offsetX = (viewport.width - viewport.width * zoomScale) / 2;
    const offsetY = (viewport.height - viewport.height * zoomScale) / 2;

    return {
      width: viewport.width,
      height: viewport.height,
      transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoomScale})`,
      transformOrigin: "0 0",
    };
  }, [viewport.height, viewport.width, zoomScale]);

  const overlayStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundImage:
        theme === "light"
          ? "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.54) 1px, transparent 0)"
          : "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
      backgroundSize: "28px 28px",
      backgroundPosition: "-1px -1px",
    };
  }, [theme]);

  const backgroundClass = theme === "light" ? "bg-[#FFC5D3]" : "bg-[#1A1025]";
  const overlayClass = theme === "light" ? "bg-white/20" : "bg-black/20";
  const navGlass = theme === "light" ? "bg-white/20 border-white/45" : "bg-black/20 border-white/10";

  const spawnNote = (color: string) => {
    addNote(color, {
      x: viewport.width / 2 - DEFAULT_NOTE_SIZE.width / 2,
      y: viewport.height / 2 - DEFAULT_NOTE_SIZE.height / 2,
    });
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-note-input="true"], [data-board-ui="true"]')) {
      return;
    }

    // event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = clamp(zoomScale + direction * 0.08, 0.65, 1.9);
    setZoomScale(nextZoom);
  };

  const changeZoom = (direction: 1 | -1) => {
    setZoomScale(clamp(zoomScale + direction * 0.08, 0.65, 1.9));
  };

  const activityUser = activity ? users.find((user) => user.id === activity.userId) ?? null : null;

  return (
    <div
      className={`relative min-h-screen w-screen overflow-hidden ${backgroundClass}`}
      onWheel={handleWheel}
    >
      <FluidParticles theme={theme} />

      <div className={`fixed inset-0 z-10 ${overlayClass}`} style={overlayStyle} />

      <div className="relative z-20 h-screen w-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={boardStyle}>
            <AnimatePresence>
              {notes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  zoomScale={zoomScale}
                  collapseMode={collapseMode}
                  onMove={updateNotePosition}
                  onResize={updateNoteDimensions}
                  onTextChange={updateNoteText}
                  onToggleMinimize={toggleMinimizeNote}
                  onDelete={deleteNote}
                />
              ))}
            </AnimatePresence>

            {users.map((user) => (
              <GhostCursor key={user.id} user={user} zoomScale={zoomScale} />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "linear" }}
        data-board-ui="true"
        className={`fixed right-5 top-5 z-40 flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-2xl ${navGlass} shadow-[0_16px_42px_rgba(15,23,42,0.16)]`}
      >
        <div className="flex items-center gap-2 rounded-full bg-white/30 px-3 py-1.5 text-[12px] font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {Math.round(zoomScale * 100)}%
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <SunMedium className={`h-4 w-4 ${theme === "light" ? "text-slate-900" : "text-white/40"}`} />
          <Switch.Root
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            className="relative h-6 w-11 rounded-full border border-white/35 bg-white/50 shadow-[inset_0_2px_6px_rgba(15,23,42,0.14)] outline-none data-[state=checked]:bg-cyan-500/30"
            aria-label="Toggle theme"
          >
            <Switch.Thumb
              className="block h-5 w-5 rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.18)] transition-transform duration-150"
              style={{ transform: theme === "dark" ? "translateX(22px)" : "translateX(2px)" }}
            />
          </Switch.Root>
          <MoonStar className={`h-4 w-4 ${theme === "dark" ? "text-cyan-200" : "text-slate-900/40"}`} />
        </div>

        <div className="flex items-center gap-1.5">
          {users.map((user) => (
            <UserAvatar key={user.id} user={user} />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {activity && activityUser && (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed right-5 top-[88px] z-40 rounded-full border px-4 py-2 text-[12px] font-medium backdrop-blur-2xl ${navGlass} shadow-[0_16px_42px_rgba(15,23,42,0.12)]`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activityUser.color }} />
              {activity.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "linear" }}
        data-board-ui="true"
        className={`fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-[999px] border px-3 py-2 backdrop-blur-2xl ${navGlass} shadow-[0_22px_60px_rgba(15,23,42,0.22)]`}
      >
        <div className="flex items-center gap-1.5 rounded-full bg-black/5 p-1 shadow-[inset_0_2px_8px_rgba(15,23,42,0.12)]">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              aria-label="Add sticky note"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_22px_rgba(15,23,42,0.16)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
              style={{ backgroundColor: color }}
              onClick={() => spawnNote(color)}
            >
              <Plus className="h-4 w-4 text-slate-950/70" strokeWidth={2.6} />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Clear board"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/25 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(15,23,42,0.16)] transition-colors duration-200 ease-out hover:bg-white/35"
          onClick={() => clearNotes()}
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="mx-1 h-9 w-px bg-white/30" />

        <button
          type="button"
          aria-label="Zoom out"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/25 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(15,23,42,0.16)] transition-colors duration-200 ease-out hover:bg-white/35"
          onClick={() => changeZoom(-1)}
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <div className="min-w-[72px] rounded-full bg-white/25 px-3 py-2 text-center text-[12px] font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          {Math.round(zoomScale * 100)}%
        </div>

        <button
          type="button"
          aria-label="Zoom in"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/25 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(15,23,42,0.16)] transition-colors duration-200 ease-out hover:bg-white/35"
          onClick={() => changeZoom(1)}
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="mx-1 h-9 w-px bg-white/30" />

        <div className="flex items-center gap-1 rounded-full bg-white/20 p-1 shadow-[inset_0_2px_8px_rgba(15,23,42,0.12)]">
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-[12px] font-semibold transition-colors duration-150 ease-linear ${collapseMode === "pill" ? "bg-white/75 text-slate-950" : "text-slate-900/60 hover:text-slate-900"}`}
            onClick={() => setCollapseMode("pill")}
          >
            Pill
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-[12px] font-semibold transition-colors duration-150 ease-linear ${collapseMode === "fold" ? "bg-white/75 text-slate-950" : "text-slate-900/60 hover:text-slate-900"}`}
            onClick={() => setCollapseMode("fold")}
          >
            Fold
          </button>
        </div>
      </motion.div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
        <div className="max-w-xl rounded-full border border-white/25 bg-white/20 px-4 py-2 text-center text-[12px] font-medium text-slate-900/75 backdrop-blur-md shadow-[0_12px_36px_rgba(15,23,42,0.12)]">
          Mouse wheel zooms the board. Drag note headers to move, use the corner buttons to collapse, and resize from any edge.
        </div>
      </div>
    </div>
  );
}
