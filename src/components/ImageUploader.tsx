
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export const ImageUploader = ({ onUpload }: ImageUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          onUpload(file);
        }
      });
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="p-12 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out cursor-pointer hover:border-primary/50 animate-fade-in"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        <Upload className="w-12 h-12 text-muted-foreground" />
        <div>
          {isDragActive ? (
            <p className="text-lg font-medium">Drop your 360° images here...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag & drop your 360° images here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select files
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
