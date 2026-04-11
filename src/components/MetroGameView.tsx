import { useState, useEffect, useRef, useCallback } from "react";
import { MetroLine } from "@/data/delhiMetro";
import JourneyView from "@/components/JourneyView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface JourneySegment {
  lineId: string;
  lineName: string;
  lineColorHex: string;
  fromStation: string;
  toStation: string;
  stationsTraveled: number;
}

interface Props {
  line: MetroLine;
  boardingStation: string;
  paymentType: "card" | "token";
  cardBalance: number;
  onComplete: (to: string, fare: number, stationsTraveled: number, segments: JourneySegment[]) => void;
  onCancel: () => void;
}

type GamePhase =
  | "entering_station"
  | "at_entry_gate"
  | "tapping_entry"
  | "gate_open_entry"
  | "walking_to_platform"
  | "waiting_for_train"
  | "train_arriving"
  | "train_doors_open"
  | "boarding"
  | "traveling"       // JourneyView takes over
  | "alighting"
  | "walking_to_exit"
  | "at_exit_gate"
  | "tapping_exit"
  | "gate_open_exit"
  | "exiting_station"
  | "complete";

// Wait times per line (seconds)
const TRAIN_WAIT_TIMES: Record<string, number> = {
  blue: 7, yellow: 7, red: 9, green: 9, violet: 10,
  pink: 12, magenta: 9, "airport-express": 15, aqua: 13, grey: 13,
};

