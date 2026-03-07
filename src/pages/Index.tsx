import { useState } from "react";
import { Train } from "lucide-react";
import { getLineById } from "@/data/delhiMetro";
import MetroDashboard from "@/components/MetroDashboard";
import LineDetail from "@/components/LineDetail";

const Index = () => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const selectedLine = selectedLineId ? getLineById(selectedLineId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Train className="w-8 h-8 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-wider text-foreground">
            DELHI METRO SENSOR
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm mb-8">
          Real-time passenger load monitoring & automatic door control system
        </p>

        {selectedLine ? (
          <LineDetail line={selectedLine} onBack={() => setSelectedLineId(null)} />
        ) : (
          <MetroDashboard onSelectLine={setSelectedLineId} />
        )}
      </div>
    </div>
  );
};

export default Index;
