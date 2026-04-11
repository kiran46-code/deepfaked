import { useState, useCallback, useEffect } from "react";

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  result: "real" | "fake";
  confidence: number;
  reasoning?: string;
  thumbnail: string; // small base64 thumbnail
}

const STORAGE_KEY = "deepfake-analysis-history";
const MAX_HISTORY = 20;

function loadHistory(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisRecord[]>(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // storage full — silently ignore
    }
  }, [history]);

  const addRecord = useCallback(
    (record: Omit<AnalysisRecord, "id" | "timestamp">) => {
      const newRecord: AnalysisRecord = {
        ...record,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setHistory((prev) => [newRecord, ...prev].slice(0, MAX_HISTORY));
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addRecord, clearHistory };
}
