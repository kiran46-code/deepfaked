import { useState, useCallback, useRef } from "react";
import { ScanSearch, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import ScanningOverlay from "./ScanningOverlay";
import ResultDisplay from "./ResultDisplay";

type DetectionResult = { result: "real" | "fake"; confidence: number } | null;
type Status = "idle" | "uploaded" | "scanning" | "done";

const DetectorPanel = () => {
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
        if (data.error.includes("loading")) {
          toast.error("Model is warming up. Please wait ~20s and try again.");
        } else {
          toast.error(data.error);
        }
        setStatus("uploaded");
        return;
      }

      setDetection({
        result: data.result,
        confidence: data.confidence,
      });
      setStatus("done");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
      setStatus("uploaded");
    }
  }, []);

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
            Analyzing image with AI model...
          </span>
        </div>
      )}

      {status === "done" && detection && (
        <>
          <ResultDisplay result={detection.result} confidence={detection.confidence} />
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full gap-2 h-11 border-border text-foreground hover:bg-muted"
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
