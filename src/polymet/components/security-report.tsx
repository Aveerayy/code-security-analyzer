import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DownloadIcon,
  PrinterIcon,
  MailIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";
import StrideCategory, {
  StrideRisk,
} from "@/polymet/components/stride-category";
import SecurityVisualizations from "@/polymet/components/security-visualizations";

export interface StrideCategory {
  title: string;
  description: string;
  risks: StrideRisk[];
}

export interface SecurityRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface SecurityReport {
  summary: string;
  components: string[];
  dataFlows: string[];
  keywords: string[];
  strideCategories: StrideCategory[];
  recommendations: SecurityRecommendation[];
  timestamp: string;
}

interface SecurityReportProps {
  report: SecurityReport;
}

export default function SecurityReport({ report }: SecurityReportProps) {
  const [activeTab, setActiveTab] = useState("summary");

  const totalRisks = report.strideCategories.reduce(
    (acc, category) => acc + category.risks.length,
    0
  );

  const highRisks = report.strideCategories.reduce(
    (acc, category) =>
      acc + category.risks.filter((risk) => risk.severity === "high").length,
    0
  );

  const mediumRisks = report.strideCategories.reduce(
    (acc, category) =>
      acc + category.risks.filter((risk) => risk.severity === "medium").length,
    0
  );

  const lowRisks = report.strideCategories.reduce(
    (acc, category) =>
      acc + category.risks.filter((risk) => risk.severity === "low").length,
    0
  );

  const overallSeverity =
    highRisks > 0
      ? "high"
      : mediumRisks > 0
        ? "medium"
        : lowRisks > 0
          ? "low"
          : "none";

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-amber-600 dark:text-amber-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="ml-2">
            High Risk
          </Badge>
        );

      case "medium":
        return (
          <Badge
            variant="outline"
            className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30"
          >
            Medium Risk
          </Badge>
        );

      case "low":
        return (
          <Badge
            variant="outline"
            className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30"
          >
            Low Risk
          </Badge>
        );

      default:
        return (
          <Badge
            variant="outline"
            className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30"
          >
            No Risk
          </Badge>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Security Analysis Report</h2>
          <p className="text-muted-foreground">
            Generated on {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <MailIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            Executive Summary
            {getSeverityBadge(overallSeverity)}
          </CardTitle>
          <CardDescription>
            Overall security assessment of your architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className="text-sm leading-relaxed">{report.summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalRisks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.components.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Data Flows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.dataFlows.length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="md:w-64 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangleIcon className="h-4 w-4 text-red-500 mr-2" />

                  <span className="text-sm">High Severity</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                >
                  {highRisks}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500 mr-2" />

                  <span className="text-sm">Medium Severity</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  {mediumRisks}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangleIcon className="h-4 w-4 text-green-500 mr-2" />

                  <span className="text-sm">Low Severity</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                >
                  {lowRisks}
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Detected Components
                </h4>
                <div className="flex flex-wrap gap-1">
                  {report.components.slice(0, 5).map((component, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {component}
                    </Badge>
                  ))}
                  {report.components.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{report.components.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {report.keywords.slice(0, 5).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {report.keywords.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{report.keywords.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="summary">STRIDE Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualizations" className="space-y-4 mt-6">
          <SecurityVisualizations report={report} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-6">
          {report.strideCategories.map((category, index) => (
            <StrideCategory
              key={index}
              title={category.title}
              description={category.description}
              risks={category.risks}
              expanded={index === 0}
            />
          ))}
        </TabsContent>
        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Actionable Recommendations
              </CardTitle>
              <CardDescription>
                Prioritized security improvements for your architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {report.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-md ${
                      recommendation.priority === "high"
                        ? "border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10"
                        : recommendation.priority === "medium"
                          ? "border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10"
                          : "border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`p-2 rounded-full mr-4 ${
                          recommendation.priority === "high"
                            ? "bg-red-100 dark:bg-red-900/20"
                            : recommendation.priority === "medium"
                              ? "bg-amber-100 dark:bg-amber-900/20"
                              : "bg-green-100 dark:bg-green-900/20"
                        }`}
                      >
                        <CheckCircleIcon
                          className={`h-5 w-5 ${
                            recommendation.priority === "high"
                              ? "text-red-600 dark:text-red-400"
                              : recommendation.priority === "medium"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">
                            {recommendation.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`capitalize ${
                              recommendation.priority === "high"
                                ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                                : recommendation.priority === "medium"
                                  ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                                  : "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                            }`}
                          >
                            {recommendation.priority} Priority
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm">
                          {recommendation.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
