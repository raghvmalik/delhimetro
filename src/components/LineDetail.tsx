import { useState } from "react";
import { MetroLine, CAPACITY_PER_COACH, METRO_LINES } from "@/data/delhiMetro";
import { ArrowLeft, MapPin, Train, ChevronRight, Star, Activity, CreditCard, Ticket, Navigation, Crosshair, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrainSensor from "@/components/TrainSensor";
import MetroGameView from "@/components/MetroGameView";
import { calculateFare } from "@/hooks/useMetroCard";
import { toast } from "sonner";

interface Props {
  line: MetroLine;
  onBack: () => void;
  cardBalance: number;
  onDeductFare: (trip: { lineId: string; lineName: string; from: string; to: string; fare: number; stationsTraveled: number; type: "card" | "token" }) => void;
}

type Mode = "stations" | "sensor" | "journey-select" | "journey";

const difficultyLabel = (rush: number) => {
  if (rush >= 8) return { text: "HARD", color: "hsl(0, 75%, 55%)" };
  if (rush >= 6) return { text: "MEDIUM", color: "hsl(35, 90%, 55%)" };
  if (rush >= 4) return { text: "NORMAL", color: "hsl(170, 80%, 45%)" };
  return { text: "EASY", color: "hsl(150, 70%, 45%)" };
};

const LineDetail = ({ line, onBack, cardBalance, onDeductFare }: Props) => {
  const [mode, setMode] = useState<Mode>("stations");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [journeyStation, setJourneyStation] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"card" | "token">("card");
  const capacity = CAPACITY_PER_COACH[line.coaches];
  const diff = difficultyLabel(line.rushLevel);

  if (mode === "sensor" && selectedStation) {
    return (
      <TrainSensor
        line={line}
        stationName={selectedStation}
        onBack={() => { setMode("stations"); setSelectedStation(null); }}
      />
    );
  }

  if (mode === "journey" && journeyStation) {
    return (
      <MetroGameView
        line={line}
        boardingStation={journeyStation}
        paymentType={paymentType}
        cardBalance={cardBalance}
        onComplete={(to, fare, stationsTraveled, segments) => {
          onDeductFare({
            lineId: segments.length > 0 ? segments[segments.length - 1].lineId : line.id,
            lineName: segments.map((s) => s.lineName).join(" → "),
            from: journeyStation,
            to,
            fare,
            stationsTraveled,
            type: paymentType,
          });
          const segmentInfo = segments.length > 1 ? ` • ${segments.length} lines` : "";
          toast.success(`Mission complete! ${journeyStation} → ${to}`, {
            description: `₹${fare} ${paymentType === "card" ? "deducted" : "token used"} • ${stationsTraveled} stations${segmentInfo}`,
            duration: 5000,
          });
          setMode("stations");
          setJourneyStation(null);
        }}
        onCancel={() => { setMode("stations"); setJourneyStation(null); }}
      />
    );
  }

  if (mode === "journey-select") {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Button size="sm" variant="ghost" onClick={() => setMode("stations")} className="font-mono">
            <ArrowLeft className="w-4 h-4 mr-1" /> BACK
          </Button>
          <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: line.colorHex, boxShadow: `0 0 12px ${line.colorHex}66` }} />
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">SELECT BOARDING POINT</h2>
        </div>

        {/* Payment type */}
        <div className="mb-6">
          <h3 className="font-display text-xs font-bold tracking-[0.15em] text-muted-foreground mb-3">PAYMENT METHOD</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentType("card")}
              className={`p-4 rounded-lg border text-left transition-all ${
                paymentType === "card"
                  ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <CreditCard className={`w-6 h-6 mb-2 ${paymentType === "card" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="font-display text-sm font-bold text-foreground">Metro Card</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">Balance: ₹{cardBalance}</div>
            </button>
            <button
              onClick={() => setPaymentType("token")}
              className={`p-4 rounded-lg border text-left transition-all ${
                paymentType === "token"
                  ? "border-accent bg-accent/10 shadow-[0_0_12px_hsl(var(--accent)/0.15)]"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <Ticket className={`w-6 h-6 mb-2 ${paymentType === "token" ? "text-accent" : "text-muted-foreground"}`} />
              <div className="font-display text-sm font-bold text-foreground">Token</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">Single journey</div>
            </button>
          </div>
        </div>

        {/* Station list */}
        <h3 className="font-display text-xs font-bold tracking-[0.15em] text-muted-foreground mb-3">SELECT STATION</h3>
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5" style={{ backgroundColor: line.colorHex + "66" }} />
          <div className="space-y-0">
            {line.stations.map((station, i) => {
              const isTerminal = i === 0 || i === line.stations.length - 1;
              return (
                <button
                  key={station.name}
                  onClick={() => {
                    if (paymentType === "card" && cardBalance < 10) {
                      toast.error("Insufficient balance!", { description: "Minimum fare is ₹10. Recharge your Metro Card." });
                      return;
                    }
                    setJourneyStation(station.name);
                    setMode("journey");
                  }}
                  className="relative flex items-center gap-4 w-full text-left py-2 px-2 rounded-lg group hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={`relative z-10 shrink-0 rounded-full border-2 ${isTerminal ? "w-5 h-5" : "w-3 h-3"}`}
                    style={{ borderColor: line.colorHex, backgroundColor: isTerminal ? line.colorHex : "hsl(var(--card))" }}
                  />
                  <span className={`font-mono text-sm flex-1 ${isTerminal ? "font-bold text-foreground" : "text-foreground/80"}`}>
                    {station.name}
                  </span>
                  <Navigation className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button size="sm" variant="ghost" onClick={onBack} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-1" /> BACK
        </Button>
        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: line.colorHex, boxShadow: `0 0 12px ${line.colorHex}66` }} />
        <h2 className="font-display text-xl font-bold tracking-wider text-foreground">
          {line.name.toUpperCase()}
        </h2>
      </div>

      {/* Mission briefing card */}
      <div
        className="rounded-lg border p-5 mb-6 relative overflow-hidden"
        style={{ borderColor: line.colorHex + "44", backgroundColor: line.colorHex + "08" }}
      >
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: line.colorHex }} />

        <div className="flex items-center gap-2 mb-3">
          <Crosshair className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-xs font-bold tracking-[0.15em] text-muted-foreground">MISSION BRIEFING</span>
        </div>

        <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-4">{line.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">STATIONS</div>
              <div className="font-mono text-sm font-bold text-foreground">{line.stations.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Train className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">COACHES</div>
              <div className="font-mono text-sm font-bold text-foreground">{line.coaches}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">CAPACITY</div>
              <div className="font-mono text-sm font-bold text-foreground">{line.coaches * capacity}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">DIFFICULTY</div>
              <div className="font-mono text-sm font-bold" style={{ color: diff.color }}>{diff.text}</div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: line.colorHex + "22" }}>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(line.rating) ? "fill-accent text-accent" : "text-muted-foreground/20"}`} />
            ))}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{line.rating}/5 rider rating</span>
        </div>
      </div>

      {/* Start Mission CTA */}
      <Button
        className="w-full font-display text-sm tracking-wider mb-6 h-12"
        style={{ backgroundColor: line.colorHex, boxShadow: `0 0 20px ${line.colorHex}33` }}
        onClick={() => setMode("journey-select")}
      >
        <Zap className="w-4 h-4 mr-2" /> START MISSION
      </Button>

      <p className="text-[10px] font-mono text-muted-foreground mb-4 tracking-wider">
        OR SELECT A STATION FOR SENSOR VIEW:
      </p>

      {/* Station list as mission waypoints */}
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5" style={{ backgroundColor: line.colorHex + "66" }} />
        <div className="space-y-0">
          {line.stations.map((station, i) => {
            const isTerminal = i === 0 || i === line.stations.length - 1;
            const hasInterchange = station.interchange && station.interchange.length > 0;
            return (
              <button
                key={station.name}
                onClick={() => { setSelectedStation(station.name); setMode("sensor"); }}
                className="relative flex items-center gap-4 w-full text-left py-2 px-2 rounded-lg group hover:bg-secondary/50 transition-colors"
              >
                <div
                  className={`relative z-10 shrink-0 rounded-full border-2 ${isTerminal ? "w-5 h-5" : "w-3 h-3"}`}
                  style={{ borderColor: line.colorHex, backgroundColor: isTerminal ? line.colorHex : "hsl(var(--card))" }}
                />
                <div className="flex-1 min-w-0">
                  <span className={`font-mono text-sm ${isTerminal ? "font-bold text-foreground" : "text-foreground/80"}`}>
                    {station.name}
                  </span>
                  {hasInterchange && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {station.interchange!.map((lid) => {
                        const other = METRO_LINES.find((l) => l.id === lid);
                        return other ? (
                          <div key={lid} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: other.colorHex }} title={other.name} />
                        ) : null;
                      })}
                      <span className="text-[10px] font-mono text-muted-foreground ml-1">interchange</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LineDetail;
