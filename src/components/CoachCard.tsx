import { useState, useEffect } from "react";
import { Users, DoorOpen, DoorClosed, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachCardProps {
  coachNumber: number;
  capacity: number;
  passengerCount: number;
  onAddPassenger: () => void;
  onRemovePassenger: () => void;
}

const CoachCard = ({ coachNumber, capacity, passengerCount, onAddPassenger, onRemovePassenger }: CoachCardProps) => {
  const fillPercent = Math.min((passengerCount / capacity) * 100, 100);
  const isFull = passengerCount >= capacity;
  const isNearFull = passengerCount >= capacity * 0.85;
  const doorOpen = !isFull;

  const seats = Math.floor(capacity * 0.55);
  const standing = capacity - seats;

  return (
    <div className={`relative rounded-lg border p-4 transition-all duration-500 ${
      isFull ? "border-danger bg-danger/5 shadow-[0_0_20px_hsl(var(--danger)/0.15)]" 
      : isNearFull ? "border-warning bg-warning/5 shadow-[0_0_20px_hsl(var(--warning)/0.1)]" 
      : "border-border bg-card"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
          COACH {String(coachNumber).padStart(2, "0")}
        </h3>
        <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${
          isFull ? "text-danger" : "text-success"
        }`}>
          {doorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
          {doorOpen ? "DOOR OPEN" : "DOOR LOCKED"}
        </div>
      </div>

      {/* Capacity bar */}
      <div className="relative h-3 rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
            isFull ? "bg-danger" : isNearFull ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-2xl font-bold text-foreground">{passengerCount}</span>
          <span className="text-muted-foreground font-mono text-sm">/ {capacity}</span>
        </div>
        {isFull && (
          <div className="flex items-center gap-1 text-danger animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold">FULL</span>
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground mb-4">
        <div className="bg-secondary/50 rounded px-2 py-1">
          <span className="text-foreground/70">Seats:</span> {seats}
        </div>
        <div className="bg-secondary/50 rounded px-2 py-1">
          <span className="text-foreground/70">Standing:</span> {standing}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 font-mono text-xs"
          onClick={onAddPassenger}
          disabled={isFull}
        >
          + Board
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 font-mono text-xs"
          onClick={onRemovePassenger}
          disabled={passengerCount === 0}
        >
          − Alight
        </Button>
      </div>
    </div>
  );
};

export default CoachCard;
