const ScanningOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      {/* Scanning line */}
      <div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
        style={{ animation: "scan 2s ease-in-out infinite" }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(185 80% 50% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(185 80% 50% / 0.06) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          animation: "grid-fade 2s ease-in-out infinite",
        }}
      />
      {/* Corner markers */}
      {[
        "top-2 left-2",
        "top-2 right-2",
        "bottom-2 left-2",
        "bottom-2 right-2",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} h-6 w-6 ${
            pos.includes("top") ? "border-t-2" : "border-b-2"
          } ${
            pos.includes("left") ? "border-l-2" : "border-r-2"
          } border-primary`}
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        />
      ))}
    </div>
  );
};

export default ScanningOverlay;
