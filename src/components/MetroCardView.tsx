import { useState } from "react";
import { MetroCard, Trip } from "@/hooks/useMetroCard";
import { CreditCard, Plus, History, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  card: MetroCard;
  onTopUp: (amount: number) => void;
  onClose: () => void;
}

const TOP_UP_OPTIONS = [50, 100, 200, 500];

const MetroCardView = ({ card, onTopUp, onClose }: Props) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleTopUp = (amount: number) => {
    onTopUp(amount);
    toast.success(`₹${amount} added to Metro Card`, { description: `New balance: ₹${card.balance + amount}` });
  };

  return (
    <div className="space-y-6">
      {/* Card visual */}
      <div className="relative rounded-2xl p-6 overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(170 80% 30%), hsl(220 60% 25%))",
      }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{
          background: "radial-gradient(circle, hsl(170 80% 60%), transparent)",
          transform: "translate(20%, -20%)",
        }} />
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-6 h-6 text-primary-foreground/80" />
          <span className="font-display text-sm font-bold tracking-widest text-primary-foreground/80">DELHI METRO CARD</span>
        </div>
        <div className="font-mono text-3xl font-bold text-primary-foreground mb-1">
          ₹{card.balance.toFixed(0)}
        </div>
        <div className="text-xs font-mono text-primary-foreground/60">Available Balance</div>
        <div className="mt-4 font-mono text-xs text-primary-foreground/50 tracking-widest">
          {card.id}
        </div>
      </div>

      {/* Top up */}
      <div>
        <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-3">RECHARGE</h3>
        <div className="grid grid-cols-4 gap-2">
          {TOP_UP_OPTIONS.map((amt) => (
            <Button key={amt} variant="outline" className="font-mono text-sm" onClick={() => handleTopUp(amt)}>
              <Plus className="w-3 h-3 mr-1" />₹{amt}
            </Button>
          ))}
        </div>
      </div>

      {/* Fare chart */}
      <div>
        <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-3">FARE CHART</h3>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          {[
            { range: "1-2 stn", fare: 10 },
            { range: "3-5 stn", fare: 20 },
            { range: "6-8 stn", fare: 30 },
            { range: "9-12 stn", fare: 40 },
            { range: "13-21 stn", fare: 50 },
            { range: "21+ stn", fare: 60 },
          ].map((f) => (
            <div key={f.range} className="bg-secondary/50 rounded px-3 py-2 flex items-center justify-between">
              <span className="text-muted-foreground">{f.range}</span>
              <span className="text-foreground font-semibold">₹{f.fare}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip history */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 font-display text-sm font-bold tracking-wider text-foreground mb-3"
        >
          <History className="w-4 h-4" />
          TRIP HISTORY ({card.trips.length})
        </button>
        {showHistory && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {card.trips.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No trips yet. Start a journey!</p>
            ) : (
              card.trips.map((trip) => (
                <TripRow key={trip.id} trip={trip} />
              ))
            )}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full font-mono" onClick={onClose}>
        Close
      </Button>
    </div>
  );
};

const TripRow = ({ trip }: { trip: Trip }) => (
  <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
    <div>
      <div className="text-xs font-mono text-foreground font-semibold">
        {trip.from} → {trip.to}
      </div>
      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
        {trip.lineName} • {trip.stationsTraveled} stations • {trip.type === "card" ? "Card" : "Token"} • {new Date(trip.timestamp).toLocaleDateString()}
      </div>
    </div>
    <div className="flex items-center gap-1 text-sm font-mono font-bold text-foreground">
      <IndianRupee className="w-3 h-3" />{trip.fare}
    </div>
  </div>
);

export default MetroCardView;
