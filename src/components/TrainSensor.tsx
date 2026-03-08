import { useState, useCallback } from "react";
import { MetroLine, CAPACITY_PER_COACH } from "@/data/delhiMetro";
import { ArrowLeft, RotateCcw, Users, DoorOpen, DoorClosed, AlertTriangle, Info, Armchair, Hand, Shuffle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  line: MetroLine;
  stationName: string;
  onBack: () => void;
}

interface Warning {
  coachIndex: number;
  rejected: number;
  timestamp: number;
}

const TrainSensor = ({ line, stationName, onBack }: Props) => {
  const capacity = CAPACITY_PER_COACH[line.coaches];
  const coachCount = line.coaches;
  const [passengers, setPassengers] = useState<number[]>(Array(coachCount).fill(0));
  const [warnings, setWarnings] = useState<Warning[]>([]);

  // Check if current station is an interchange
  const currentStation = line.stations.find((s) => s.name === stationName);
  const isInterchange = currentStation?.interchange && currentStation.interchange.length > 0;
  const interchangeMultiplier = isInterchange ? 1.5 + (currentStation!.interchange!.length * 0.3) : 1;

  const randomBoard = useCallback(() => {
    // Rush-level based boarding: rushLevel 1-10 maps to passenger ranges
    const baseMin = Math.max(2, Math.floor(line.rushLevel * 1.5));
    const baseMax = Math.floor(line.rushLevel * 4);
    const min = Math.floor(baseMin * interchangeMultiplier);
    const max = Math.floor(baseMax * interchangeMultiplier);
    const totalTrying = Math.floor(Math.random() * (max - min + 1)) + min;
    let rejected = 0;
    const rejectedCoaches: number[] = [];

    setPassengers((prev) => {
      const next = [...prev];
      for (let t = 0; t < totalTrying; t++) {
        const coach = Math.floor(Math.random() * coachCount);
        if (next[coach] < capacity) {
          next[coach]++;
        } else {
          rejected++;
          if (!rejectedCoaches.includes(coach)) rejectedCoaches.push(coach);
        }
      }
      return next;
    });

    // Show warnings for rejected passengers
    setTimeout(() => {
      setPassengers((current) => {
        // Recalculate rejected based on actual state
        let actualRejected = 0;
        const newWarnings: Warning[] = [];
        const fullCoaches = current
          .map((c, i) => (c >= capacity ? i : -1))
          .filter((i) => i >= 0);

        if (fullCoaches.length > 0) {
          // Simulate extra people trying to board full coaches
          const extraTrying = Math.floor(Math.random() * 5) + 1;
          fullCoaches.forEach((ci) => {
            const tryCount = Math.floor(Math.random() * extraTrying) + 1;
            actualRejected += tryCount;
            newWarnings.push({ coachIndex: ci, rejected: tryCount, timestamp: Date.now() });
          });
        }

        if (actualRejected > 0 || rejected > 0) {
          const totalRej = rejected + actualRejected;
          toast.error(`⚠️ ${totalRej} passenger${totalRej > 1 ? "s" : ""} denied boarding — coach${rejectedCoaches.length > 1 ? "es" : ""} at capacity!`, {
            description: `Coaches ${[...new Set([...rejectedCoaches, ...fullCoaches])].map((c) => String(c + 1).padStart(2, "0")).join(", ")} have doors locked.`,
            duration: 4000,
          });
          setWarnings((w) => [...newWarnings, ...w].slice(0, 20));
        } else {
          toast.success(`✅ ${totalTrying} passengers boarded successfully`, { duration: 2000 });
        }

        return current;
      });
    }, 100);
  }, [coachCount, capacity, line.rushLevel, interchangeMultiplier]);

  const addPassenger = useCallback(
    (i: number) => {
      setPassengers((p) => {
        if (p[i] >= capacity) {
          toast.error(`⚠️ Coach ${String(i + 1).padStart(2, "0")} is FULL — door locked!`, {
            description: "Passengers must alight before new boarding is allowed.",
            duration: 3000,
          });
          setWarnings((w) => [{ coachIndex: i, rejected: 1, timestamp: Date.now() }, ...w].slice(0, 20));
          return p;
        }
        return p.map((v, idx) => (idx === i ? v + 1 : v));
      });
    },
    [capacity]
  );

  const removePassenger = useCallback((i: number) => {
    setPassengers((p) => p.map((v, idx) => (idx === i ? Math.max(v - 1, 0) : v)));
  }, []);

  const totalPassengers = passengers.reduce((a, b) => a + b, 0);
  const totalCapacity = coachCount * capacity;
  const fullCoaches = passengers.filter((p) => p >= capacity).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button size="sm" variant="ghost" onClick={onBack} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-1" /> BACK
        </Button>
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: line.colorHex, boxShadow: `0 0 12px ${line.colorHex}66` }}
        />
        <div>
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">{stationName.toUpperCase()}</h2>
          <p className="text-xs font-mono text-muted-foreground">{line.name} • Train Sensor • Rush Level {line.rushLevel}/10{isInterchange ? " • ⬥ Interchange" : ""}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-4">
        {[
          { label: "TOTAL LOAD", value: `${totalPassengers} / ${totalCapacity}` },
          { label: "COACHES", value: coachCount },
          { label: "CAP/COACH", value: capacity },
          { label: "FULL COACHES", value: fullCoaches, danger: fullCoaches > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">{s.label}</div>
            <div className={`font-mono text-lg font-bold ${"danger" in s && s.danger ? "text-danger" : "text-foreground"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 border rounded-lg p-4 mb-6" style={{ borderColor: line.colorHex + "33", backgroundColor: line.colorHex + "08" }}>
        <Info className="w-5 h-5 mt-0.5 shrink-0" style={{ color: line.colorHex }} />
        <p className="text-sm font-mono text-muted-foreground leading-relaxed">
          Capacity = <span className="text-foreground">seats + handlebar standing zones</span>.
          Doors <span className="text-danger font-semibold">lock automatically</span> when a coach reaches {capacity} passengers.
          Use <span className="text-foreground font-semibold">Random Board</span> to simulate a crowd arriving at the platform.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" onClick={randomBoard} className="font-mono text-xs">
          <Shuffle className="w-3 h-3 mr-1" /> RANDOM BOARD ({Math.floor(line.rushLevel * 1.5 * interchangeMultiplier)}-{Math.floor(line.rushLevel * 4 * interchangeMultiplier)} pax)
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPassengers(Array(coachCount).fill(0))} className="font-mono text-xs">
          <RotateCcw className="w-3 h-3 mr-1" /> RESET ALL
        </Button>
      </div>

      {/* Warning log */}
      {warnings.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            <span className="text-xs font-display font-bold tracking-wider text-danger">OVERCROWDING WARNINGS</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {warnings.slice(0, 8).map((w, i) => (
              <div key={`${w.timestamp}-${i}`} className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                <span className="text-danger">●</span>
                <span className="text-foreground/70">{new Date(w.timestamp).toLocaleTimeString()}</span>
                Coach {String(w.coachIndex + 1).padStart(2, "0")}: {w.rejected} passenger{w.rejected > 1 ? "s" : ""} denied — door locked
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {passengers.map((count, i) => {
          const fillPercent = Math.min((count / capacity) * 100, 100);
          const isFull = count >= capacity;
          const isNearFull = count >= capacity * 0.85;
          const seats = Math.floor(capacity * 0.55);
          const standing = capacity - seats;

          return (
            <div
              key={i}
              className={`relative rounded-lg border p-4 transition-all duration-500 ${
                isFull
                  ? "border-danger bg-danger/5 shadow-[0_0_20px_hsl(var(--danger)/0.15)]"
                  : isNearFull
                  ? "border-warning bg-warning/5 shadow-[0_0_20px_hsl(var(--warning)/0.1)]"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                  COACH {String(i + 1).padStart(2, "0")}
                </h3>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${isFull ? "text-danger" : "text-success"}`}>
                  {isFull ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />}
                  {isFull ? "LOCKED" : "OPEN"}
                </div>
              </div>

              <div className="relative h-3 rounded-full bg-secondary overflow-hidden mb-3">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${fillPercent}%`,
                    backgroundColor: isFull ? "hsl(var(--danger))" : isNearFull ? "hsl(var(--warning))" : line.colorHex,
                  }}
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-2xl font-bold text-foreground">{count}</span>
                  <span className="text-muted-foreground font-mono text-sm">/ {capacity}</span>
                </div>
                {isFull && (
                  <div className="flex items-center gap-1 text-danger animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-mono font-semibold">FULL</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground mb-4">
                <div className="bg-secondary/50 rounded px-2 py-1 flex items-center gap-1">
                  <Armchair className="w-3 h-3" /> Seats: {seats}
                </div>
                <div className="bg-secondary/50 rounded px-2 py-1 flex items-center gap-1">
                  <Hand className="w-3 h-3" /> Stand: {standing}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 font-mono text-xs" onClick={() => addPassenger(i)}>
                  + Board
                </Button>
                <Button size="sm" variant="outline" className="flex-1 font-mono text-xs" onClick={() => removePassenger(i)} disabled={count === 0}>
                  − Alight
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainSensor;
