import { ShieldCheck, ShieldAlert, BarChart3, Info, Camera, Calendar, Monitor, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface MetadataReport {
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
  software?: string;
  hasGps: boolean;
  hasExif: boolean;
  metadataPresent: boolean;
}

interface ResultDisplayProps {
  result: "real" | "fake";
  confidence: number;
  metadataReport?: MetadataReport;
  scores?: Record<string, number>;
}

const SCORE_LABELS: Record<string, string> = {
  skin_texture: "Skin",
  hair: "Hair",
  eyes: "Eyes",
  teeth_mouth: "Teeth/Mouth",
  hands_fingers: "Hands",
  background: "Background",
  lighting: "Lighting",
  edge_boundaries: "Edges",
  symmetry: "Symmetry",
  textures: "Textures",
};

const SCORE_DESCRIPTIONS: Record<string, string> = {
  skin_texture: "Checks pores, smoothness, and unnatural plastic-like appearance often seen in AI faces.",
  hair: "Looks for individual strand detail vs. blobby, melted, or repeating hair masses.",
  eyes: "Verifies matching reflections, iris detail, pupil shape, and gaze alignment.",
  teeth_mouth: "Checks tooth count, gum line consistency, and lip texture realism.",
  hands_fingers: "Counts fingers and checks proportions, joints, and nail details — common AI failure points.",
  background: "Detects warped lines, floating objects, or inconsistent blur in the surroundings.",
  lighting: "Checks shadow direction consistency and realistic specular highlights across the scene.",
  edge_boundaries: "Looks for halo effects or blending artifacts where the subject meets the background.",
  symmetry: "Flags suspiciously perfect symmetry, which is a hallmark of AI generation.",
  textures: "Inspects fabric weave, surface materials, and any text for AI-typical distortions.",
};

function getScoreBadgeClasses(score: number): string {
  if (score === -1) return "bg-muted text-muted-foreground";
  if (score <= 3) return "bg-success/15 text-success";
  if (score <= 6) return "bg-amber-500/15 text-amber-500";
  return "bg-destructive/15 text-destructive";
}

const ResultDisplay = ({ result, confidence, metadataReport, scores }: ResultDisplayProps) => {
  const isReal = result === "real";
  const percentage = Math.round(confidence * 100);

  return (
    <div className="space-y-4">
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

      {/* Forensic Scores */}
      {scores && Object.keys(scores).length > 0 && (
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3">Forensic Area Scores</h4>
          <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scores).map(([key, score]) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <span
                      className={`inline-flex cursor-help items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getScoreBadgeClasses(score)}`}
                    >
                      {SCORE_LABELS[key] || key}
                      <span className="font-mono font-bold">{score === -1 ? "N/A" : score}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{SCORE_DESCRIPTIONS[key] || "Forensic check for this area."}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* Metadata Analysis Section */}
      {metadataReport && (
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            {metadataReport.metadataPresent ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <h4 className="text-sm font-semibold text-foreground">Metadata Analysis</h4>
            <span
              className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                metadataReport.metadataPresent
                  ? "bg-success/10 text-success"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {metadataReport.metadataPresent ? "Present" : "Missing"}
            </span>
          </div>

          {metadataReport.metadataPresent ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(metadataReport.cameraMake || metadataReport.cameraModel) && (
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Camera:</span>
                  <span className="text-foreground font-medium truncate">
                    {[metadataReport.cameraMake, metadataReport.cameraModel].filter(Boolean).join(" ")}
                  </span>
                </div>
              )}
              {metadataReport.dateTaken && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground font-medium">{metadataReport.dateTaken}</span>
                </div>
              )}
              {metadataReport.software && (
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Software:</span>
                  <span className="text-foreground font-medium truncate">{metadataReport.software}</span>
                </div>
              )}
              {metadataReport.hasGps && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">GPS:</span>
                  <span className="text-success font-medium">Available</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              No EXIF metadata was found in this image. AI-generated images typically lack camera metadata such as make, model, date taken, and GPS coordinates. This absence has reduced the confidence score.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
