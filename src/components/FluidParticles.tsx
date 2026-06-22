import { useEffect, useRef } from "react";

type ThemeMode = "light" | "dark";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  drift: number;
};

type FluidParticlesProps = {
  theme: ThemeMode;
};

export function FluidParticles({ theme }: FluidParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particles: Particle[] = [];
    const size = { width: 0, height: 0, dpr: Math.max(window.devicePixelRatio || 1, 1) };
    const pointer = { x: 0, y: 0, active: false, burst: 0 };

    const palette =
      theme === "light"
        ? {
            base: "rgba(255,255,255,0.9)",
            wash: "rgba(255, 197, 211, 0.18)",
            accent: "rgba(255, 71, 133, 0.92)",
            backdrop: "rgba(255, 197, 211, 0.22)",
          }
        : {
            base: "rgba(168, 139, 255, 0.66)",
            wash: "rgba(26, 16, 37, 0.22)",
            accent: "rgba(6, 182, 212, 0.9)",
            backdrop: "rgba(26, 16, 37, 0.42)",
          };

    const resize = () => {
      size.width = window.innerWidth;
      size.height = window.innerHeight;
      size.dpr = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(size.width * size.dpr);
      canvas.height = Math.floor(size.height * size.dpr);
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);

      if (particles.length === 0) {
        const count = Math.min(136, Math.max(84, Math.round((size.width * size.height) / 24000)));
        for (let index = 0; index < count; index += 1) {
          particles.push({
            x: Math.random() * size.width,
            y: Math.random() * size.height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: 1.4 + Math.random() * 2.8,
            drift: 0.004 + Math.random() * 0.01,
          });
        }
      }
    };

    const seedBurst = (x: number, y: number) => {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.burst = 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      seedBurst(event.clientX, event.clientY);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerup", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    resize();

    let animationFrame = 0;
    let tick = 0;

    const render = () => {
      tick += 1;
      context.fillStyle = palette.backdrop;
      context.fillRect(0, 0, size.width, size.height);

      const targetX = pointer.active ? pointer.x : size.width * 0.5;
      const targetY = pointer.active ? pointer.y : size.height * 0.5;
      const attraction = pointer.active ? 0.012 : 0.0025;
      const burstStrength = pointer.burst > 0 ? 1 + pointer.burst * 0.75 : 1;

      for (const particle of particles) {
        const dx = targetX - particle.x;
        const dy = targetY - particle.y;
        const distance = Math.max(Math.hypot(dx, dy), 0.001);
        const radius = 160 + particle.radius * 24;
        const force = Math.max(0, 1 - distance / radius) * attraction * burstStrength;

        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;

        particle.vx += Math.sin((tick + particle.drift * 1000) * particle.drift) * 0.0018;
        particle.vy += Math.cos((tick + particle.drift * 1000) * particle.drift) * 0.0014;

        particle.vx *= 0.984;
        particle.vy *= 0.984;

        particle.x += particle.vx * 60;
        particle.y += particle.vy * 60;

        if (particle.x < -40) particle.x = size.width + 40;
        if (particle.x > size.width + 40) particle.x = -40;
        if (particle.y < -40) particle.y = size.height + 40;
        if (particle.y > size.height + 40) particle.y = -40;

        const hoverMix = pointer.active ? Math.max(0, 1 - distance / 220) : 0;
        const fill = pointer.active
          ? `rgba(255, 71, 133, ${0.08 + hoverMix * 0.55})`
          : theme === "light"
            ? `rgba(255,255,255,${0.12 + hoverMix * 0.25})`
            : `rgba(168, 139, 255,${0.08 + hoverMix * 0.25})`;

        context.beginPath();
        context.fillStyle = fill;
        context.arc(particle.x, particle.y, particle.radius + hoverMix * 5, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.fillStyle = pointer.active ? palette.accent : palette.base;
        context.globalAlpha = 0.16 + hoverMix * 0.24;
        context.arc(particle.x + 1.2, particle.y + 0.8, particle.radius * 0.5, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      }

      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = palette.wash;
      context.lineWidth = 1;
      for (let x = 0; x < size.width; x += 56) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, size.height);
        context.stroke();
      }
      for (let y = 0; y < size.height; y += 56) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(size.width, y);
        context.stroke();
      }
      context.restore();

      if (pointer.burst > 0) {
        pointer.burst = Math.max(0, pointer.burst - 0.018);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerup", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
