import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, ClockIcon, LoaderIcon, XIcon, SplitIcon } from "lucide-react";

export type ProcessingStage =
  | "idle"
  | "ingesting"
  | "parsing"
  | "extracting"
  | "analyzing"
  | "rendering"
  | "completed"
  | "error";

interface ProcessingStageInfo {
  label: string;
  description: string;
}

const PROCESSING_STAGES: Record<
  Exclude<ProcessingStage, "idle" | "error">,
  ProcessingStageInfo
> = {
  ingesting: {
    label: "Ingesting",
    description: "Uploading and processing files",
  },
  parsing: {
    label: "Parsing",
    description: "Converting files to text",
  },
  extracting: {
    label: "Extracting Data",
    description: "Identifying architecture components",
  },
  analyzing: {
    label: "Running Security Review",
    description: "Analyzing with STRIDE framework using advanced chunking",
  },
  rendering: {
    label: "Rendering Results",
    description: "Preparing the security report",
  },
  completed: {
    label: "Completed",
    description: "Security analysis complete",
  },
};

interface ProcessingStatusProps {
  currentStage: ProcessingStage;
  error?: string;
  progress?: number;
  processedChunks?: number;
  totalChunks?: number;
}

export default function ProcessingStatus({
  currentStage,
  error,
  progress = 0,
  processedChunks = 0,
  totalChunks = 0,
}: ProcessingStatusProps) {
  if (currentStage === "idle") {
    return null;
  }

  const stageKeys = Object.keys(PROCESSING_STAGES) as Array<
    keyof typeof PROCESSING_STAGES
  >;

  const currentStageIndex = stageKeys.indexOf(
    currentStage as keyof typeof PROCESSING_STAGES
  );

  // Calculate progress percentage based on stages
  const stageProgress =
    currentStage === "completed"
      ? 100
      : currentStage === "error"
        ? progress
        : Math.min(
            Math.round(
              ((currentStageIndex + 1) / stageKeys.length) * 100 -
                100 / stageKeys.length +
                (progress / 100) * (100 / stageKeys.length)
            ),
            99
          );

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Processing Status</h3>
        {currentStage === "error" ? (
          <Badge variant="destructive" className="px-2 py-1">
            Error
          </Badge>
        ) : currentStage === "completed" ? (
          <Badge
            variant="default"
            className="bg-green-500 hover:bg-green-600 px-2 py-1"
          >
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="px-2 py-1">
            <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )}
      </div>

      <Progress value={stageProgress} className="h-2" />

      {currentStage === "analyzing" && totalChunks > 0 && (
        <div className="bg-primary/5 p-3 rounded-md border border-primary/20 flex items-center">
          <SplitIcon className="h-4 w-4 mr-2 text-primary" />
          <div>
            <p className="text-sm font-medium">Advanced Chunking</p>
            <p className="text-xs text-muted-foreground">
              Processing chunks with sliding windows: {processedChunks} of {totalChunks} complete
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {stageKeys.map((stage, index) => {
          const stageInfo = PROCESSING_STAGES[stage];
          const isCurrentStage = currentStage === stage;
          const isPastStage =
            currentStageIndex > index || currentStage === "completed";
          const isErrorStage = currentStage === "error" && isCurrentStage;
          const isFutureStage =
            currentStageIndex < index && currentStage !== "completed";

          return (
            <div
              key={stage}
              className={`flex items-center p-3 rounded-md border ${
                isCurrentStage
                  ? "bg-primary/5 border-primary/20"
                  : isPastStage
                    ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20"
                    : "bg-muted/30 border-muted"
              }`}
            >
              <div
                className={`flex items-center justify-center h-6 w-6 rounded-full mr-3 ${
                  isPastStage
                    ? "bg-green-500 text-white"
                    : isErrorStage
                      ? "bg-red-500 text-white"
                      : isCurrentStage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {isPastStage ? (
                  <CheckIcon className="h-3 w-3" />
                ) : isErrorStage ? (
                  <XIcon className="h-3 w-3" />
                ) : isCurrentStage ? (
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                ) : (
                  <ClockIcon className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isFutureStage ? "text-muted-foreground" : ""
                  }`}
                >
                  {stageInfo.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stageInfo.description}
                  {isCurrentStage && stage === "analyzing" && totalChunks > 0 && (
                    <span className="ml-1 font-medium text-primary">
                      ({processedChunks}/{totalChunks} chunks)
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {currentStage === "error" && error && (
          <div className="p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              Error: {error}
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              Please try again or contact support if the problem persists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
