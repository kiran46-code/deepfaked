import { ShieldCheck, ShieldAlert, BarChart3, Info } from "lucide-react";

interface ResultDisplayProps {
  result: "real" | "fake";
  confidence: number;
}

const ResultDisplay = ({ result, confidence }: ResultDisplayProps) => {
  const isReal = result === "real";
  const percentage = Math.round(confidence * 100);

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-500 ${
        isReal
          ? "border-success/30 bg-success/5 glow-success"
          : "border-destructive/30 bg-destructive/5 glow-destructive"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            isReal ? "bg-success/20" : "bg-destructive/20"
          }`}
        >
          {isReal ? (
            <ShieldCheck className="h-7 w-7 text-success" />
          ) : (
            <ShieldAlert className="h-7 w-7 text-destructive" />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`text-2xl font-bold ${
              isReal ? "text-success" : "text-destructive"
            }`}
          >
            {isReal ? "Authentic Image" : "Deepfake Detected"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isReal
              ? "This image appears to be genuine"
              : "This image shows signs of AI manipulation"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Confidence</span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isReal ? "bg-success" : "bg-destructive"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={`text-sm font-mono font-bold ${
            isReal ? "text-success" : "text-destructive"
          }`}
        >
          {percentage}%
        </span>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-muted/40 bg-muted/10 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This analysis is an AI-powered estimate and may not be fully accurate. Modern AI-generated images can be highly realistic and may not be detected. Do not rely solely on this tool for verification.
        </p>
      </div>
    </div>
  );
};

export default ResultDisplay;
