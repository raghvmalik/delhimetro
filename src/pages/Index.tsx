import { useState } from "react";
import { getLineById } from "@/data/delhiMetro";
import { useMetroCard } from "@/hooks/useMetroCard";
import GameIntro from "@/components/GameIntro";
import GameHUD from "@/components/GameHUD";
import MetroDashboard from "@/components/MetroDashboard";
import LineDetail from "@/components/LineDetail";
import MetroCardView from "@/components/MetroCardView";

type GameState = "intro" | "menu" | "line" | "card";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const selectedLine = selectedLineId ? getLineById(selectedLineId) : null;
  const { card, topUp, deductFare } = useMetroCard();

  if (gameState === "intro") {
    return <GameIntro onStart={() => setGameState("menu")} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Game HUD */}
        <GameHUD
          card={card}
          onCardClick={() => setGameState(gameState === "card" ? "menu" : "card")}
          onTitleClick={() => { setGameState("menu"); setSelectedLineId(null); }}
        />

        {/* Content */}
        {gameState === "card" ? (
          <MetroCardView card={card} onTopUp={topUp} onClose={() => setGameState(selectedLineId ? "line" : "menu")} />
        ) : gameState === "line" && selectedLine ? (
          <LineDetail
            line={selectedLine}
            onBack={() => { setGameState("menu"); setSelectedLineId(null); }}
            cardBalance={card.balance}
            onDeductFare={(trip) => deductFare(trip)}
          />
        ) : (
          <MetroDashboard onSelectLine={(id) => { setSelectedLineId(id); setGameState("line"); }} />
        )}
      </div>
    </div>
  );
};

export default Index;
