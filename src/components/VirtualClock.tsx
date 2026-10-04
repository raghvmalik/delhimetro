import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getVirtualMinutes, formatVirtualTime, timeRushFactor, timeRushLabel } from "@/data/delhiMetro";

const VirtualClock = () => {
  const [m, setM] = useState(getVirtualMinutes());
  useEffect(() => {
    const id = setInterval(() => setM(getVirtualMinutes()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 font-mono text-xs border border-border rounded-md px-3 py-1.5 bg-card" title="10 real minutes = 1 virtual hour">
      <Clock className="w-4 h-4 text-primary" />
      <span className="text-foreground font-bold">{formatVirtualTime(m)}</span>
      <span className="text-muted-foreground">{timeRushLabel(timeRushFactor(m))}</span>
    </div>
  );
};

export default VirtualClock;
