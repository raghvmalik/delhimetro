import { useState, useCallback, useEffect } from "react";

export interface MetroCard {
  id: string;
  balance: number;
  trips: Trip[];
}

export interface Trip {
  id: string;
  lineId: string;
  lineName: string;
  from: string;
  to: string;
  fare: number;
  stationsTraveled: number;
  timestamp: number;
  type: "card" | "token";
}

const FARE_SLABS = [
  { maxStations: 2, fare: 10 },
  { maxStations: 5, fare: 20 },
  { maxStations: 8, fare: 30 },
  { maxStations: 12, fare: 40 },
  { maxStations: 21, fare: 50 },
  { maxStations: Infinity, fare: 60 },
];

export const calculateFare = (stationCount: number): number => {
  const slab = FARE_SLABS.find((s) => stationCount <= s.maxStations);
  return slab?.fare ?? 60;
};

const STORAGE_KEY = "delhi-metro-card";

const loadCard = (): MetroCard => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { id: "DMC" + Math.random().toString(36).slice(2, 8).toUpperCase(), balance: 200, trips: [] };
};

export const useMetroCard = () => {
  const [card, setCard] = useState<MetroCard>(loadCard);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
  }, [card]);

  const topUp = useCallback((amount: number) => {
    setCard((c) => ({ ...c, balance: c.balance + amount }));
  }, []);

  const deductFare = useCallback((trip: Omit<Trip, "id" | "timestamp">) => {
    const newTrip: Trip = { ...trip, id: crypto.randomUUID(), timestamp: Date.now() };
    setCard((c) => ({
      ...c,
      balance: c.balance - trip.fare,
      trips: [newTrip, ...c.trips].slice(0, 50),
    }));
    return newTrip;
  }, []);

  const canAfford = useCallback((fare: number) => card.balance >= fare, [card.balance]);

  return { card, topUp, deductFare, canAfford };
};
