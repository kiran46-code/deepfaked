import { History, Trash2, ShieldCheck, ShieldAlert, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisRecord } from "@/hooks/useAnalysisHistory";

interface Props {
  history: AnalysisRecord[];
  onClear: () => void;
}

const AnalysisHistory = ({ history, onClear }: Props) => {
  if (history.length === 0) return null;

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
        {history.map((record) => (
          <div
            key={record.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 backdrop-blur-sm"
          >
            <img
              src={record.thumbnail}
              alt="Analyzed"
              className="h-12 w-12 rounded-md object-cover bg-muted flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {record.result === "real" ? (
                  <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    record.result === "real" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {record.result === "real" ? "Authentic" : "Deepfake Detected"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {record.confidence}%
                </span>
                {record.metadataReport && (
                  record.metadataReport.metadataPresent ? (
                    <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                      <Camera className="h-2.5 w-2.5" />
                      EXIF
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      No EXIF
                    </span>
                  )
                )}
              </div>
              {record.reasoning && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {record.reasoning}
                </p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
              {new Date(record.timestamp).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisHistory;
