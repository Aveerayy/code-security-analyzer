import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/polymet/components/file-uploader";
import FilePreview from "@/polymet/components/file-preview";
import ProcessingStatus, {
  ProcessingStage,
} from "@/polymet/components/processing-status";
import SecurityReport, {
  SecurityReport as SecurityReportType,
} from "@/polymet/components/security-report";
import { chunkTextWithSlidingWindow } from "@/lib/textProcessing";

type FileWithPreview = File & {
  preview?: string;
};

// Helper function to wait a specified time
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle JSON parsing with error handling
const safeJsonParse = (jsonString: string) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return { success: false, error: e };
  }
};

// Use environment variable or set via configuration UI
const apiKey = process.env.REACT_APP_OPENAI_API_KEY || "your-api-key-here";

export default function Dashboard() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentStage, setCurrentStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [securityReport, setSecurityReport] =
    useState<SecurityReportType | null>(null);
  const [rawReportText, setRawReportText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  const handleFilesSelected = (selectedFiles: FileWithPreview[]) => {
    setFiles(selectedFiles);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview as string);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) {
      alert("Please upload at least one file to analyze.");
      return;
    }

    // Reset any previous analysis
    setSecurityReport(null);
    setRawReportText(null);
    setError(undefined);
    setProgress(0);
    setProcessedChunks(0);
    setTotalChunks(0);
    setCurrentStage("ingesting");
    setActiveTab("status");

    try {
      // Extract data from files
      const extractedData = await extractDataFromFiles(files);
      setCurrentStage("analyzing");
      
      // Use the new enhanced endpoint for analysis
      const response = await fetch("http://localhost:3001/api/analyze-security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedData,
          maxChunks: 10 // Limit to 10 chunks for performance
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error analyzing security");
      }
      
      const data = await response.json();
      setProcessedChunks(data.processedChunks);
      setTotalChunks(data.totalChunks);
      setProgress(100);
      
      // Try to parse the result as JSON with our safer parser
      const parseResult = safeJsonParse(data.result);
      
      if (parseResult.success) {
        setSecurityReport(parseResult.data);
        setRawReportText(null);
      } else {
        // If it's not valid JSON, display as raw text
        setSecurityReport(null);
        setRawReportText(data.result);
      }
      
      setCurrentStage("completed");
      setActiveTab("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStage("error");
    }
  };

  const extractDataFromFiles = async (files: FileWithPreview[]): Promise<string> => {
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const text = await file.text();
        return text;
      })
    );
    return fileContents.join("\n");
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentStage("idle");
    setProgress(0);
    setError(undefined);
    setSecurityReport(null);
    setRawReportText(null);
    setActiveTab("upload");
  };

  const getFileStats = () => {
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

    return {
      total: files.length,
      images: imageFiles.length,
      documents: documentFiles.length,
      text: textFiles.length,
    };
  };

  const fileStats = getFileStats();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Architecture Security Analyzer</h1>
          <p className="text-muted-foreground mt-1">
            Upload architecture documents and diagrams for STRIDE security
            analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {currentStage !== "idle" &&
            currentStage !== "completed" &&
            currentStage !== "error" && (
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
            )}
          {(currentStage === "idle" ||
            currentStage === "completed" ||
            currentStage === "error") && (
            <Button onClick={handleReset} variant="outline">
              New Analysis
            </Button>
          )}
          {currentStage === "idle" && (
            <Button onClick={handleStartAnalysis} disabled={files.length === 0}>
              Start Security Analysis
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="upload"
            disabled={
              currentStage !== "idle" &&
              currentStage !== "completed" &&
              currentStage !== "error"
            }
          >
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="status" disabled={currentStage === "idle"}>
            Processing Status
          </TabsTrigger>
          <TabsTrigger value="report" disabled={!securityReport}>
            Security Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Architecture Files</CardTitle>
                  <CardDescription>
                    Drag and drop or browse to upload your architecture
                    documents and diagrams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader onFilesSelected={handleFilesSelected} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>File Summary</CardTitle>
                  <CardDescription>
                    {fileStats.total} files selected for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">Images</p>
                      <p className="text-2xl font-bold">{fileStats.images}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">Documents</p>
                      <p className="text-2xl font-bold">
                        {fileStats.documents}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md col-span-2">
                      <p className="text-sm font-medium">Text/Markdown</p>
                      <p className="text-2xl font-bold">{fileStats.text}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleStartAnalysis}
                    disabled={files.length === 0}
                  >
                    Start Security Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>

            {files.length > 0 && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>File Preview</CardTitle>
                    <CardDescription>
                      Preview and manage uploaded files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FilePreview
                      files={files}
                      onRemoveFile={handleRemoveFile}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
              <CardDescription>
                Real-time status of your security analysis
                {totalChunks > 0 && ` (${processedChunks} of ${totalChunks} chunks processed)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingStatus
                currentStage={currentStage}
                progress={progress}
                error={error}
                processedChunks={processedChunks}
                totalChunks={totalChunks}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          {securityReport ? (
            <SecurityReport report={securityReport} />
          ) : rawReportText ? (
            <Card>
              <CardHeader>
                <CardTitle>Raw Response</CardTitle>
                <CardDescription>
                  The analysis result couldn't be formatted as a structured report.
                  Here's the raw output from the analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        // Format the JSON for better readability
                        const formattedJson = JSON.stringify(JSON.parse(rawReportText), null, 2);
                        // Copy to clipboard
                        navigator.clipboard.writeText(formattedJson);
                        alert("JSON copied to clipboard!");
                      } catch (e) {
                        // If it's not valid JSON, copy as is
                        navigator.clipboard.writeText(rawReportText);
                        alert("Text copied to clipboard!");
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
                  <pre className="text-left text-sm whitespace-pre-wrap w-full font-mono">{
                    (() => {
                      try {
                        // Try to format it nicely if it's valid JSON
                        return JSON.stringify(JSON.parse(rawReportText), null, 2);
                      } catch (e) {
                        // Otherwise just show the raw text
                        return rawReportText;
                      }
                    })()
                  }</pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium">
                  No security report available
                </p>
                <p className="text-muted-foreground mb-6">
                  Upload files and run the analysis to generate a security
                  report
                </p>
                <Button onClick={() => setActiveTab("upload")}>Upload Files</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
