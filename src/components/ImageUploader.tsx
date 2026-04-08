import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (file: File, preview: string) => void;
  disabled?: boolean;
}

const ImageUploader = ({ onImageUpload, disabled }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5 glow-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => {
        if (disabled) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpg,image/jpeg,image/png";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {isDragging ? (
          <ImageIcon className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          Drop your image here
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse · JPG, JPEG, PNG
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
