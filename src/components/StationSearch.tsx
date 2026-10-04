import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { METRO_LINES } from "@/data/delhiMetro";
import { Input } from "@/components/ui/input";

interface Props {
  onSelect: (lineId: string, station: string) => void;
}

const StationSearch = ({ onSelect }: Props) => {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out: { lineId: string; lineName: string; color: string; station: string }[] = [];
    for (const l of METRO_LINES)
      for (const st of l.stations)
        if (st.name.toLowerCase().includes(s))
          out.push({ lineId: l.id, lineName: l.name, color: l.colorHex, station: st.name });
    return out.slice(0, 12);
  }, [q]);

  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search station name..."
        className="pl-9 font-mono"
      />
      {results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-auto">
          {results.map((r) => (
            <button
              key={r.lineId + r.station}
              onClick={() => { onSelect(r.lineId, r.station); setQ(""); }}
              className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-secondary/60"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="font-mono text-sm text-foreground flex-1">{r.station}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.lineName}</span>
            </button>
          ))}
        </div>
      )}
      {q.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm text-muted-foreground">
          No stations found
        </div>
      )}
    </div>
  );
};

export default StationSearch;
