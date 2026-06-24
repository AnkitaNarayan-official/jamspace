# JamSpace

**Live Demo:**https://jamspace-orcin.vercel.app/

JamSpace is a frontend architecture prototype for a collaborative whiteboard application, heavily inspired by modern productivity tools like FigJam and Notion. It was built to explore complex state management, static physics, and collaborative UI patterns within a React ecosystem.

## ⚙️ Core Features

### Workspace & Canvas Mechanics
* **Interactive Sticky Notes:** Create, edit, and seamlessly drag sticky notes across a fluid canvas.
* **Multi-Dimensional Resizing:** Native edge/corner handles to freely scale elements without text distortion.
* **Canvas Zoom & Navigation:** Mouse-wheel and toolbar-driven zoom controls that maintain crisp vector/text rendering at any scale.
* **Persistent State:** Board state (coordinates, text, dimensions) is automatically cached via `localStorage` to survive page refreshes.

### Productivity & UX
* **Command Palette:** Keyboard-driven interface (`Cmd/Ctrl + K`) to execute board actions without breaking workflow.
* **Keyboard Shortcuts:** Built-in global listeners for lightning-fast workflows:
  * `N` — Spawn a new sticky note instantly at the center of the canvas.
  * `T` — Toggle between Light (Pastel Pink) and Dark (Midnight Plum) themes.
  * `Esc` — Safely close the Command Palette or drop focus from text fields.
* **Emoji Reactions:** Quick-action reaction system for notes.
* **Theming:** Full Light/Dark mode support with a custom "Glass Fluid" aesthetic.

### Simulated Collaboration (The Ghost Engine)
* **Presence Simulation:** Renders absolute-positioned SVG cursors mimicking active remote users.
* **Activity Feed:** Real-time simulated logs of user actions (typing, moving, spawning notes).
* **Linear Transitions:** Uses static tween animations for cursor and element movement to ensure predictable, jitter-free performance.

---

## 🛠 Technical Stack

* **Framework:** React 18 (TypeScript)
* **Build Tool:** Vite
* **State Management:** Zustand (w/ persist middleware)
* **Styling:** Tailwind CSS
* **UI Primitives:** Shadcn UI & Radix
* **Animation Physics:** Framer Motion
* **Icons:** Lucide-React

---

## 🏗 Architecture Overview

The application intentionally bypasses the React Context API for core canvas state to prevent global re-renders. Instead, it utilizes **Zustand** as a high-speed, centralized store. 

* **The Brain (`useBoardStore`):** Manages the precise coordinates, dimensions, text values, and theme states of all canvas elements.
* **The Engine (`useMultiplayer`):** A custom React hook running a `setInterval` loop to randomly mutate simulated user coordinates, mapped to the UI via Framer Motion's static tween transitions.
* **UI Layer:** Implements a layered HTML5 `<canvas>` background for performant fluid particles, topped with a `div`-based DOM layer for interactive components.

---

## 📂 Project Structure

```text
src/
├── components/          # UI components (StickyNote, CommandPalette, etc.)
├── hooks/               # Custom React hooks (useMultiplayer, etc.)
├── store/               # Zustand state definitions (useBoardStore.ts)
├── utils/               # Helper functions and class mergers (cn.ts)
├── App.tsx              # Master layout and layer assembly
└── index.css            # Tailwind directives and global CSS
