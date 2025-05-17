import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, AlertTriangleIcon, ShieldIcon } from "lucide-react";

export type StrideSeverity = "high" | "medium" | "low";

export interface StrideRisk {
  description: string;
  severity: StrideSeverity;
  remediation: string;
  technicalNotes?: string;
}

export interface StrideCategoryProps {
  title: string;
  description: string;
  risks: StrideRisk[];
  expanded?: boolean;
}

export default function StrideCategory({
  title,
  description,
  risks,
  expanded = false,
}: StrideCategoryProps) {
  const highRisks = risks.filter((risk) => risk.severity === "high").length;
  const mediumRisks = risks.filter((risk) => risk.severity === "medium").length;
  const lowRisks = risks.filter((risk) => risk.severity === "low").length;

  const getSeverityColor = (severity: StrideSeverity) => {
    switch (severity) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30";
      case "medium":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800/30";
    }
  };

  return (
    <Collapsible
      defaultOpen={expanded}
      className="border rounded-lg overflow-hidden"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted/50 hover:bg-muted/80 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-primary/10">
            <ShieldIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {highRisks > 0 && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/30"
            >
              {highRisks} High
            </Badge>
          )}
          {mediumRisks > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30"
            >
              {mediumRisks} Medium
            </Badge>
          )}
          {lowRisks > 0 && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30"
            >
              {lowRisks} Low
            </Badge>
          )}
          {risks.length === 0 && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30"
            >
              No Risks
            </Badge>
          )}
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 collapsible-indicator" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {risks.length > 0 ? (
            risks.map((risk, index) => (
              <div
                key={index}
                className={`border rounded-md p-4 ${getSeverityColor(risk.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangleIcon className="h-5 w-5 mr-2" />

                    <h4 className="font-medium">Risk Vector {index + 1}</h4>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      risk.severity === "high"
                        ? "border-red-300 dark:border-red-700"
                        : risk.severity === "medium"
                          ? "border-amber-300 dark:border-amber-700"
                          : "border-green-300 dark:border-green-700"
                    }`}
                  >
                    {risk.severity} Severity
                  </Badge>
                </div>
                <p className="text-sm mb-3">{risk.description}</p>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Remediation Steps:</h5>
                  <p className="text-sm">{risk.remediation}</p>
                  {risk.technicalNotes && (
                    <>
                      <h5 className="text-sm font-medium mt-2">
                        Technical Notes:
                      </h5>
                      <p className="text-sm font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
                        {risk.technicalNotes}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No risks identified in this category
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
