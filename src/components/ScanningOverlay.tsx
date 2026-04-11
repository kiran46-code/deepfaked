const ScanningOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      {/* Dark tint */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" style={{ animation: "fade-in 0.3s ease-out" }} />

      {/* Scanning line */}
      <div
        className="absolute left-0 right-0 h-0.5"
        style={{ animation: "scan 2s ease-in-out infinite" }}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="h-8 -mt-4 bg-gradient-to-b from-primary/20 to-transparent" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(185 80% 50% / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(185 80% 50% / 0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          animation: "grid-fade 2s ease-in-out infinite",
        }}
      />

      {/* Corner markers */}
      {[
        "top-3 left-3",
        "top-3 right-3",
        "bottom-3 left-3",
        "bottom-3 right-3",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} h-8 w-8 ${
            pos.includes("top") ? "border-t-2" : "border-b-2"
          } ${
            pos.includes("left") ? "border-l-2" : "border-r-2"
          } border-primary rounded-sm`}
          style={{ animation: "pulse-glow 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}
        />
      ))}

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}>
        <div className="relative h-12 w-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-primary/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-primary/60" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-primary/60" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-primary/60" />
          <div className="absolute inset-2 border border-primary/30 rounded-full" />
        </div>
      </div>

      {/* Scanning data overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between">
        <div className="text-[10px] font-mono text-primary/60" style={{ animation: "pulse-glow 1s ease-in-out infinite" }}>
          ANALYZING...
        </div>
        <div className="text-[10px] font-mono text-primary/40">
          AI VISION MODEL
        </div>
      </div>
    </div>
  );
};

export default ScanningOverlay;
