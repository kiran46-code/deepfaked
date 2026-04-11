import { useState, useCallback, useRef } from "react";
import { ScanSearch, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import ScanningOverlay from "./ScanningOverlay";
import ResultDisplay from "./ResultDisplay";

type DetectionResult = { result: "real" | "fake"; confidence: number; reasoning?: string } | null;
type Status = "idle" | "uploaded" | "scanning" | "done";

interface DetectorPanelProps {
  onResult?: (record: { result: "real" | "fake"; confidence: number; reasoning?: string; thumbnail: string }) => void;
}

function createThumbnail(dataUrl: string, size = 96): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.src = dataUrl;
  });
}

const DetectorPanel = ({ onResult }: DetectorPanelProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult>(null);
  const fileDataUrl = useRef<string | null>(null);

  const handleImageUpload = useCallback((_file: File, dataUrl: string) => {
    setPreview(dataUrl);
    fileDataUrl.current = dataUrl;
    setStatus("uploaded");
    setDetection(null);
  }, []);

  const handleScan = useCallback(async () => {
    if (!fileDataUrl.current) return;
    setStatus("scanning");

    try {
      const { data, error } = await supabase.functions.invoke("detect-deepfake", {
        body: { image: fileDataUrl.current },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Analysis failed. Please try again.");
        setStatus("uploaded");
        return;
      }

      if (data.error) {
        console.error("API error:", data.error);
        toast.error(data.error);
        setStatus("uploaded");
        return;
      }

      const result = {
        result: data.result as "real" | "fake",
        confidence: data.confidence as number,
        reasoning: data.reasoning as string | undefined,
      };

      setDetection(result);
      setStatus("done");

      // Save to history
      if (onResult && fileDataUrl.current) {
        const thumbnail = await createThumbnail(fileDataUrl.current);
        onResult({ ...result, thumbnail });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
      setStatus("uploaded");
    }
  }, [onResult]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setPreview(null);
    setDetection(null);
    fileDataUrl.current = null;
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {status === "idle" && <ImageUploader onImageUpload={handleImageUpload} />}

      {status !== "idle" && preview && (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <img
            src={preview}
            alt="Uploaded"
            className="w-full max-h-[400px] object-contain bg-black/40"
          />
          {status === "scanning" && <ScanningOverlay />}
        </div>
      )}

      {status === "uploaded" && (
        <Button
          onClick={handleScan}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary h-12 text-base font-semibold"
        >
          <ScanSearch className="h-5 w-5" />
          Analyze for Deepfake
        </Button>
      )}

      {status === "scanning" && (
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-primary" style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}>
            Analyzing image with AI...
          </span>
        </div>
      )}

      {status === "done" && detection && (
        <>
          <ResultDisplay result={detection.result} confidence={detection.confidence} reasoning={detection.reasoning} />
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full gap-2 h-11 border-border text-foreground hover:bg-muted animate-fade-in"
            style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}
          >
            <RotateCcw className="h-4 w-4" />
            Analyze Another Image
          </Button>
        </>
      )}
    </div>
  );
};

export default DetectorPanel;
