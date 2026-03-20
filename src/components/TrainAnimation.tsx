import { useEffect, useRef } from "react";
import { MetroLine } from "@/data/delhiMetro";

interface Props {
  line: MetroLine;
  currentStationIndex: number;
  isMoving: boolean;
  direction: "forward" | "backward";
}

const TrainAnimation = ({ line, currentStationIndex, isMoving, direction }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const trainOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);

  const totalStations = line.stations.length;
  const stationSpacing = 100 / Math.max(totalStations - 1, 1);

  useEffect(() => {
    targetOffsetRef.current = currentStationIndex * stationSpacing;
  }, [currentStationIndex, stationSpacing]);

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

    const lineColor = line.colorHex;

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const trackY = h * 0.55;
      const trackLeft = 24;
      const trackRight = w - 24;
      const trackWidth = trackRight - trackLeft;

      // Lerp train position
      const diff = targetOffsetRef.current - trainOffsetRef.current;
      trainOffsetRef.current += diff * 0.06;

      const trainPercent = trainOffsetRef.current / 100;
      const trainX = trackLeft + trainPercent * trackWidth;

      // Draw track bed (sleepers)
      const sleeperCount = Math.floor(trackWidth / 12);
      for (let i = 0; i <= sleeperCount; i++) {
        const sx = trackLeft + (i / sleeperCount) * trackWidth;
        ctx.fillStyle = "hsl(220, 15%, 18%)";
        ctx.fillRect(sx - 1.5, trackY - 3, 3, 10);
      }

      // Draw rails
      ctx.strokeStyle = "hsl(220, 15%, 28%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trackLeft, trackY);
      ctx.lineTo(trackRight, trackY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(trackLeft, trackY + 4);
      ctx.lineTo(trackRight, trackY + 4);
      ctx.stroke();

      // Draw stations
      for (let i = 0; i < totalStations; i++) {
        const sx = trackLeft + (i / Math.max(totalStations - 1, 1)) * trackWidth;
        const isTerminal = i === 0 || i === totalStations - 1;
        const hasInterchange = line.stations[i].interchange && line.stations[i].interchange!.length > 0;
        const r = isTerminal ? 5 : hasInterchange ? 4 : 3;

        // Station marker
        ctx.beginPath();
        ctx.arc(sx, trackY + 2, r, 0, Math.PI * 2);
        if (i === currentStationIndex) {
          ctx.fillStyle = lineColor;
          ctx.fill();
          // Glow
          ctx.shadowColor = lineColor;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "hsl(220, 18%, 11%)";
          ctx.fill();
          ctx.strokeStyle = lineColor + "88";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Station label (only terminals + current + interchange)
        if (isTerminal || i === currentStationIndex || hasInterchange) {
          ctx.save();
          ctx.font = `${i === currentStationIndex ? "bold " : ""}9px 'JetBrains Mono', monospace`;
          ctx.fillStyle = i === currentStationIndex ? lineColor : "hsl(215, 15%, 50%)";
          ctx.textAlign = "center";

          const label = line.stations[i].name;
          const maxChars = 12;
          const displayLabel = label.length > maxChars ? label.slice(0, maxChars) + "…" : label;

          // Alternate labels above/below to avoid overlap
          const labelY = (i % 2 === 0) ? trackY - 16 : trackY + 24;
          ctx.fillText(displayLabel, sx, labelY);
          ctx.restore();
        }
      }

      // Draw train
      const tw = 40;
      const th = 18;
      const ty = trackY - th - 4;
      const tx = trainX - tw / 2;

      // Train body
      ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = isMoving ? 16 : 8;

      // Rounded rect body
      const br = 4;
      ctx.beginPath();
      ctx.moveTo(tx + br, ty);
      ctx.lineTo(tx + tw - br, ty);
      ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + br);
      ctx.lineTo(tx + tw, ty + th - br);
      ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - br, ty + th);
      ctx.lineTo(tx + br, ty + th);
      ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - br);
      ctx.lineTo(tx, ty + br);
      ctx.quadraticCurveTo(tx, ty, tx + br, ty);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Windows
      ctx.fillStyle = "hsl(220, 20%, 7%)";
      const winW = 6;
      const winH = 6;
      const winY = ty + 4;
      for (let i = 0; i < 4; i++) {
        const wx = tx + 5 + i * 8.5;
        ctx.fillRect(wx, winY, winW, winH);
      }

      // Front light
      const frontX = direction === "forward" ? tx + tw - 3 : tx + 3;
      if (isMoving) {
        ctx.fillStyle = "hsl(50, 100%, 75%)";
        ctx.shadowColor = "hsl(50, 100%, 75%)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(frontX, ty + th - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Speed lines when moving
      if (isMoving) {
        ctx.strokeStyle = lineColor + "33";
        ctx.lineWidth = 1;
        const lineDir = direction === "forward" ? -1 : 1;
        const time = Date.now() / 100;
        for (let i = 0; i < 5; i++) {
          const lx = trainX + lineDir * (30 + ((time + i * 17) % 40));
          const ly = ty + 3 + i * 3.5;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + lineDir * 14, ly);
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [line, totalStations, currentStationIndex, isMoving, direction]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 80 }}
      />
    </div>
  );
};

export default TrainAnimation;
