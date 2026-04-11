import { useState } from "react";
import { History, Trash2, ShieldCheck, ShieldAlert, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResultDisplay from "./ResultDisplay";
import type { AnalysisRecord } from "@/hooks/useAnalysisHistory";

interface Props {
  history: AnalysisRecord[];
  onClear: () => void;
}

const AnalysisHistory = ({ history, onClear }: Props) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="mx-auto w-full max-w-2xl mt-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Analysis History</h2>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive gap-1 h-7"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((record) => {
          const isExpanded = expandedId === record.id;
          return (
            <div key={record.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all">
              {/* Summary row */}
              <button
                onClick={() => toggle(record.id)}
                className="flex items-center gap-3 p-3 w-full text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <img
                  src={record.thumbnail}
                  alt="Analyzed"
                  className="h-12 w-12 rounded-md object-cover bg-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {record.result === "real" ? (
                      <ShieldCheck className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        record.result === "real" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {record.result === "real" ? "Authentic" : "Deepfake Detected"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(record.confidence * 100)}%
                    </span>
                  </div>
                  {!isExpanded && record.reasoning && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {record.reasoning}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mr-1">
                  {new Date(record.timestamp).toLocaleDateString()}
                </span>
                {isExpanded ? (
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-4 pt-1 border-t border-border/50 animate-fade-in">
                  <ResultDisplay
                    result={record.result}
                    confidence={record.confidence}
                    reasoning={record.reasoning}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisHistory;
