import { useState } from "react";
import { MetroLine, CAPACITY_PER_COACH, METRO_LINES } from "@/data/delhiMetro";
import { ArrowLeft, MapPin, Train, ChevronRight, Star, Activity, CreditCard, Ticket, Navigation } from "lucide-react";
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

const LineDetail = ({ line, onBack, cardBalance, onDeductFare }: Props) => {
  const [mode, setMode] = useState<Mode>("stations");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [journeyStation, setJourneyStation] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"card" | "token">("card");
  const capacity = CAPACITY_PER_COACH[line.coaches];

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
      <JourneyView
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
          const segmentInfo = segments.length > 1
            ? ` • ${segments.length} lines`
            : "";
          toast.success(`Journey complete! ${journeyStation} → ${to}`, {
            description: `₹${fare} ${paymentType === "card" ? "deducted from Metro Card" : "token used"} • ${stationsTraveled} stations${segmentInfo}`,
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
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">START JOURNEY</h2>
        </div>

        {/* Payment type selection */}
        <div className="mb-6">
          <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-3">PAYMENT METHOD</h3>
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
              <div className="font-display text-sm font-bold text-foreground">Token / Ticket</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">Single journey</div>
            </button>
          </div>
        </div>

        {/* Station selection for boarding */}
        <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-3">SELECT BOARDING STATION</h3>
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
                      toast.error("Insufficient balance!", { description: "Minimum fare is ₹10. Please recharge your Metro Card." });
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
    <div>
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

      {/* Line info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">COACHES</div>
          <div className="font-mono text-lg font-bold text-foreground">{line.coaches}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">CAP/COACH</div>
          <div className="font-mono text-lg font-bold text-foreground">{capacity}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">TOTAL CAP</div>
          <div className="font-mono text-lg font-bold text-foreground">{line.coaches * capacity}</div>
        </div>
      </div>

      {/* Description & Rating */}
      <div className="border rounded-lg p-4 mb-6" style={{ borderColor: line.colorHex + "33", backgroundColor: line.colorHex + "08" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(line.rating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">{line.rating}/5</span>
          <span className="text-xs font-mono text-muted-foreground mx-2">•</span>
          <Activity className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">Rush: {line.rushLevel}/10</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">{line.description}</p>
      </div>

      {/* Journey CTA */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          className="font-mono text-sm flex-1"
          style={{ backgroundColor: line.colorHex }}
          onClick={() => setMode("journey-select")}
        >
          <Navigation className="w-4 h-4 mr-2" /> START JOURNEY
        </Button>
      </div>

      <p className="text-sm font-mono text-muted-foreground mb-4">
        Or select a station to view train sensor & door control:
      </p>

      {/* Station list as vertical route */}
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
