import { METRO_LINES, CAPACITY_PER_COACH } from "@/data/delhiMetro";
import { Train, MapPin, Users, Star, Activity } from "lucide-react";

interface Props {
  onSelectLine: (lineId: string) => void;
}

const MetroDashboard = ({ onSelectLine }: Props) => {
  const totalStations = METRO_LINES.reduce((sum, l) => sum + l.stations.length, 0);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.3;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < full ? "fill-warning text-warning" : i === full && hasHalf ? "fill-warning/50 text-warning" : "text-muted-foreground/30"}`}
          />
        ))}
        <span className="text-[10px] font-mono text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  const rushLabel = (level: number) => {
    if (level >= 8) return "Very High";
    if (level >= 6) return "High";
    if (level >= 4) return "Moderate";
    return "Low";
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "LINES", value: METRO_LINES.length },
          { label: "TOTAL STATIONS", value: totalStations },
          { label: "6-COACH CAP", value: `${CAPACITY_PER_COACH[6]}/coach` },
          { label: "8-COACH CAP", value: `${CAPACITY_PER_COACH[8]}/coach` },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">{s.label}</div>
            <div className="font-mono text-lg font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Line cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRO_LINES.map((line) => (
          <button
            key={line.id}
            onClick={() => onSelectLine(line.id)}
            className="group bg-card border border-border rounded-lg p-5 text-left transition-all hover:border-foreground/30 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
          >
            {/* Color strip */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: line.colorHex, boxShadow: `0 0 10px ${line.colorHex}55` }}
              />
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                {line.name.toUpperCase()}
              </h3>
            </div>

            {/* Rating */}
            <div className="mb-2">{renderStars(line.rating)}</div>

            {/* Description */}
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed mb-3 line-clamp-2">
              {line.description}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {line.stations.length} stn
              </span>
              <span className="flex items-center gap-1">
                <Train className="w-3 h-3" /> {line.coaches}c
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {CAPACITY_PER_COACH[line.coaches]}/c
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" /> {rushLabel(line.rushLevel)}
              </span>
            </div>

            <div className="text-xs font-mono text-muted-foreground truncate">
              {line.stations[0].name} → {line.stations[line.stations.length - 1].name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MetroDashboard;
