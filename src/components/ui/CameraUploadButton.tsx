import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraUploadButtonProps {
  onFileSelected: (file: File) => void;
  id: string;
  disabled?: boolean;
  accept?: string;
  label?: string;
  cameraLabel?: string;
  uploadLabel?: string;
  className?: string;
  variant?: "default" | "compact";
}

export const CameraUploadButton = ({
  onFileSelected,
  id,
  disabled = false,
  accept = "image/*",
  uploadLabel = "Uploader",
  cameraLabel = "Scanner",
  className,
  variant = "default",
}: CameraUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Reset so same file can be selected again
    event.target.value = "";
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        id={`${id}-upload`}
        onChange={handleChange}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id={`${id}-camera`}
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size={variant === "compact" ? "sm" : "default"}
        className={cn("gap-2", variant === "default" && "flex-1")}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <Upload className="h-4 w-4" />
        {uploadLabel}
      </Button>

      {/* Camera button */}
      <Button
        type="button"
        variant="outline"
        size={variant === "compact" ? "sm" : "default"}
        className={cn("gap-2", variant === "default" && "flex-1")}
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
      >
        <Camera className="h-4 w-4" />
        {cameraLabel}
      </Button>
    </div>
  );
};
