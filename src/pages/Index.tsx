import { Cpu, Zap, Eye, FileSearch, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import DetectorPanel from "@/components/DetectorPanel";
import AnalysisHistory from "@/components/AnalysisHistory";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { useAuth } from "@/hooks/useAuth";
import logo from "/logo.png";

const features = [
  {
    icon: Cpu,
    title: "AI Vision Model",
    desc: "Advanced multimodal AI for accurate deepfake detection",
  },
  {
    icon: FileSearch,
    title: "EXIF Metadata Scan",
    desc: "Analyzes image metadata — missing EXIF data lowers confidence",
  },
  {
    icon: Eye,
    title: "Artifact Detection",
    desc: "Identifies subtle manipulation artifacts and inconsistencies",
  },
  {
    icon: Zap,
    title: "Real-Time",
    desc: "Get instant results with confidence scoring",
  },
];

const Index = () => {
  const { history, addRecord, clearHistory } = useAnalysisHistory();
  const { user, signOut } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(185 80% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(185 80% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-end gap-3 px-4 pt-4">
        {user && (
          <>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="DeepFake Detector logo" width={48} height={48} className="h-12 w-12" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Deep<span className="text-gradient">Fake</span> Detector
          </h1>
        </div>

        <p className="mb-12 max-w-md text-center text-muted-foreground">
          Upload an image to analyze it for AI-generated manipulation using
          advanced deep learning models.
        </p>

        {/* Detector */}
        <DetectorPanel onResult={addRecord} />

        {/* History */}
        <AnalysisHistory history={history} onClear={clearHistory} />

        {/* Features */}
        <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-primary/30"
            >
              <f.icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs text-muted-foreground/60">
          Powered by AI vision models · Results are advisory only
        </p>
      </div>
    </div>
  );
};

export default Index;
