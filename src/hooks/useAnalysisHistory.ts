import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MetadataReport } from "@/components/ResultDisplay";

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  result: "real" | "fake";
  confidence: number;
  reasoning?: string;
  metadataReport?: MetadataReport;
  scores?: Record<string, number>;
  thumbnail: string;
}

const MAX_HISTORY = 20;

interface AnalysesRow {
  id: string;
  result: string;
  confidence: number;
  reasoning: string | null;
  metadata_report: unknown;
  scores: unknown;
  thumbnail: string;
  created_at: string;
}

function rowToRecord(row: AnalysesRow): AnalysisRecord {
  return {
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    result: row.result === "fake" ? "fake" : "real",
    confidence: Number(row.confidence),
    reasoning: row.reasoning ?? undefined,
    metadataReport: (row.metadata_report as MetadataReport | null) ?? undefined,
    scores: (row.scores as Record<string, number> | null) ?? undefined,
    thumbnail: row.thumbnail,
  };
}

export function useAnalysisHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from DB whenever the user changes
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, result, confidence, reasoning, metadata_report, scores, thumbnail, created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY);
      if (cancelled) return;
      if (error) {
        console.error("Failed to load analysis history:", error);
        setHistory([]);
      } else {
        setHistory((data ?? []).map(rowToRecord));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addRecord = useCallback(
    async (record: Omit<AnalysisRecord, "id" | "timestamp">) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          result: record.result,
          confidence: record.confidence,
          reasoning: record.reasoning ?? null,
          metadata_report: record.metadataReport ?? null,
          scores: record.scores ?? null,
          thumbnail: record.thumbnail,
        })
        .select("id, result, confidence, reasoning, metadata_report, scores, thumbnail, created_at")
        .single();

      if (error) {
        console.error("Failed to save analysis:", error);
        return;
      }
      setHistory((prev) => [rowToRecord(data as AnalysesRow), ...prev].slice(0, MAX_HISTORY));
    },
    [user]
  );

  const clearHistory = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from("analyses").delete().eq("user_id", user.id);
    if (error) {
      console.error("Failed to clear history:", error);
      return;
    }
    setHistory([]);
  }, [user]);

  return { history, addRecord, clearHistory, loading };
}
