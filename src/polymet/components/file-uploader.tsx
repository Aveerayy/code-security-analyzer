import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { UploadIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FileWithPreview = File & {
  preview?: string;
};

interface FileUploaderProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export default function FileUploader({
  onFilesSelected,
  maxFiles = 10,
  acceptedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    ".md",
    ".txt",
    ".docx",
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
  ],
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files.`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        })
      );

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview as string);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, curr) => {
        acc[curr] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxFiles,
  });

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("docx")) return "📝";
    if (
      fileType.includes("text") ||
      fileType.includes("txt") ||
      fileType.includes("md")
    )
      return "📋";
    if (fileType.includes("image")) return "🖼️";
    return "📁";
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("word") || fileType.includes("docx")) return "DOCX";
    if (fileType.includes("text") || fileType.includes("txt")) return "TXT";
    if (fileType.includes("md")) return "MD";
    if (fileType.includes("png")) return "PNG";
    if (fileType.includes("jpg") || fileType.includes("jpeg")) return "JPG";
    if (fileType.includes("svg")) return "SVG";
    return fileType.split("/")[1]?.toUpperCase() || "FILE";
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <UploadIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents (PDF, DOCX, TXT), diagrams (PNG, JPG, SVG), or
              markdown files
            </p>
          </div>
          <Button variant="outline" className="mt-2">
            Browse files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length} {files.length === 1 ? "file" : "files"} selected
          </p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-background border rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getFileTypeIcon(file.type)}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getFileTypeLabel(file.type)}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
