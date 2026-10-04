import { useState } from "react";
import { Train, CreditCard } from "lucide-react";
import { getLineById } from "@/data/delhiMetro";
import { useMetroCard } from "@/hooks/useMetroCard";
import MetroDashboard from "@/components/MetroDashboard";
import LineDetail from "@/components/LineDetail";
import MetroCardView from "@/components/MetroCardView";
import { Button } from "@/components/ui/button";
import VirtualClock from "@/components/VirtualClock";
import StationSearch from "@/components/StationSearch";

const Index = () => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const selectedLine = selectedLineId ? getLineById(selectedLineId) : null;
  const { card, topUp, deductFare } = useMetroCard();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Train className="w-8 h-8 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-black tracking-wider text-foreground">
              DELHI METRO
            </h1>
          </div>
          <div className="flex items-center gap-2">
          <VirtualClock />
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs gap-2"
            onClick={() => setShowCard(!showCard)}
          >
            <CreditCard className="w-4 h-4" />
            ₹{card.balance}
          </Button>
          </div>
        </div>
        <p className="text-muted-foreground font-mono text-sm mb-4">
          Real-time passenger load monitoring & automatic door control system
        </p>

        <StationSearch
          onSelect={(lineId, station) => {
            setShowCard(false);
            setSelectedLineId(lineId);
            setHighlight(station);
            setSearchKey((k) => k + 1);
          }}
        />

        {showCard ? (
          <MetroCardView card={card} onTopUp={topUp} onClose={() => setShowCard(false)} />
        ) : selectedLine ? (
          <LineDetail
            key={selectedLine.id + searchKey}
            line={selectedLine}
            highlightStation={highlight}
            onBack={() => { setSelectedLineId(null); setHighlight(null); }}
            cardBalance={card.balance}
            onDeductFare={(trip) => deductFare(trip)}
          />
        ) : (
          <MetroDashboard onSelectLine={setSelectedLineId} />
        )}
      </div>
    </div>
  );
};

export default Index;
