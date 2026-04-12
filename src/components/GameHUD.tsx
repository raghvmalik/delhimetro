import { MetroCard } from "@/hooks/useMetroCard";
import { CreditCard, MapPin, Train, Trophy } from "lucide-react";

interface Props {
  card: MetroCard;
  onCardClick: () => void;
  onTitleClick: () => void;
}

const GameHUD = ({ card, onCardClick, onTitleClick }: Props) => {
  const totalStations = card.trips.reduce((sum, t) => sum + t.stationsTraveled, 0);
  const uniqueLines = new Set(card.trips.map((t) => t.lineId)).size;

  // XP = stations traveled * 10
  const xp = totalStations * 10;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpProgress = (xpInLevel / 500) * 100;

  const rankTitle = level >= 10 ? "METRO LEGEND" : level >= 7 ? "CHIEF OPERATOR" : level >= 4 ? "SR. COMMUTER" : level >= 2 ? "REGULAR" : "ROOKIE";

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm mb-4">
      {/* Left: Game title */}
      <button onClick={onTitleClick} className="flex items-center gap-2 shrink-0 focus:outline-none group">
        <Train className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
        <div className="hidden sm:block">
          <span className="font-display text-sm font-black tracking-wider text-foreground">DELHI METRO</span>
        </div>
      </button>

      {/* Center: Player stats */}
      <div className="flex items-center gap-3 md:gap-5 text-[10px] font-mono">
        {/* Level & XP */}
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <div className="hidden md:block">
            <span className="text-accent font-bold">LV.{level}</span>
            <span className="text-muted-foreground ml-1">{rankTitle}</span>
          </div>
          <span className="md:hidden text-accent font-bold">LV.{level}</span>
          {/* XP bar */}
          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden hidden sm:block">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpProgress}%`,
                backgroundColor: "hsl(var(--accent))",
                boxShadow: "0 0 4px hsl(var(--accent) / 0.5)",
              }}
            />
          </div>
        </div>

        {/* Trips */}
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-bold">{card.trips.length}</span>
          <span className="text-muted-foreground hidden sm:inline">TRIPS</span>
        </div>

        {/* Lines explored */}
        <div className="flex items-center gap-1 hidden md:flex">
          <Train className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-bold">{uniqueLines}/10</span>
          <span className="text-muted-foreground">LINES</span>
        </div>
      </div>

      {/* Right: Balance */}
      <button
        onClick={onCardClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary transition-colors shrink-0 focus:outline-none"
      >
        <CreditCard className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs font-bold text-foreground">₹{card.balance}</span>
      </button>
    </div>
  );
};

export default GameHUD;
