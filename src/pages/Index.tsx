import { useState, useCallback } from "react";
import { Train, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoachCard from "@/components/CoachCard";

type CoachConfig = 6 | 8;

const CAPACITY: Record<CoachConfig, number> = { 6: 35, 8: 50 };

const Index = () => {
  const [coachCount, setCoachCount] = useState<CoachConfig>(6);
  const capacity = CAPACITY[coachCount];
  const [passengers, setPassengers] = useState<number[]>(() => Array(coachCount).fill(0));

  const switchConfig = (count: CoachConfig) => {
    setCoachCount(count);
    setPassengers(Array(count).fill(0));
  };

  const addPassenger = useCallback((i: number) => {
    setPassengers(p => p.map((v, idx) => idx === i ? Math.min(v + 1, capacity) : v));
  }, [capacity]);

  const removePassenger = useCallback((i: number) => {
    setPassengers(p => p.map((v, idx) => idx === i ? Math.max(v - 1, 0) : v));
  }, []);

  const totalPassengers = passengers.reduce((a, b) => a + b, 0);
  const totalCapacity = coachCount * capacity;
  const fullCoaches = passengers.filter(p => p >= capacity).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Train className="w-8 h-8 text-primary" />
              <h1 className="font-display text-2xl md:text-3xl font-black tracking-wider text-foreground">
                METRO SENSOR
              </h1>
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              Real-time passenger load monitoring & door control
            </p>
          </div>

          {/* Config toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground mr-1">COACHES:</span>
            {([6, 8] as CoachConfig[]).map(n => (
              <Button
                key={n}
                size="sm"
                variant={coachCount === n ? "default" : "outline"}
                className="font-mono text-sm min-w-[48px]"
                onClick={() => switchConfig(n)}
              >
                {n}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="ml-2" onClick={() => setPassengers(Array(coachCount).fill(0))}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "TOTAL", value: `${totalPassengers} / ${totalCapacity}` },
            { label: "COACHES", value: coachCount },
            { label: "CAP/COACH", value: `${capacity} (seats + standing)` },
            { label: "FULL", value: fullCoaches, danger: fullCoaches > 0 },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">{s.label}</div>
              <div className={`font-mono text-lg font-bold ${(s as any).danger ? "text-danger" : "text-foreground"}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm font-mono text-muted-foreground leading-relaxed">
            Capacity = <span className="text-foreground">seats + handlebar standing zones</span>. 
            When a coach reaches capacity, the <span className="text-danger font-semibold">door locks automatically</span> until 
            passengers alight. {coachCount === 6 ? "6-coach config: 35/coach." : "8-coach config: 50/coach."}
          </p>
        </div>

        {/* Coach grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {passengers.map((count, i) => (
            <CoachCard
              key={i}
              coachNumber={i + 1}
              capacity={capacity}
              passengerCount={count}
              onAddPassenger={() => addPassenger(i)}
              onRemovePassenger={() => removePassenger(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
