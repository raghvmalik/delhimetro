import { useState, useEffect, useRef } from "react";

interface Props {
  onStart: () => void;
}

const GameIntro = ({ onStart }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPress, setShowPress] = useState(true);
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Boot sequence
  useEffect(() => {
    const lines = [
      "> INITIALIZING METRO CONTROL SYSTEM...",
      "> LOADING STATION DATABASE... 256 STATIONS",
      "> CALIBRATING SENSORS... OK",
      "> LOADING FARE MATRIX... OK",
      "> CONNECTING TO TRAIN NETWORK...",
      "> ALL SYSTEMS OPERATIONAL",
      "> WELCOME, OPERATOR.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 600);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  // Blink "PRESS START"
  useEffect(() => {
    const interval = setInterval(() => setShowPress((p) => !p), 600);
    return () => clearInterval(interval);
  }, []);

  // Pixel train animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let trainX = -200;
    let frame = 0;
    const colors = ["#cc3333", "#ffcc00", "#0066cc", "#33aa33", "#9933cc", "#ff69b4", "#cc33cc", "#ff8800", "#00cccc", "#888888"];

    const draw = () => {
      frame++;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = "hsl(220, 20%, 5%)";
      ctx.fillRect(0, 0, w, h);

      // Stars / particles
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + frame * 0.3) % w;
        const sy = (i * 53 + Math.sin(i + frame * 0.01) * 20) % (h * 0.6);
        const brightness = Math.sin(frame * 0.02 + i) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(150, 200, 255, ${brightness * 0.4})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // City skyline silhouette
      const buildings = [
        { x: 0, w: 40, h: 50 }, { x: 45, w: 30, h: 70 }, { x: 80, w: 25, h: 40 },
        { x: 110, w: 50, h: 90 }, { x: 165, w: 35, h: 55 }, { x: 205, w: 45, h: 75 },
        { x: 255, w: 30, h: 45 }, { x: 290, w: 60, h: 85 }, { x: 355, w: 40, h: 60 },
        { x: 400, w: 50, h: 100 }, { x: 455, w: 35, h: 50 }, { x: 495, w: 45, h: 70 },
        { x: 545, w: 30, h: 55 }, { x: 580, w: 55, h: 80 },
      ];
      const skyY = h * 0.55;
      buildings.forEach((b) => {
        ctx.fillStyle = "hsl(220, 20%, 10%)";
        ctx.fillRect(b.x, skyY - b.h, b.w, b.h + 20);
        // Windows
        for (let wy = skyY - b.h + 5; wy < skyY - 5; wy += 8) {
          for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 7) {
            const lit = Math.sin(wx * 3 + wy * 2 + frame * 0.02) > 0.3;
            ctx.fillStyle = lit ? "hsl(45, 80%, 60%)" : "hsl(220, 15%, 14%)";
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      });

      // Ground
      ctx.fillStyle = "hsl(220, 15%, 12%)";
      ctx.fillRect(0, skyY + 10, w, h - skyY);

      // Metro track
      const trackY = skyY + 20;
      ctx.fillStyle = "hsl(220, 10%, 18%)";
      ctx.fillRect(0, trackY, w, 8);
      // Rails
      ctx.strokeStyle = "hsl(220, 15%, 30%)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, trackY + 2); ctx.lineTo(w, trackY + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, trackY + 6); ctx.lineTo(w, trackY + 6); ctx.stroke();

      // Sleepers
      for (let sx = 0; sx < w; sx += 10) {
        ctx.fillStyle = "hsl(25, 25%, 18%)";
        ctx.fillRect(sx, trackY, 3, 8);
      }

      // Elevated pillars
      for (let px = 30; px < w; px += 80) {
        ctx.fillStyle = "hsl(220, 12%, 15%)";
        ctx.fillRect(px, trackY + 8, 6, 30);
      }

      // Animated train
      trainX += 1.5;
      if (trainX > w + 100) trainX = -200;
      const colorIdx = Math.floor(frame / 200) % colors.length;
      const trainColor = colors[colorIdx];

      // Train body
      ctx.fillStyle = trainColor;
      ctx.shadowColor = trainColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(trainX, trackY - 18, 160, 20);
      ctx.shadowBlur = 0;

      // Train roof
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(trainX, trackY - 18, 160, 3);

      // Train windows
      ctx.fillStyle = "hsl(200, 30%, 85%)";
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(trainX + 8 + i * 16, trackY - 14, 10, 8);
      }

      // Train stripe
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(trainX, trackY - 2, 160, 3);

      // Wheels
      ctx.fillStyle = "hsl(220, 10%, 25%)";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(trainX + 20 + i * 40, trackY + 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Headlight
      ctx.fillStyle = "hsl(50, 90%, 75%)";
      ctx.shadowColor = "hsl(50, 90%, 75%)";
      ctx.shadowBlur = 10;
      ctx.fillRect(trainX + 157, trackY - 12, 3, 4);
      ctx.shadowBlur = 0;

      // Scanlines
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      for (let sy = 0; sy < h; sy += 3) {
        ctx.fillRect(0, sy, w, 1);
      }

      requestAnimationFrame(draw);
    };

    const anim = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Listen for any key press
  useEffect(() => {
    if (booting) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [booting, onStart]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {booting ? (
          <div className="max-w-md w-full text-left">
            {bootLines.map((line, i) => (
              <p
                key={i}
                className="font-mono text-xs text-emerald-400 mb-1 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s`, textShadow: "0 0 8px rgba(16, 185, 129, 0.5)" }}
              >
                {line}
              </p>
            ))}
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse mt-1" />
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="mb-2">
              <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground block mb-2"
                style={{ textShadow: "0 0 6px hsl(var(--muted-foreground) / 0.3)" }}>
                — PIXEL TRANSIT STUDIOS PRESENTS —
              </span>
            </div>

            <h1
              className="font-display text-4xl md:text-6xl font-black tracking-wider mb-1"
              style={{
                color: "hsl(170, 80%, 45%)",
                textShadow: "0 0 20px hsl(170, 80%, 45%, 0.4), 0 0 60px hsl(170, 80%, 45%, 0.15)",
              }}
            >
              DELHI METRO
            </h1>
            <h2
              className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] mb-6"
              style={{
                color: "hsl(35, 90%, 55%)",
                textShadow: "0 0 15px hsl(35, 90%, 55%, 0.4)",
              }}
            >
              SIMULATOR
            </h2>

            {/* Tagline */}
            <p className="font-mono text-xs text-muted-foreground mb-8 tracking-wider">
              OPERATE • RIDE • EXPLORE — 10 LINES • 256+ STATIONS
            </p>

            {/* Press Start */}
            <button
              onClick={onStart}
              className="focus:outline-none"
            >
              <span
                className={`font-display text-lg tracking-[0.3em] transition-opacity duration-200 ${showPress ? "opacity-100" : "opacity-0"}`}
                style={{
                  color: "hsl(50, 90%, 65%)",
                  textShadow: "0 0 12px hsl(50, 90%, 65%, 0.5)",
                }}
              >
                ▶ PRESS START ◀
              </span>
            </button>

            {/* Controls hint */}
            <div className="mt-8 flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 rounded border border-border bg-card font-mono text-[10px] text-foreground">←</kbd>
                  <kbd className="px-2 py-1 rounded border border-border bg-card font-mono text-[10px] text-foreground">→</kbd>
                </div>
                <span className="font-mono text-[10px]">MOVE</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded border border-border bg-card font-mono text-[10px] text-foreground">SPACE</kbd>
                <span className="font-mono text-[10px]">ACTION</span>
              </div>
            </div>

            {/* Version */}
            <span className="mt-6 font-mono text-[9px] text-muted-foreground/50 tracking-wider">
              v2.0.0 • © 2026 PIXEL TRANSIT STUDIOS
            </span>
          </>
        )}
      </div>

      {/* CRT overlay effect */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
};

export default GameIntro;
