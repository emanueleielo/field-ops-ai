"use client";

import { useState } from "react";
import {
  BarChart3,
  FileText,
  Zap,
  CheckCircle,
  TrendingUp,
  Download,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock data - replace with API calls
const mockAnalytics = {
  queryCount: 342,
  quotaPercentage: 57,
  successRate: 94.2,
  avgResponseTime: 2.3,
  topDocuments: [
    { id: "1", filename: "CAT-320-Service-Manual.pdf", queryCount: 89 },
    { id: "2", filename: "Komatsu-PC200-Parts.pdf", queryCount: 67 },
    { id: "3", filename: "Volvo-EC220E-Maintenance.pdf", queryCount: 45 },
    { id: "4", filename: "Hitachi-EX200-Troubleshooting.pdf", queryCount: 34 },
    { id: "5", filename: "Liebherr-R924-Operations.pdf", queryCount: 28 },
  ],
  frequentQueries: [
    { query: "oil filter change", count: 45 },
    { query: "hydraulic pressure", count: 38 },
    { query: "engine error codes", count: 32 },
    { query: "track tension adjustment", count: 28 },
    { query: "coolant specifications", count: 24 },
    { query: "fuel system bleeding", count: 21 },
    { query: "swing bearing lubrication", count: 18 },
    { query: "bucket cylinder repair", count: 15 },
  ],
  dailyTrend: [
    { date: "Dec 1", count: 12 },
    { date: "Dec 2", count: 18 },
    { date: "Dec 3", count: 15 },
    { date: "Dec 4", count: 8 },
    { date: "Dec 5", count: 22 },
    { date: "Dec 6", count: 19 },
    { date: "Dec 7", count: 25 },
    { date: "Dec 8", count: 14 },
    { date: "Dec 9", count: 28 },
    { date: "Dec 10", count: 32 },
    { date: "Dec 11", count: 21 },
    { date: "Dec 12", count: 35 },
    { date: "Dec 13", count: 29 },
    { date: "Dec 14", count: 38 },
  ],
};

type DateRange = "7d" | "30d" | "90d";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Queries", mockAnalytics.queryCount.toString()],
      ["Success Rate", `${mockAnalytics.successRate}%`],
      ["Avg Response Time", `${mockAnalytics.avgResponseTime}s`],
      ["Quota Used", `${mockAnalytics.quotaPercentage}%`],
      [""],
      ["Top Documents", "Query Count"],
      ...mockAnalytics.topDocuments.map((d) => [d.filename, d.queryCount.toString()]),
      [""],
      ["Frequent Queries", "Count"],
      ...mockAnalytics.frequentQueries.map((q) => [q.query, q.count.toString()]),
    ];

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fieldops-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with date range and export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-industrial-900">
            Usage Analytics
          </h2>
          <p className="text-sm text-industrial-500">
            Monitor your AI assistant usage and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-industrial-100 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  dateRange === range
                    ? "bg-white text-industrial-900 shadow-sm"
                    : "text-industrial-600 hover:text-industrial-900"
                )}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Query Count */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Total Queries
                </p>
                <p className="text-2xl font-bold font-mono text-industrial-900">
                  {mockAnalytics.queryCount}
                </p>
                <p className="text-xs text-success-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last period
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-industrial-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Success Rate
                </p>
                <p className="text-2xl font-bold font-mono text-success-600">
                  {mockAnalytics.successRate}%
                </p>
                <p className="text-xs text-success-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1% improvement
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Avg Response
                </p>
                <p className="text-2xl font-bold font-mono text-industrial-900">
                  {mockAnalytics.avgResponseTime}s
                </p>
                <p className="text-xs text-success-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -0.3s faster
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-industrial-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quota Usage */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Quota Used
                </p>
                <p className="text-2xl font-bold font-mono text-industrial-900">
                  {mockAnalytics.quotaPercentage}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-industrial-600" />
              </div>
            </div>
            <Progress value={mockAnalytics.quotaPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <Card className="industrial-panel">
          <CardHeader>
            <CardTitle>Query Trend</CardTitle>
            <CardDescription>Daily query volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockAnalytics.dailyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ca8a04"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ca8a04" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Frequent Queries */}
        <Card className="industrial-panel">
          <CardHeader>
            <CardTitle>Frequent Queries</CardTitle>
            <CardDescription>Most common questions asked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockAnalytics.frequentQueries.slice(0, 6)}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="query"
                    stroke="#6b7280"
                    fontSize={11}
                    width={120}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" fill="#374151" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Documents */}
      <Card className="industrial-panel">
        <CardHeader>
          <CardTitle>Top Documents</CardTitle>
          <CardDescription>
            Most frequently referenced documents in AI responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.topDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-industrial-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-industrial-200 flex items-center justify-center font-mono text-sm font-bold text-industrial-600">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-industrial-400" />
                    <span className="font-medium text-industrial-900">
                      {doc.filename}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 hidden sm:block">
                    <Progress
                      value={(doc.queryCount / mockAnalytics.topDocuments[0].queryCount) * 100}
                      className="h-2"
                    />
                  </div>
                  <span className="font-mono font-bold text-industrial-900 w-12 text-right">
                    {doc.queryCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
