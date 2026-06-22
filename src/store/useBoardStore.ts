import { create } from "zustand";
import { persist } from "zustand/middleware";
export type Note = {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  reactions?: Record<string, number>;
};

export type User = {
  id: string;
  name: string;
  cursorX: number;
  cursorY: number;
  color: string;
};

type ActivityState = {
  id: string;
  userId: string;
  message: string;
};

type BoardState = {
  notes: Note[];
  users: User[];
  zoomScale: number;
  activity: ActivityState | null;
  addNote: (color: string, position?: { x: number; y: number }) => void;
  updateNotePosition: (id: string, x: number, y: number) => void;
  updateNoteDimensions: (id: string, width: number, height: number) => void;
  updateNoteText: (id: string, text: string) => void;
  toggleMinimizeNote: (id: string) => void;
  updateUserCursor: (id: string, cursorX: number, cursorY: number) => void;
  setZoomScale: (zoomScale: number) => void;
  
  setActivity: (activity: ActivityState | null) => void;
  deleteNote: (id: string) => void;
  addReaction: (id: string, emoji: string) => void;
  clearNotes: () => void;
};

const starterNotes: Note[] = [
  {
    id: "note-1",
    text: "JamSpace is live. Drag the header, resize from any edge, and edit in place.",
    color: "#FFF2A8",
    x: 132,
    y: 126,
    width: 290,
    height: 210,
    isMinimized: false,
    reactions: {},
  },
  {
    id: "note-2",
    text: "Use the bottom dock to spawn new sticky notes and change the collapse style.",
    color: "#C7F2FF",
    x: 480,
    y: 220,
    width: 300,
    height: 196,
    isMinimized: false,
    reactions: {},
  },
];

const starterUsers: User[] = [
  { id: "user-1", name: "Kriti", cursorX: 220, cursorY: 420, color: "#ec4899" },
  { id: "user-2", name: "Aditya", cursorX: 720, cursorY: 180, color: "#14b8a6" },
  { id: "user-3", name: "Darsh", cursorX: 980, cursorY: 520, color: "#8b5cf6" },
];

export const DEFAULT_NOTE_SIZE = { width: 280, height: 200 };

export const useBoardStore = create<BoardState>()(persist((set) => ({
  notes: starterNotes,
  users: starterUsers,
  zoomScale: 1,
  activity: null,
  addNote: (color, position) =>
    set((state) => {
      const id = `note-${Date.now()}-${state.notes.length + 1}`;
      return {
        notes: [
          ...state.notes,
          {
            id,
            text: "",
            color,
            x: position?.x ?? 120,
            y: position?.y ?? 120,
            width: DEFAULT_NOTE_SIZE.width,
            height: DEFAULT_NOTE_SIZE.height,
            isMinimized: false,
            reactions: {},
          },
        ],
      };
    }),
  updateNotePosition: (id, x, y) =>
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, x: Math.max(-300, Math.min(x, 300)), y: Math.max(-200, Math.min(y, 200)) } : note)),
    })),
  updateNoteDimensions: (id, width, height) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, width: Math.max(0, Math.min(width, 3000)), height: Math.max(0, Math.min(height, 2000)) } : note,
      ),
    })),
  updateNoteText: (id, text) =>
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, text } : note)),
    })),
  toggleMinimizeNote: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, isMinimized: !note.isMinimized } : note,
      ),
    })),
  updateUserCursor: (id, cursorX, cursorY) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id ? { ...user, cursorX, cursorY } : user,
      ),
    })),
  setZoomScale: (zoomScale) => set({ zoomScale }),
  setActivity: (activity) => set({ activity }),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    })),
  addReaction: (id, emoji) =>
    set((state) => ({
      notes: state.notes.map((note) => 
        note.id === id
          ? {
              ...note,
              reactions: {
                ...note.reactions,
                [emoji]: ((note.reactions || {})[emoji] || 0) + 1,
              },
            }
          : note,
      ),
    })),
  clearNotes: () => set({ notes: [], activity: null }),
}),
{ name: "jamspace-board" ,

  partialize: (state) => ({ notes: state.notes, zoomScale: state.zoomScale }),
}));