import { createContext, useContext, useState, type ReactNode } from "react";
import type { StatsDTO } from "@/types";

interface StatsContextValue {
  stats: StatsDTO | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue | null>(null);

interface StatsProviderProps {
  children: ReactNode;
  initialStats: StatsDTO;
}

export function StatsProvider({ children, initialStats }: StatsProviderProps) {
  const [stats, setStats] = useState<StatsDTO>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stats");

      if (!response.ok) {
        throw new Error("Nie udało się pobrać statystyk");
      }

      const data: StatsDTO = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać statystyk";
      setError(errorMessage);
      console.error("Błąd podczas odświeżania statystyk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return <StatsContext.Provider value={{ stats, isLoading, error, refreshStats }}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const context = useContext(StatsContext);

  if (!context) {
    // Return safe defaults during SSR or when outside provider
    if (typeof window === "undefined") {
      return {
        stats: null,
        isLoading: false,
        error: null,
        refreshStats: async () => {
          /* noop for SSR */
        },
      };
    }
    throw new Error("useStats must be used within StatsProvider");
  }

  return context;
}
