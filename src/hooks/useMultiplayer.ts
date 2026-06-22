import { useEffect, useRef } from "react";
import { useBoardStore } from "@/store/useBoardStore";

type Viewport = {
  width: number;
  height: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function screenToBoard(screenX: number, screenY: number, zoomScale: number, viewport: Viewport) {
  const offsetX = (viewport.width - viewport.width * zoomScale) / 2;
  const offsetY = (viewport.height - viewport.height * zoomScale) / 2;
  return {
    x: (screenX - offsetX) / zoomScale,
    y: (screenY - offsetY) / zoomScale,
  };
}

export function useMultiplayer(viewport: Viewport) {
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    const tick = () => {
      const state = useBoardStore.getState();
      const { zoomScale, users, notes } = state;

      const activeUser = users[Math.floor(Math.random() * users.length)];
      if (!activeUser) return;

      const noteSnippet =
        notes.length > 0
          ? notes[Math.floor(Math.random() * notes.length)]?.text.trim().split(/\s+/).slice(0, 3).join(" ") || "a note"
          : "a fresh board";

      const simulationType = Math.random();
      const activityMessage =
        simulationType < 0.34
          ? `${activeUser.name} is typing in ${noteSnippet}`
          : simulationType < 0.67
            ? `${activeUser.name} nudged a sticky note`
            : `${activeUser.name} is reviewing ${noteSnippet}`;

      const nextUserTargets = users.map((user) => {
        const targetScreenX = randomBetween(viewport.width * 0.12, viewport.width * 0.88);
        const targetScreenY = randomBetween(viewport.height * 0.12, viewport.height * 0.84);
        return {
          id: user.id,
          ...screenToBoard(targetScreenX, targetScreenY, zoomScale, viewport),
        };
      });

      for (const target of nextUserTargets) {
        state.updateUserCursor(target.id, target.x, target.y);
      }

      state.setActivity({
        id: `activity-${Date.now()}`,
        userId: activeUser.id,
        message: activityMessage,
      });

      if (clearTimer.current) {
        window.clearTimeout(clearTimer.current);
      }
      clearTimer.current = window.setTimeout(() => {
        const latest = useBoardStore.getState();
        if (latest.activity?.userId === activeUser.id) {
          latest.setActivity(null);
        }
      }, 1400);
    };

    tick();
    const interval = window.setInterval(tick, 3000);

    return () => {
      window.clearInterval(interval);
      if (clearTimer.current) {
        window.clearTimeout(clearTimer.current);
      }
    };
  }, [viewport.height, viewport.width]);
}
