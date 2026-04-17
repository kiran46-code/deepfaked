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
  thumbnail: string; // resolved URL (signed URL or data URL fallback)
}

const MAX_HISTORY = 20;
const BUCKET = "analysis-thumbnails";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

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

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function resolveThumbnail(thumbnail: string): Promise<string> {
  // Legacy records stored a base64 data URL — return as-is
  if (thumbnail.startsWith("data:")) return thumbnail;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(thumbnail, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) {
    console.error("Failed to sign thumbnail URL:", error);
    return "";
  }
  return data.signedUrl;
}

async function rowToRecord(row: AnalysesRow): Promise<AnalysisRecord> {
  return {
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    result: row.result === "fake" ? "fake" : "real",
    confidence: Number(row.confidence),
    reasoning: row.reasoning ?? undefined,
    metadataReport: (row.metadata_report as MetadataReport | null) ?? undefined,
    scores: (row.scores as Record<string, number> | null) ?? undefined,
    thumbnail: await resolveThumbnail(row.thumbnail),
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
        const records = await Promise.all((data ?? []).map(rowToRecord));
        if (!cancelled) setHistory(records);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addRecord = useCallback(
    async (record: Omit<AnalysisRecord, "id" | "timestamp">) => {
      if (!user) {
        console.warn("[useAnalysisHistory] addRecord called without a signed-in user — skipping");
        return;
      }

      // Upload thumbnail to storage (record.thumbnail is a base64 data URL from DetectorPanel)
      let blob: Blob;
      try {
        blob = dataUrlToBlob(record.thumbnail);
      } catch (e) {
        console.error("[useAnalysisHistory] Failed to decode thumbnail data URL:", e);
        return;
      }

      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      console.log("[useAnalysisHistory] uploading thumbnail to", path, "size:", blob.size);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });

      if (uploadError) {
        console.error("[useAnalysisHistory] Failed to upload thumbnail:", uploadError);
        return;
      }

      const { data, error } = await supabase
        .from("analyses")
        .insert([{
          user_id: user.id,
          result: record.result,
          confidence: record.confidence,
          reasoning: record.reasoning ?? null,
          metadata_report: (record.metadataReport ?? null) as never,
          scores: (record.scores ?? null) as never,
          thumbnail: path,
        }])
        .select("id, result, confidence, reasoning, metadata_report, scores, thumbnail, created_at")
        .single();

      if (error) {
        console.error("[useAnalysisHistory] Failed to save analysis:", error);
        // Best-effort cleanup of orphaned upload
        await supabase.storage.from(BUCKET).remove([path]);
        return;
      }
      console.log("[useAnalysisHistory] saved analysis", data.id);
      const newRecord = await rowToRecord(data as AnalysesRow);
      setHistory((prev) => [newRecord, ...prev].slice(0, MAX_HISTORY));
    },
    [user]
  );

  const clearHistory = useCallback(async () => {
    if (!user) return;

    // Collect storage paths from current rows so we can remove the files
    const { data: rows } = await supabase
      .from("analyses")
      .select("thumbnail")
      .eq("user_id", user.id);

    const paths = (rows ?? [])
      .map((r) => r.thumbnail)
      .filter((t): t is string => !!t && !t.startsWith("data:"));

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
      if (removeError) console.error("Failed to remove thumbnail files:", removeError);
    }

    const { error } = await supabase.from("analyses").delete().eq("user_id", user.id);
    if (error) {
      console.error("Failed to clear history:", error);
      return;
    }
    setHistory([]);
  }, [user]);

  return { history, addRecord, clearHistory, loading };
}
