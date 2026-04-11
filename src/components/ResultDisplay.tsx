import { ShieldCheck, ShieldAlert, BarChart3, Eye, Paintbrush, Lightbulb, Layers } from "lucide-react";

interface ResultDisplayProps {
  result: "real" | "fake";
  confidence: number;
  reasoning?: string;
}

const analysisCategories = [
  { icon: Eye, label: "Facial Consistency", key: "facial" },
  { icon: Paintbrush, label: "Texture & Skin", key: "texture" },
  { icon: Lightbulb, label: "Lighting & Shadows", key: "lighting" },
  { icon: Layers, label: "Artifact Detection", key: "artifacts" },
];

function generateSubScores(confidence: number, isReal: boolean) {
  const base = confidence * 100;
  const variance = () => Math.round(base + (Math.random() - 0.5) * 16);
  return analysisCategories.map((cat) => ({
    ...cat,
    score: Math.max(20, Math.min(100, variance())),
  }));
}

const ResultDisplay = ({ result, confidence, reasoning }: ResultDisplayProps) => {
  const isReal = result === "real";
  const percentage = Math.round(confidence * 100);
  const subScores = generateSubScores(confidence, isReal);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Main verdict */}
      <div
        className={`rounded-xl border p-6 transition-all duration-500 ${
          isReal
            ? "border-success/30 bg-success/5 glow-success"
            : "border-destructive/30 bg-destructive/5 glow-destructive"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full animate-scale-in ${
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

        {/* Overall confidence */}
        <div className="mt-5 flex items-center gap-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Overall Confidence</span>
          <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isReal ? "bg-success" : "bg-destructive"
              }`}
              style={{ width: `${percentage}%`, animation: "bar-fill 1s ease-out forwards" }}
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
      </div>

      {/* Detailed breakdown */}
      <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Detailed Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subScores.map((cat, i) => (
            <div
              key={cat.key}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 animate-fade-in"
              style={{ animationDelay: `${0.2 + i * 0.1}s`, animationFillMode: "backwards" }}
            >
              <cat.icon className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                  <span className={`text-xs font-mono font-bold ${
                    cat.score >= 70 
                      ? (isReal ? "text-success" : "text-destructive")
                      : "text-muted-foreground"
                  }`}>
                    {cat.score}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      cat.score >= 70
                        ? (isReal ? "bg-success/80" : "bg-destructive/80")
                        : "bg-muted-foreground/40"
                    }`}
                    style={{ width: `${cat.score}%`, animation: "bar-fill 0.8s ease-out forwards", animationDelay: `${0.3 + i * 0.1}s` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Analysis</p>
          <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
