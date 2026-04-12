import { METRO_LINES, CAPACITY_PER_COACH } from "@/data/delhiMetro";
import { Train, MapPin, Users, Star, Activity, Zap, ChevronRight } from "lucide-react";

interface Props {
  onSelectLine: (lineId: string) => void;
}

const difficultyLabel = (rush: number) => {
  if (rush >= 8) return { text: "HARD", color: "hsl(0, 75%, 55%)" };
  if (rush >= 6) return { text: "MEDIUM", color: "hsl(35, 90%, 55%)" };
  if (rush >= 4) return { text: "NORMAL", color: "hsl(170, 80%, 45%)" };
  return { text: "EASY", color: "hsl(150, 70%, 45%)" };
};

const MetroDashboard = ({ onSelectLine }: Props) => {
  const totalStations = METRO_LINES.reduce((sum, l) => sum + l.stations.length, 0);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-accent" />
        <h2 className="font-display text-lg font-bold tracking-[0.15em] text-foreground">
          SELECT LINE
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
          {METRO_LINES.length} LINES • {totalStations} STATIONS
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: "LINES", value: METRO_LINES.length, icon: Train },
          { label: "STATIONS", value: totalStations, icon: MapPin },
          { label: "6C CAP", value: CAPACITY_PER_COACH[6], icon: Users },
          { label: "8C CAP", value: CAPACITY_PER_COACH[8], icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2">
            <s.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-[9px] font-mono text-muted-foreground tracking-widest">{s.label}</div>
              <div className="font-mono text-sm font-bold text-foreground">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Line cards as level select tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {METRO_LINES.map((line, idx) => {
          const diff = difficultyLabel(line.rushLevel);
          return (
            <button
              key={line.id}
              onClick={() => onSelectLine(line.id)}
              className="group relative bg-card border border-border rounded-lg p-4 text-left transition-all hover:border-foreground/30 hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Glow accent at top */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: line.colorHex }}
              />

              {/* Level number */}
              <div className="absolute top-2 right-3 font-display text-[10px] font-bold tracking-wider text-muted-foreground/40">
                #{String(idx + 1).padStart(2, "0")}
              </div>

              {/* Line info */}
              <div className="flex items-center gap-2.5 mb-2 mt-1">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: line.colorHex, boxShadow: `0 0 10px ${line.colorHex}55` }}
                />
                <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                  {line.name.toUpperCase()}
                </h3>
              </div>

              {/* Stars & Difficulty */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 ${i < Math.floor(line.rating) ? "fill-accent text-accent" : "text-muted-foreground/20"}`}
                    />
                  ))}
                  <span className="text-[9px] font-mono text-muted-foreground ml-1">{line.rating}</span>
                </div>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ color: diff.color, backgroundColor: diff.color + "18" }}
                >
                  {diff.text}
                </span>
              </div>

              {/* Route */}
              <div className="text-[10px] font-mono text-muted-foreground truncate mb-2">
                {line.stations[0].name} → {line.stations[line.stations.length - 1].name}
              </div>

              {/* Bottom stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {line.stations.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Train className="w-2.5 h-2.5" /> {line.coaches}C
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" /> {line.rushLevel}/10
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MetroDashboard;