const MetroGameView = ({ line, boardingStation, paymentType, cardBalance, onComplete, onCancel }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [phase, setPhase] = useState<GamePhase>("entering_station");
  const [prompt, setPrompt] = useState("");
  const [waitCountdown, setWaitCountdown] = useState(0);

  // Player state
  const playerRef = useRef({ x: 30, y: 0, frame: 0, facingRight: true, walking: false });
  const keysRef = useRef<Set<string>>(new Set());
  const phaseRef = useRef(phase);
  const trainXRef = useRef(900); // train slides in from right
  const gateOpenRef = useRef(0); // gate animation progress 0-1
  const trainDoorsRef = useRef(0); // door open progress 0-1

  // Journey result storage for exit phase
  const [journeyResult, setJourneyResult] = useState<{
    to: string; fare: number; stationsTraveled: number; segments: JourneySegment[];
  } | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Scene layout constants
  const GROUND_Y = 130;
  const GATE_X = 180;
  const PLATFORM_X = 380;
  const TRAIN_STOP_X = 360;
  const EXIT_GATE_X = 180;
  const EXIT_X = 30;
  const SCENE_WIDTH = 550;

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleInteract();
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [phase]);

  const handleInteract = useCallback(() => {
    const p = phaseRef.current;
    if (p === "at_entry_gate") {
      setPhase("tapping_entry");
      setPrompt("Tapping card...");
      setTimeout(() => {
        gateOpenRef.current = 0;
        setPhase("gate_open_entry");
        setPrompt("Gate open! Walk through →");
      }, 1200);
    } else if (p === "train_doors_open") {
      setPhase("boarding");
      setPrompt("Boarding train...");
      setTimeout(() => setPhase("traveling"), 1000);
    } else if (p === "at_exit_gate") {
      setPhase("tapping_exit");
      setPrompt("Tapping card... Fare deducted!");
      setTimeout(() => {
        gateOpenRef.current = 0;
        setPhase("gate_open_exit");
        setPrompt("Gate open! Walk out ←");
      }, 1200);
    }
  }, []);

  // Train wait countdown
  useEffect(() => {
    if (phase === "waiting_for_train") {
      const waitTime = TRAIN_WAIT_TIMES[line.id] || 9;
      setWaitCountdown(waitTime);
      const interval = setInterval(() => {
        setWaitCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            trainXRef.current = 900;
            setPhase("train_arriving");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, line.id]);

  // Train arrival animation
  useEffect(() => {
    if (phase === "train_arriving") {
      const interval = setInterval(() => {
        trainXRef.current -= 8;
        if (trainXRef.current <= TRAIN_STOP_X) {
          trainXRef.current = TRAIN_STOP_X;
          clearInterval(interval);
          trainDoorsRef.current = 0;
          setPhase("train_doors_open");
          setPrompt("Press SPACE to board 🚇");
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Prompts based on phase
  useEffect(() => {
    switch (phase) {
      case "entering_station": setPrompt("Walk to entry gate →"); break;
      case "at_entry_gate": setPrompt("Press SPACE to tap card 🎫"); break;
      case "walking_to_platform": setPrompt("Walk to platform →"); break;
      case "waiting_for_train": setPrompt(`Train arriving in ${waitCountdown}s...`); break;
      case "train_arriving": setPrompt("Train approaching..."); break;
      case "alighting": setPrompt("Walk to exit gate ←"); break;
      case "at_exit_gate": setPrompt("Press SPACE to tap card 🎫"); break;
      case "exiting_station": setPrompt("Walk to exit ←"); break;
    }
  }, [phase, waitCountdown]);

  // Main game loop
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

    let frameCount = 0;

    const draw = () => {
      frameCount++;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const p = playerRef.current;
      const currentPhase = phaseRef.current;

      // Player movement
      const speed = 2;
      let moving = false;
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        p.x += speed;
        p.facingRight = true;
        moving = true;
      }
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        p.x -= speed;
        p.facingRight = false;
        moving = true;
      }
      p.walking = moving;
      if (moving && frameCount % 8 === 0) p.frame = (p.frame + 1) % 4;
      p.y = GROUND_Y;

      // Clamp player position
      p.x = Math.max(10, Math.min(SCENE_WIDTH - 10, p.x));

      // Phase transitions based on position
      if (currentPhase === "entering_station" && p.x >= GATE_X - 20 && p.x <= GATE_X + 20) {
        setPhase("at_entry_gate");
      }
      if (currentPhase === "gate_open_entry") {
        gateOpenRef.current = Math.min(1, gateOpenRef.current + 0.03);
        if (p.x >= GATE_X + 30) {
          setPhase("walking_to_platform");
        }
      }
      if (currentPhase === "walking_to_platform" && p.x >= PLATFORM_X - 10) {
        setPhase("waiting_for_train");
      }
      if (currentPhase === "alighting" || currentPhase === "walking_to_exit") {
        if (p.x <= EXIT_GATE_X + 20 && p.x >= EXIT_GATE_X - 20) {
          setPhase("at_exit_gate");
        }
      }
      if (currentPhase === "gate_open_exit") {
        gateOpenRef.current = Math.min(1, gateOpenRef.current + 0.03);
        if (p.x <= EXIT_X + 20) {
          setPhase("complete");
        }
      }

      // Clear
      ctx.fillStyle = "hsl(220, 20%, 8%)";
      ctx.fillRect(0, 0, w, h);

      // Sky / ceiling
      ctx.fillStyle = "hsl(220, 18%, 12%)";
      ctx.fillRect(0, 0, w, 40);

      // Ceiling lights
      for (let i = 0; i < 6; i++) {
        const lx = 50 + i * 90;
        ctx.fillStyle = "hsl(45, 80%, 70%)";
        ctx.shadowColor = "hsl(45, 80%, 70%)";
        ctx.shadowBlur = 12;
        ctx.fillRect(lx, 38, 20, 3);
        ctx.shadowBlur = 0;
      }

      // Roof support pillars
      ctx.fillStyle = "hsl(220, 15%, 18%)";
      for (let i = 0; i < 4; i++) {
        const px = 80 + i * 130;
        ctx.fillRect(px, 40, 6, GROUND_Y - 40 + 16);
      }

      // Ground / floor tiles (pixel art pattern)
      for (let tx = 0; tx < w; tx += 16) {
        for (let ty = GROUND_Y + 16; ty < h; ty += 16) {
          const shade = ((tx / 16 + ty / 16) % 2 === 0) ? "hsl(220, 12%, 16%)" : "hsl(220, 12%, 14%)";
          ctx.fillStyle = shade;
          ctx.fillRect(tx, ty, 16, 16);
        }
      }

      // Platform edge (yellow line)
      ctx.fillStyle = "hsl(50, 90%, 55%)";
      ctx.fillRect(PLATFORM_X - 40, GROUND_Y + 14, SCENE_WIDTH - PLATFORM_X + 40, 3);

      // Track area
      ctx.fillStyle = "hsl(220, 10%, 10%)";
      ctx.fillRect(PLATFORM_X - 40, GROUND_Y + 17, SCENE_WIDTH - PLATFORM_X + 40, h - GROUND_Y - 17);

      // Rails
      ctx.strokeStyle = "hsl(220, 15%, 28%)";
      ctx.lineWidth = 2;
      const railY = GROUND_Y + 35;
      ctx.beginPath(); ctx.moveTo(PLATFORM_X - 40, railY); ctx.lineTo(w, railY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PLATFORM_X - 40, railY + 6); ctx.lineTo(w, railY + 6); ctx.stroke();

      // Sleepers
      for (let sx = PLATFORM_X - 40; sx < w; sx += 14) {
        ctx.fillStyle = "hsl(25, 30%, 20%)";
        ctx.fillRect(sx, railY - 2, 4, 10);
      }

      // Entry gate
      drawGate(ctx, GATE_X, GROUND_Y, line.colorHex,
        currentPhase === "gate_open_entry" || currentPhase === "walking_to_platform" ||
        currentPhase === "waiting_for_train" || currentPhase === "train_arriving" ||
        currentPhase === "train_doors_open" || currentPhase === "boarding"
          ? gateOpenRef.current : 0,
        "ENTRY"
      );

      // Exit gate (same position but labeled differently in exit phases)
      if (currentPhase === "alighting" || currentPhase === "walking_to_exit" ||
          currentPhase === "at_exit_gate" || currentPhase === "tapping_exit" ||
          currentPhase === "gate_open_exit" || currentPhase === "exiting_station") {
        drawGate(ctx, EXIT_GATE_X, GROUND_Y, line.colorHex,
          currentPhase === "gate_open_exit" || currentPhase === "exiting_station" ? gateOpenRef.current : 0,
          "EXIT"
        );
      }

      // Station sign
      ctx.fillStyle = line.colorHex;
      ctx.fillRect(60, 48, 140, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'Press Start 2P', 'Courier New', monospace";
      ctx.textAlign = "center";
      const stationLabel = boardingStation.length > 16 ? boardingStation.slice(0, 16) + "…" : boardingStation;
      ctx.fillText(stationLabel, 130, 63);
      ctx.textAlign = "left";

      // Line indicator
      ctx.fillStyle = line.colorHex + "44";
      ctx.fillRect(60, 72, 140, 12);
      ctx.fillStyle = line.colorHex;
      ctx.font = "7px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(line.name, 130, 81);
      ctx.textAlign = "left";

      // Train (visible in certain phases)
      if (currentPhase === "train_arriving" || currentPhase === "train_doors_open" ||
          currentPhase === "boarding" || currentPhase === "waiting_for_train") {
        if (currentPhase !== "waiting_for_train") {
          drawTrain(ctx, trainXRef.current, railY - 30, line.colorHex,
            currentPhase === "train_doors_open" || currentPhase === "boarding" ? 1 : 0, line.name);
        }
      }

      // Player character (not visible during traveling phase)
      if (currentPhase !== "traveling" && currentPhase !== "complete") {
        drawPlayer(ctx, p.x, p.y, p.facingRight, p.frame, p.walking, frameCount, line.colorHex);
      }

      // Interaction indicators
      if (currentPhase === "at_entry_gate" || currentPhase === "train_doors_open" || currentPhase === "at_exit_gate") {
        const indicatorX = p.x;
        const indicatorY = p.y - 30;
        ctx.fillStyle = "hsl(50, 90%, 60%)";
        ctx.shadowColor = "hsl(50, 90%, 60%)";
        ctx.shadowBlur = 8;
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("SPACE", indicatorX, indicatorY + Math.sin(frameCount / 10) * 2);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
      }

      // Tapping animation
      if (currentPhase === "tapping_entry" || currentPhase === "tapping_exit") {
        const glowIntensity = Math.sin(frameCount / 3) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 255, 150, ${glowIntensity * 0.6})`;
        ctx.shadowColor = "hsl(150, 100%, 50%)";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(currentPhase === "tapping_entry" ? GATE_X : EXIT_GATE_X, GROUND_Y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [line, boardingStation, phase]);

  // Handle journey completion - transition to exit phase
  const handleJourneyComplete = useCallback((to: string, fare: number, stationsTraveled: number, segments: JourneySegment[]) => {
    setJourneyResult({ to, fare, stationsTraveled, segments });
    playerRef.current.x = PLATFORM_X;
    playerRef.current.facingRight = false;
    trainDoorsRef.current = 0;
    gateOpenRef.current = 0;
    setPhase("alighting");
  }, []);

  // Complete callback
  useEffect(() => {
    if (phase === "complete" && journeyResult) {
      onComplete(journeyResult.to, journeyResult.fare, journeyResult.stationsTraveled, journeyResult.segments);
    }
  }, [phase, journeyResult, onComplete]);

  // Show JourneyView during travel phase
  if (phase === "traveling") {
    return (
      <JourneyView
        line={line}
        boardingStation={boardingStation}
        paymentType={paymentType}
        cardBalance={cardBalance}
        onComplete={handleJourneyComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Button size="sm" variant="ghost" onClick={onCancel} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-1" /> EXIT
        </Button>
        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: line.colorHex, boxShadow: `0 0 12px ${line.colorHex}66` }} />
        <div>
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">
            {phase.includes("exit") || phase === "alighting" || phase === "walking_to_exit" ? "EXIT STATION" : "ENTER STATION"}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">{boardingStation} • {line.name}</p>
        </div>
      </div>

      {/* Game canvas */}
      <div className="rounded-lg border border-border bg-card overflow-hidden mb-3">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: 200, imageRendering: "pixelated" }}
        />
      </div>

      {/* Prompt bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 mb-3">
        <span className="text-sm font-mono text-foreground">{prompt}</span>
        {phase === "waiting_for_train" && waitCountdown > 0 && (
          <span className="text-lg font-mono font-bold" style={{ color: line.colorHex }}>{waitCountdown}s</span>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onTouchStart={() => keysRef.current.add("ArrowLeft")}
          onTouchEnd={() => keysRef.current.delete("ArrowLeft")}
          onMouseDown={() => keysRef.current.add("ArrowLeft")}
          onMouseUp={() => keysRef.current.delete("ArrowLeft")}
          className="w-14 h-14 rounded-lg border border-border bg-card flex items-center justify-center text-2xl font-mono text-foreground active:bg-secondary select-none"
        >
          ←
        </button>
        <button
          onClick={() => handleInteract()}
          className="w-20 h-14 rounded-lg border-2 font-mono text-sm font-bold text-foreground active:bg-secondary select-none"
          style={{ borderColor: line.colorHex, backgroundColor: line.colorHex + "22" }}
        >
          ACTION
        </button>
        <button
          onTouchStart={() => keysRef.current.add("ArrowRight")}
          onTouchEnd={() => keysRef.current.delete("ArrowRight")}
          onMouseDown={() => keysRef.current.add("ArrowRight")}
          onMouseUp={() => keysRef.current.delete("ArrowRight")}
          className="w-14 h-14 rounded-lg border border-border bg-card flex items-center justify-center text-2xl font-mono text-foreground active:bg-secondary select-none"
        >
          →
        </button>
      </div>

      {/* Controls legend */}
      <div className="mt-3 text-center text-[10px] font-mono text-muted-foreground">
        Arrow Keys / WASD to move • SPACE to interact
      </div>
    </div>
  );
};

// === Pixel Art Drawing Functions ===

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, frame: number, walking: boolean, tick: number, lineColor: string) {
  ctx.save();
  if (!facingRight) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    x = 0;
  }

  const px = Math.floor(x);
  const py = Math.floor(y);

  // Walk bob
  const bob = walking ? Math.sin(tick / 4) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(px - 5, py + 15, 10, 3);

  // Legs
  const legOffset = walking ? Math.sin(tick / 4) * 3 : 0;
  ctx.fillStyle = "hsl(220, 30%, 25%)"; // dark pants
  ctx.fillRect(px - 3, py + 6 + bob, 3, 8);
  ctx.fillRect(px + 1, py + 6 + bob, 3, 8);

  // Shoes
  ctx.fillStyle = "hsl(220, 20%, 15%)";
  ctx.fillRect(px - 4, py + 13 + bob + legOffset, 4, 2);
  ctx.fillRect(px + 1, py + 13 + bob - legOffset, 4, 2);

  // Body / shirt
  ctx.fillStyle = lineColor;
  ctx.fillRect(px - 5, py - 2 + bob, 11, 9);

  // Head
  ctx.fillStyle = "hsl(30, 50%, 65%)"; // skin
  ctx.fillRect(px - 4, py - 10 + bob, 9, 9);

  // Hair
  ctx.fillStyle = "hsl(20, 30%, 15%)";
  ctx.fillRect(px - 4, py - 11 + bob, 9, 3);

  // Eye
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 2, py - 6 + bob, 2, 2);
  ctx.fillStyle = "#000";
  ctx.fillRect(px + 3, py - 6 + bob, 1, 1);

  // Bag/backpack
  ctx.fillStyle = "hsl(30, 40%, 35%)";
  ctx.fillRect(px - 6, py - 1 + bob, 2, 6);

  ctx.restore();
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number, lineColor: string, openAmount: number, label: string) {
  // Gate machine body
  ctx.fillStyle = "hsl(220, 15%, 22%)";
  ctx.fillRect(x - 15, y - 20, 12, 36);
  ctx.fillRect(x + 3, y - 20, 12, 36);

  // Card reader pad
  ctx.fillStyle = openAmount > 0 ? "hsl(150, 80%, 45%)" : lineColor;
  ctx.shadowColor = openAmount > 0 ? "hsl(150, 80%, 45%)" : lineColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(x - 12, y - 8, 6, 4);
  ctx.shadowBlur = 0;

  // Gate barriers
  const gateWidth = 14;
  const openW = gateWidth * openAmount;
  ctx.fillStyle = "hsl(0, 0%, 50%)";
  if (openAmount < 1) {
    ctx.fillRect(x - 3, y - 5, gateWidth - openW, 3);
  }

  // Status light
  ctx.fillStyle = openAmount > 0 ? "hsl(120, 80%, 50%)" : "hsl(0, 80%, 50%)";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(x, y - 18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = "hsl(215, 15%, 45%)";
  ctx.font = "6px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 24);
  ctx.textAlign = "left";
}

function drawTrain(ctx: CanvasRenderingContext2D, x: number, y: number, lineColor: string, doorsOpen: number, lineName: string) {
  const tw = 160;
  const th = 34;

  // Train body
  ctx.fillStyle = lineColor;
  ctx.shadowColor = lineColor;
  ctx.shadowBlur = 10;
  ctx.fillRect(x, y, tw, th);
  ctx.shadowBlur = 0;

  // Roof line
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x, y, tw, 4);

  // Bottom stripe
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x, y + th - 4, tw, 4);

  // Windows
  ctx.fillStyle = "hsl(200, 30%, 85%)";
  for (let i = 0; i < 8; i++) {
    const wx = x + 10 + i * 18;
    ctx.fillRect(wx, y + 8, 12, 10);
    // Window frame
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wx, y + 8, 12, 10);
  }

  // Doors (2 doors)
  for (let d = 0; d < 2; d++) {
    const dx = x + 45 + d * 60;
    const doorGap = doorsOpen * 6;
    ctx.fillStyle = "hsl(220, 15%, 25%)";
    ctx.fillRect(dx - 6 - doorGap, y + 6, 6, 24);
    ctx.fillRect(dx + doorGap, y + 6, 6, 24);
    if (doorsOpen > 0) {
      // Door opening glow
      ctx.fillStyle = "hsl(50, 80%, 70%)";
      ctx.shadowColor = "hsl(50, 80%, 70%)";
      ctx.shadowBlur = 4;
      ctx.fillRect(dx - doorGap, y + 8, doorGap * 2, 20);
      ctx.shadowBlur = 0;
    }
  }

  // Line name on train
  ctx.fillStyle = "#fff";
  ctx.font = "bold 6px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(lineName.toUpperCase(), x + tw / 2, y + th - 7);
  ctx.textAlign = "left";

  // Wheels
  ctx.fillStyle = "hsl(220, 10%, 20%)";
  for (let i = 0; i < 4; i++) {
    const wx = x + 20 + i * 40;
    ctx.beginPath();
    ctx.arc(wx, y + th + 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default MetroGameView;
