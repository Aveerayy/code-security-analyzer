import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  XIcon,
  MaximizeIcon,
} from "lucide-react";

type FileWithPreview = File & {
  preview?: string;
};

interface FilePreviewProps {
  files: FileWithPreview[];
  onRemoveFile?: (index: number) => void;
}

export default function FilePreview({ files, onRemoveFile }: FilePreviewProps) {
  const [selectedFile, setSelectedFile] = useState<number | null>(null);

  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  const documentFiles = files.filter(
    (file) =>
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("docx")
  );
  const textFiles = files.filter(
    (file) =>
      file.type.includes("text") ||
      file.type.includes("txt") ||
      file.type.includes("md")
  );

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="h-5 w-5" />;

    if (
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("docx")
    )
      return <FileIcon className="h-5 w-5" />;

    return <FileTextIcon className="h-5 w-5" />;
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

  if (files.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({files.length})</TabsTrigger>
          <TabsTrigger value="images" disabled={imageFiles.length === 0}>
            Images ({imageFiles.length})
          </TabsTrigger>
          <TabsTrigger value="documents" disabled={documentFiles.length === 0}>
            Documents ({documentFiles.length})
          </TabsTrigger>
          <TabsTrigger value="text" disabled={textFiles.length === 0}>
            Text ({textFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <FileCard
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={onRemoveFile}
                onClick={() => setSelectedFile(index)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imageFiles.map((file, index) => {
              const originalIndex = files.findIndex((f) => f === file);
              return (
                <FileCard
                  key={`${file.name}-${index}`}
                  file={file}
                  index={originalIndex}
                  onRemove={onRemoveFile}
                  onClick={() => setSelectedFile(originalIndex)}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {documentFiles.map((file, index) => {
              const originalIndex = files.findIndex((f) => f === file);
              return (
                <FileCard
                  key={`${file.name}-${index}`}
                  file={file}
                  index={originalIndex}
                  onRemove={onRemoveFile}
                  onClick={() => setSelectedFile(originalIndex)}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {textFiles.map((file, index) => {
              const originalIndex = files.findIndex((f) => f === file);
              return (
                <FileCard
                  key={`${file.name}-${index}`}
                  file={file}
                  index={originalIndex}
                  onRemove={onRemoveFile}
                  onClick={() => setSelectedFile(originalIndex)}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selectedFile !== null && (
        <Dialog
          open={selectedFile !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedFile(null);
          }}
        >
          <DialogContent className="max-w-4xl w-[90vw]">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium mb-4 truncate max-w-full">
                {files[selectedFile]?.name}
              </h3>
              {files[selectedFile]?.preview ? (
                <img
                  src={files[selectedFile].preview}
                  alt={files[selectedFile].name}
                  className="max-h-[70vh] max-w-full object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-md">
                  {getFileIcon(files[selectedFile])}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Preview not available
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {getFileTypeLabel(files[selectedFile].type)}
                  </Badge>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface FileCardProps {
  file: FileWithPreview;
  index: number;
  onRemove?: (index: number) => void;
  onClick?: () => void;
}

function FileCard({ file, index, onRemove, onClick }: FileCardProps) {
  return (
    <div className="relative group border rounded-md overflow-hidden bg-background">
      <div
        className="aspect-square flex items-center justify-center cursor-pointer"
        onClick={onClick}
      >
        {file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full p-4">
            {file.type.includes("pdf") ? (
              <FileIcon className="h-10 w-10 text-red-500" />
            ) : file.type.includes("word") || file.type.includes("docx") ? (
              <FileIcon className="h-10 w-10 text-blue-500" />
            ) : file.type.includes("text") || file.type.includes("txt") ? (
              <FileTextIcon className="h-10 w-10 text-gray-500" />
            ) : file.type.includes("md") ? (
              <FileTextIcon className="h-10 w-10 text-purple-500" />
            ) : (
              <FileIcon className="h-10 w-10" />
            )}
            <Badge variant="outline" className="mt-2">
              {file.type.split("/")[1]?.toUpperCase() || "FILE"}
            </Badge>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onClick}
          >
            <MaximizeIcon className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-2 border-t truncate">
        <p className="text-xs truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
    </div>
  );
}
