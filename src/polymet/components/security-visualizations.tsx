import React from 'react';
import { SecurityReport, StrideCategory } from './security-report';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie,
  Legend
} from 'recharts';

interface SecurityVisualizationsProps {
  report: SecurityReport;
}

export default function SecurityVisualizations({ report }: SecurityVisualizationsProps) {
  // Calculate risk counts for each STRIDE category
  const categoryData = report.strideCategories.map(category => {
    const highRisks = category.risks.filter(risk => risk.severity === 'high').length;
    const mediumRisks = category.risks.filter(risk => risk.severity === 'medium').length;
    const lowRisks = category.risks.filter(risk => risk.severity === 'low').length;

    return {
      name: category.title.split(' ')[0], // Get first word (e.g., "Spoofing" from "Spoofing Threats")
      high: highRisks,
      medium: mediumRisks,
      low: lowRisks,
      total: highRisks + mediumRisks + lowRisks
    };
  });

  // Get total counts by severity
  const totalHighRisks = categoryData.reduce((acc, cat) => acc + cat.high, 0);
  const totalMediumRisks = categoryData.reduce((acc, cat) => acc + cat.medium, 0);
  const totalLowRisks = categoryData.reduce((acc, cat) => acc + cat.low, 0);

  // Prepare data for pie chart
  const severityDistribution = [
    { name: 'High', value: totalHighRisks, color: '#ef4444' },
    { name: 'Medium', value: totalMediumRisks, color: '#f59e0b' },
    { name: 'Low', value: totalLowRisks, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Get severity colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STRIDE Categories Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">STRIDE Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  barSize={30}
                >
                  <XAxis dataKey="name" scale="point" padding={{ left: 20, right: 20 }} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-md shadow-md p-3">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-red-600">High: {data.high}</p>
                            <p className="text-sm text-amber-600">Medium: {data.medium}</p>
                            <p className="text-sm text-green-600">Low: {data.low}</p>
                            <p className="text-sm font-medium mt-1">Total: {data.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" fill="#8884d8">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.high > 0 ? '#ef4444' : entry.medium > 0 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Risk Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} risks`, 'Count']}
                    contentStyle={{ borderRadius: '6px' }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Key Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="flex items-start border-b last:border-0 pb-3 last:pb-0">
                <Badge
                  className="mt-0.5 shrink-0"
                  style={{
                    backgroundColor: getSeverityColor(rec.priority),
                    color: 'white'
                  }}
                >
                  {rec.priority}
                </Badge>
                <div className="ml-3">
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                </div>
              </div>
            ))}
            {report.recommendations.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                + {report.recommendations.length - 5} more recommendations
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Components Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Components at Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.components.map((component, idx) => {
              // Simulate component risk based on position (in a real app you'd use actual data)
              const randomSeverity = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)];
              return (
                <Badge
                  key={idx}
                  variant="outline"
                  className="py-1.5 px-3 text-sm"
                  style={{
                    backgroundColor: `${getSeverityColor(randomSeverity)}20`,
                    borderColor: getSeverityColor(randomSeverity),
                    color: getSeverityColor(randomSeverity)
                  }}
                >
                  {component}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 