import { useState, useCallback } from "react";
import { MetroLine, CAPACITY_PER_COACH } from "@/data/delhiMetro";
import { ArrowLeft, RotateCcw, Users, DoorOpen, DoorClosed, AlertTriangle, Info, Armchair, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  line: MetroLine;
  stationName: string;
  onBack: () => void;
}

const TrainSensor = ({ line, stationName, onBack }: Props) => {
  const capacity = CAPACITY_PER_COACH[line.coaches];
  const coachCount = line.coaches;
  const [passengers, setPassengers] = useState<number[]>(Array(coachCount).fill(0));

  const addPassenger = useCallback(
    (i: number) => {
      setPassengers((p) => p.map((v, idx) => (idx === i ? Math.min(v + 1, capacity) : v)));
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
          <p className="text-xs font-mono text-muted-foreground">{line.name} • Train Sensor</p>
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
          Passengers must alight to free space.
        </p>
      </div>

      {/* Reset */}
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="outline" onClick={() => setPassengers(Array(coachCount).fill(0))} className="font-mono text-xs">
          <RotateCcw className="w-3 h-3 mr-1" /> RESET ALL
        </Button>
      </div>

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
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${isFull ? "text-danger" : "text-success"}`}
                >
                  {isFull ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />}
                  {isFull ? "LOCKED" : "OPEN"}
                </div>
              </div>

              {/* Bar */}
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
                <Button size="sm" variant="outline" className="flex-1 font-mono text-xs" onClick={() => addPassenger(i)} disabled={isFull}>
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
