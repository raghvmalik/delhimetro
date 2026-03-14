import { useState, useEffect, useRef, useCallback } from "react";
import { MetroLine, METRO_LINES } from "@/data/delhiMetro";
import { calculateFare } from "@/hooks/useMetroCard";
import { ArrowLeft, Train, IndianRupee, CreditCard, ChevronDown, AlertCircle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type JourneyState = "boarding" | "traveling" | "arrived" | "interchange-select";

const TRAVEL_SPEED_MS = 1800;

const JourneyView = ({ line: initialLine, boardingStation, paymentType, cardBalance, onComplete, onCancel }: Props) => {
  const [currentLine, setCurrentLine] = useState<MetroLine>(initialLine);
  const [currentStationIndex, setCurrentStationIndex] = useState(
    initialLine.stations.findIndex((s) => s.name === boardingStation)
  );
  const [journeyState, setJourneyState] = useState<JourneyState>("boarding");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isMoving, setIsMoving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track all segments of the journey (for interchange)
  const [segments, setSegments] = useState<JourneySegment[]>([]);
  const [segmentBoardingIndex, setSegmentBoardingIndex] = useState(
    initialLine.stations.findIndex((s) => s.name === boardingStation)
  );
  const [originStation] = useState(boardingStation);

  // Total stations across all segments
  const currentSegmentStations = Math.abs(currentStationIndex - segmentBoardingIndex);
  const totalStationsTraveled = segments.reduce((sum, s) => sum + s.stationsTraveled, 0) + currentSegmentStations;
  const currentFare = calculateFare(totalStationsTraveled);
  const canAfford = paymentType === "token" || cardBalance >= currentFare;

  const currentStation = currentLine.stations[currentStationIndex];
  const hasInterchange = currentStation?.interchange && currentStation.interchange.length > 0;

  // Available interchange lines at current station
  const interchangeLines = hasInterchange
    ? currentStation.interchange!
        .map((id) => METRO_LINES.find((l) => l.id === id))
        .filter((l): l is MetroLine => !!l && l.id !== currentLine.id)
    : [];

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
        if (next < 0 || next >= currentLine.stations.length) {
          setTimeout(stopTrain, 0);
          return prev;
        }
        return next;
      });
    }, TRAVEL_SPEED_MS);
  }, [direction, isMoving, currentLine.stations.length, stopTrain]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleAlight = () => {
    if (totalStationsTraveled === 0) {
      toast.error("You haven't traveled anywhere yet!");
      return;
    }
    if (!canAfford) {
      toast.error("Insufficient balance!", { description: `Fare: ₹${currentFare}, Balance: ₹${cardBalance}` });
      return;
    }
    stopTrain();

    // Build final segments including current
    const finalSegments: JourneySegment[] = [
      ...segments,
      {
        lineId: currentLine.id,
        lineName: currentLine.name,
        lineColorHex: currentLine.colorHex,
        fromStation: currentLine.stations[segmentBoardingIndex].name,
        toStation: currentStation.name,
        stationsTraveled: currentSegmentStations,
      },
    ];

    onComplete(currentStation.name, currentFare, totalStationsTraveled, finalSegments);
  };

  const handleInterchange = (targetLine: MetroLine) => {
    // Save current segment
    const newSegment: JourneySegment = {
      lineId: currentLine.id,
      lineName: currentLine.name,
      lineColorHex: currentLine.colorHex,
      fromStation: currentLine.stations[segmentBoardingIndex].name,
      toStation: currentStation.name,
      stationsTraveled: currentSegmentStations,
    };
    setSegments((prev) => [...prev, newSegment]);

    // Find the interchange station on the target line
    const targetIndex = targetLine.stations.findIndex((s) => s.name === currentStation.name);
    if (targetIndex === -1) {
      toast.error("Interchange station not found on target line!");
      return;
    }

    toast.success(`Switched to ${targetLine.name}`, {
      description: `at ${currentStation.name}`,
      duration: 3000,
    });

    setCurrentLine(targetLine);
    setCurrentStationIndex(targetIndex);
    setSegmentBoardingIndex(targetIndex);
    setJourneyState("arrived");
  };

  const handleCancel = () => {
    stopTrain();
    onCancel();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" variant="ghost" onClick={handleCancel} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-1" /> EXIT
        </Button>
        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: currentLine.colorHex, boxShadow: `0 0 12px ${currentLine.colorHex}66` }} />
        <div>
          <h2 className="font-display text-lg font-bold tracking-wider text-foreground">JOURNEY MODE</h2>
          <p className="text-xs font-mono text-muted-foreground">{currentLine.name} • {paymentType === "card" ? "Metro Card" : "Token"}</p>
        </div>
      </div>

      {/* Journey info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">FROM</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">{originStation}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">CURRENT</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">{currentStation.name}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">STATIONS</div>
          <div className="font-mono text-lg font-bold text-foreground">{totalStationsTraveled}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">FARE</div>
          <div className={`font-mono text-lg font-bold flex items-center gap-1 ${canAfford ? "text-foreground" : "text-destructive"}`}>
            <IndianRupee className="w-4 h-4" />{currentFare}
          </div>
        </div>
      </div>

      {/* Journey segments trail */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.lineColorHex }} />
                <span className="text-[10px] font-mono text-muted-foreground">{seg.fromStation}</span>
                <span className="text-[10px] text-muted-foreground">→</span>
                <span className="text-[10px] font-mono text-muted-foreground">{seg.toStation}</span>
                <span className="text-[10px] font-mono text-foreground font-bold">({seg.stationsTraveled})</span>
              </div>
              <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border" style={{ borderColor: currentLine.colorHex + "66", backgroundColor: currentLine.colorHex + "11" }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentLine.colorHex }} />
            <span className="text-[10px] font-mono text-foreground font-bold">{currentLine.name}</span>
          </div>
        </div>
      )}

      {/* Payment info */}
      {paymentType === "card" && (
        <div className={`flex items-center gap-3 border rounded-lg p-3 mb-4 ${canAfford ? "border-border bg-card" : "border-destructive/50 bg-destructive/5"}`}>
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-xs font-mono text-muted-foreground">Card Balance: </span>
            <span className="text-sm font-mono font-bold text-foreground">₹{cardBalance}</span>
          </div>
          {!canAfford && (
            <div className="flex items-center gap-1 text-destructive text-xs font-mono">
              <AlertCircle className="w-3 h-3" /> LOW BALANCE
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {!isMoving && journeyState !== "traveling" && journeyState !== "interchange-select" && (
          <>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={direction === "forward" ? "default" : "outline"}
                className="font-mono text-xs"
                onClick={() => setDirection("forward")}
                disabled={currentStationIndex >= currentLine.stations.length - 1}
              >
                → {currentLine.stations[currentLine.stations.length - 1].name}
              </Button>
              <Button
                size="sm"
                variant={direction === "backward" ? "default" : "outline"}
                className="font-mono text-xs"
                onClick={() => setDirection("backward")}
                disabled={currentStationIndex <= 0}
              >
                ← {currentLine.stations[0].name}
              </Button>
            </div>
            <Button size="sm" className="font-mono text-xs" onClick={startTrain}
              style={{ backgroundColor: currentLine.colorHex }}
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
        {!isMoving && journeyState === "arrived" && totalStationsTraveled > 0 && (
          <Button size="sm" className="font-mono text-xs bg-success hover:bg-success/90 text-primary-foreground" onClick={handleAlight}>
            <ChevronDown className="w-3 h-3 mr-1" /> ALIGHT HERE (₹{currentFare})
          </Button>
        )}
        {!isMoving && journeyState === "arrived" && interchangeLines.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs border-accent text-accent-foreground"
            onClick={() => setJourneyState("interchange-select")}
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" /> INTERCHANGE
          </Button>
        )}
      </div>

      {/* Interchange selection panel */}
      {journeyState === "interchange-select" && (
        <div className="mb-6 rounded-lg border border-accent/50 bg-accent/5 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-foreground">SWITCH LINE AT {currentStation.name.toUpperCase()}</h3>
            <Button size="sm" variant="ghost" className="font-mono text-xs" onClick={() => setJourneyState("arrived")}>
              CANCEL
            </Button>
          </div>
          <div className="grid gap-2">
            {interchangeLines.map((targetLine) => (
              <button
                key={targetLine.id}
                onClick={() => handleInterchange(targetLine)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all text-left group"
              >
                <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: targetLine.colorHex, boxShadow: `0 0 10px ${targetLine.colorHex}44` }} />
                <div className="flex-1">
                  <div className="font-display text-sm font-bold text-foreground">{targetLine.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {targetLine.stations[0].name} ↔ {targetLine.stations[targetLine.stations.length - 1].name}
                  </div>
                </div>
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Train animation / route view */}
      <div ref={scrollRef} className="relative max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-card p-4">
        <div className="absolute left-[23px] top-4 bottom-4 w-0.5" style={{ backgroundColor: currentLine.colorHex + "44" }} />
        <div className="space-y-0">
          {currentLine.stations.map((station, i) => {
            const isCurrent = i === currentStationIndex;
            const isBoarding = i === segmentBoardingIndex;
            const isPassed = (direction === "forward" && i >= segmentBoardingIndex && i < currentStationIndex) ||
                             (direction === "backward" && i <= segmentBoardingIndex && i > currentStationIndex);
            const isTerminal = i === 0 || i === currentLine.stations.length - 1;
            const stationHasInterchange = station.interchange && station.interchange.length > 0;

            return (
              <div
                key={station.name}
                data-station-index={i}
                className={`relative flex items-center gap-4 py-2 px-2 rounded-lg transition-all duration-500 ${
                  isCurrent ? "bg-secondary/80" : ""
                }`}
              >
                <div className="relative z-10 flex items-center justify-center" style={{ width: 20 }}>
                  {isCurrent ? (
                    <div className="relative">
                      <div
                        className="w-5 h-5 rounded-full animate-pulse"
                        style={{ backgroundColor: currentLine.colorHex, boxShadow: `0 0 16px ${currentLine.colorHex}88` }}
                      />
                      <Train className="w-3 h-3 text-primary-foreground absolute top-1 left-1" />
                    </div>
                  ) : (
                    <div
                      className={`rounded-full border-2 transition-all duration-300 ${isTerminal ? "w-4 h-4" : "w-2.5 h-2.5"}`}
                      style={{
                        borderColor: isPassed || isBoarding ? currentLine.colorHex : currentLine.colorHex + "66",
                        backgroundColor: isBoarding ? currentLine.colorHex : isPassed ? currentLine.colorHex + "44" : "transparent",
                      }}
                    />
                  )}
                </div>

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
                        backgroundColor: currentLine.colorHex + "22",
                        color: currentLine.colorHex,
                      }}>
                        {isMoving ? "PASSING" : "STOPPED"}
                      </span>
                    )}
                    {isCurrent && !isMoving && stationHasInterchange && journeyState === "arrived" && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-bold">
                        ⬥ INTERCHANGE
                      </span>
                    )}
                  </div>
                  {stationHasInterchange && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {station.interchange!.map((lid) => {
                        const other = METRO_LINES.find((l) => l.id === lid);
                        return other ? (
                          <div key={lid} className="w-2 h-2 rounded-full" style={{ backgroundColor: other.colorHex }} title={other.name} />
                        ) : null;
                      })}
                      <span className="text-[9px] font-mono text-muted-foreground ml-0.5">
                        {station.interchange!.map((lid) => METRO_LINES.find((l) => l.id === lid)?.name).filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {isCurrent && totalStationsTraveled > 0 && (
                  <div className="text-xs font-mono text-muted-foreground">
                    {totalStationsTraveled} stn
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
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentLine.colorHex, animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentLine.colorHex, animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentLine.colorHex, animationDelay: "300ms" }} />
          </div>
          <span className="text-sm font-mono text-muted-foreground">Train in motion...</span>
        </div>
      )}
    </div>
  );
};

export default JourneyView;
