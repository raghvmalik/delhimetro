import { useState, useEffect, useRef, useCallback } from "react";
import { MetroLine } from "@/data/delhiMetro";
import { calculateFare } from "@/hooks/useMetroCard";
import { ArrowLeft, Train, MapPin, IndianRupee, CreditCard, Ticket, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  line: MetroLine;
  boardingStation: string;
  paymentType: "card" | "token";
  cardBalance: number;
  onComplete: (to: string, fare: number, stationsTraveled: number) => void;
  onCancel: () => void;
}

type JourneyState = "boarding" | "traveling" | "arrived";

const TRAVEL_SPEED_MS = 1800; // ms per station

const JourneyView = ({ line, boardingStation, paymentType, cardBalance, onComplete, onCancel }: Props) => {
  const boardingIndex = line.stations.findIndex((s) => s.name === boardingStation);
  const [currentStationIndex, setCurrentStationIndex] = useState(boardingIndex);
  const [journeyState, setJourneyState] = useState<JourneyState>("boarding");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isMoving, setIsMoving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stationsTraveled = Math.abs(currentStationIndex - boardingIndex);
  const currentFare = calculateFare(stationsTraveled);
  const canAfford = paymentType === "token" || cardBalance >= currentFare;

  // Auto-scroll to current station
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-station-index="${currentStationIndex}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStationIndex]);

  const stopTrain = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMoving(false);
    setJourneyState("arrived");
  }, []);

  const startTrain = useCallback(() => {
    if (isMoving) return;
    setJourneyState("traveling");
    setIsMoving(true);

    intervalRef.current = setInterval(() => {
      setCurrentStationIndex((prev) => {
        const next = direction === "forward" ? prev + 1 : prev - 1;
        if (next < 0 || next >= line.stations.length) {
          // Reached terminal, stop
          setTimeout(stopTrain, 0);
          return prev;
        }
        return next;
      });
    }, TRAVEL_SPEED_MS);
  }, [direction, isMoving, line.stations.length, stopTrain]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleAlight = () => {
    if (stationsTraveled === 0) {
      toast.error("You haven't traveled anywhere yet!");
      return;
    }
    if (!canAfford) {
      toast.error("Insufficient balance!", { description: `Fare: ₹${currentFare}, Balance: ₹${cardBalance}` });
      return;
    }
    stopTrain();
    onComplete(line.stations[currentStationIndex].name, currentFare, stationsTraveled);
  };

  const handleCancel = () => {
    stopTrain();
    onCancel();
  };

  const currentStation = line.stations[currentStationIndex];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" variant="ghost" onClick={handleCancel} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-1" /> EXIT
        </Button>
        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: line.colorHex, boxShadow: `0 0 12px ${line.colorHex}66` }} />
        <div>
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">JOURNEY MODE</h2>
          <p className="text-xs font-mono text-muted-foreground">{line.name} • {paymentType === "card" ? "Metro Card" : "Token"}</p>
        </div>
      </div>

      {/* Journey info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">FROM</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">{boardingStation}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">CURRENT</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">{currentStation.name}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">STATIONS</div>
          <div className="font-mono text-lg font-bold text-foreground">{stationsTraveled}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">FARE</div>
          <div className={`font-mono text-lg font-bold flex items-center gap-1 ${canAfford ? "text-foreground" : "text-danger"}`}>
            <IndianRupee className="w-4 h-4" />{currentFare}
          </div>
        </div>
      </div>

      {/* Payment info */}
      {paymentType === "card" && (
        <div className={`flex items-center gap-3 border rounded-lg p-3 mb-4 ${canAfford ? "border-border bg-card" : "border-danger/50 bg-danger/5"}`}>
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-xs font-mono text-muted-foreground">Card Balance: </span>
            <span className="text-sm font-mono font-bold text-foreground">₹{cardBalance}</span>
          </div>
          {!canAfford && (
            <div className="flex items-center gap-1 text-danger text-xs font-mono">
              <AlertCircle className="w-3 h-3" /> LOW BALANCE
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {!isMoving && journeyState !== "traveling" && (
          <>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={direction === "forward" ? "default" : "outline"}
                className="font-mono text-xs"
                onClick={() => setDirection("forward")}
                disabled={currentStationIndex >= line.stations.length - 1}
              >
                → {line.stations[line.stations.length - 1].name}
              </Button>
              <Button
                size="sm"
                variant={direction === "backward" ? "default" : "outline"}
                className="font-mono text-xs"
                onClick={() => setDirection("backward")}
                disabled={currentStationIndex <= 0}
              >
                ← {line.stations[0].name}
              </Button>
            </div>
            <Button size="sm" className="font-mono text-xs" onClick={startTrain}
              style={{ backgroundColor: line.colorHex }}
            >
              <Train className="w-3 h-3 mr-1" /> DEPART
            </Button>
          </>
        )}
        {isMoving && (
          <Button size="sm" variant="destructive" className="font-mono text-xs" onClick={stopTrain}>
            ◼ STOP AT NEXT
          </Button>
        )}
        {stationsTraveled > 0 && !isMoving && (
          <Button size="sm" className="font-mono text-xs bg-success hover:bg-success/90 text-primary-foreground" onClick={handleAlight}>
            <ChevronDown className="w-3 h-3 mr-1" /> ALIGHT HERE (₹{currentFare})
          </Button>
        )}
      </div>

      {/* Train animation / route view */}
      <div ref={scrollRef} className="relative max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-card p-4">
        {/* Vertical track */}
        <div className="absolute left-[23px] top-4 bottom-4 w-0.5" style={{ backgroundColor: line.colorHex + "44" }} />

        <div className="space-y-0">
          {line.stations.map((station, i) => {
            const isCurrent = i === currentStationIndex;
            const isBoarding = i === boardingIndex;
            const isPassed = (direction === "forward" && i >= boardingIndex && i < currentStationIndex) ||
                             (direction === "backward" && i <= boardingIndex && i > currentStationIndex);
            const isTerminal = i === 0 || i === line.stations.length - 1;

            return (
              <div
                key={station.name}
                data-station-index={i}
                className={`relative flex items-center gap-4 py-2 px-2 rounded-lg transition-all duration-500 ${
                  isCurrent ? "bg-secondary/80" : ""
                }`}
              >
                {/* Station marker */}
                <div className="relative z-10 flex items-center justify-center" style={{ width: 20 }}>
                  {isCurrent ? (
                    <div className="relative">
                      <div
                        className="w-5 h-5 rounded-full animate-pulse"
                        style={{ backgroundColor: line.colorHex, boxShadow: `0 0 16px ${line.colorHex}88` }}
                      />
                      <Train className="w-3 h-3 text-primary-foreground absolute top-1 left-1" />
                    </div>
                  ) : (
                    <div
                      className={`rounded-full border-2 transition-all duration-300 ${isTerminal ? "w-4 h-4" : "w-2.5 h-2.5"}`}
                      style={{
                        borderColor: isPassed || isBoarding ? line.colorHex : line.colorHex + "66",
                        backgroundColor: isBoarding ? line.colorHex : isPassed ? line.colorHex + "44" : "transparent",
                      }}
                    />
                  )}
                </div>

                {/* Station info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm transition-colors duration-300 ${
                      isCurrent ? "font-bold text-foreground" :
                      isBoarding ? "font-semibold text-foreground" :
                      isPassed ? "text-muted-foreground" :
                      "text-foreground/60"
                    }`}>
                      {station.name}
                    </span>
                    {isBoarding && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-success/20 text-success font-bold">
                        BOARDED
                      </span>
                    )}
                    {isCurrent && !isBoarding && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold" style={{
                        backgroundColor: line.colorHex + "22",
                        color: line.colorHex,
                      }}>
                        {isMoving ? "PASSING" : "STOPPED"}
                      </span>
                    )}
                  </div>
                  {station.interchange && station.interchange.length > 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      ⬥ Interchange available
                    </div>
                  )}
                </div>

                {/* Distance indicator */}
                {isCurrent && stationsTraveled > 0 && (
                  <div className="text-xs font-mono text-muted-foreground">
                    {stationsTraveled} stn
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Moving indicator */}
      {isMoving && (
        <div className="mt-4 flex items-center justify-center gap-3 py-3 rounded-lg border border-border bg-card">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: line.colorHex, animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: line.colorHex, animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: line.colorHex, animationDelay: "300ms" }} />
          </div>
          <span className="text-sm font-mono text-muted-foreground">Train in motion...</span>
        </div>
      )}
    </div>
  );
};

export default JourneyView;
