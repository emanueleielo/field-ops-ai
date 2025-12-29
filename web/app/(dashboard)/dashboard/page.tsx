"use client";

import {
  FileText,
  MessageSquare,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock data - will be replaced with API calls
const mockData = {
  quota: {
    used: 8.5,
    limit: 15,
    percentage: 57,
  },
  messages: {
    today: 23,
    total: 342,
    lastHour: 5,
  },
  documents: {
    indexed: 12,
    processing: 2,
    failed: 0,
    total: 14,
  },
  stats: {
    queriesThisMonth: 342,
    successRate: 94.2,
    avgResponseTime: 2.3,
  },
};

function QuotaCard() {
  const { used, limit, percentage } = mockData.quota;
  const variant =
    percentage >= 100 ? "danger" : percentage >= 90 ? "warning" : "default";

  return (
    <Card className="industrial-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Monthly Quota
          </CardTitle>
          <div
            className={cn(
              "px-2 py-0.5 rounded text-xs font-mono font-bold",
              variant === "danger"
                ? "bg-danger-100 text-danger-700"
                : variant === "warning"
                  ? "bg-warning-100 text-warning-700"
                  : "bg-success-100 text-success-700"
            )}
          >
            {percentage}%
          </div>
        </div>
        <CardDescription>Token usage this billing period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={percentage} variant={variant} size="lg" />
          <div className="flex justify-between text-sm">
            <span className="text-industrial-500">
              <span className="font-mono font-bold text-industrial-900">
                {used.toFixed(2)}
              </span>{" "}
              used
            </span>
            <span className="text-industrial-500">
              <span className="font-mono font-bold text-industrial-900">
                {limit.toFixed(2)}
              </span>{" "}
              limit
            </span>
          </div>
        </div>

        {percentage >= 90 && (
          <div
            className={cn(
              "mt-4 p-3 rounded flex items-start gap-2 text-sm",
              percentage >= 100
                ? "bg-danger-50 text-danger-700 border border-danger-200"
                : "bg-warning-50 text-warning-700 border border-warning-200"
            )}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {percentage >= 100
                ? "Quota exceeded. SMS responses are blocked."
                : "Approaching quota limit. Consider upgrading your plan."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessagesCard() {
  const { today, total, lastHour } = mockData.messages;

  return (
    <Card className="industrial-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            SMS Activity
          </CardTitle>
          <MessageSquare className="w-5 h-5 text-industrial-400" />
        </div>
        <CardDescription>Message volume overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-industrial-50 rounded">
            <div className="text-2xl font-bold font-mono text-industrial-900 animate-count-up">
              {lastHour}
            </div>
            <div className="text-xs text-industrial-500 mt-1">Last hour</div>
          </div>
          <div className="text-center p-3 bg-industrial-50 rounded">
            <div className="text-2xl font-bold font-mono text-industrial-900 animate-count-up">
              {today}
            </div>
            <div className="text-xs text-industrial-500 mt-1">Today</div>
          </div>
          <div className="text-center p-3 bg-industrial-50 rounded">
            <div className="text-2xl font-bold font-mono text-industrial-900 animate-count-up">
              {total}
            </div>
            <div className="text-xs text-industrial-500 mt-1">This month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsStatusCard() {
  const { indexed, processing, failed, total } = mockData.documents;

  const statuses = [
    {
      label: "Indexed",
      count: indexed,
      icon: CheckCircle,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Processing",
      count: processing,
      icon: Clock,
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
    {
      label: "Failed",
      count: failed,
      icon: AlertTriangle,
      color: "text-danger-600",
      bg: "bg-danger-50",
    },
  ];

  return (
    <Card className="industrial-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Documents</CardTitle>
          <FileText className="w-5 h-5 text-industrial-400" />
        </div>
        <CardDescription>
          {total} total documents in knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={cn(
                "flex items-center justify-between p-3 rounded",
                status.bg
              )}
            >
              <div className="flex items-center gap-3">
                <status.icon className={cn("w-5 h-5", status.color)} />
                <span className="font-medium text-industrial-700">
                  {status.label}
                </span>
              </div>
              <span className={cn("font-mono font-bold text-lg", status.color)}>
                {status.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStatsCard() {
  const { queriesThisMonth, successRate, avgResponseTime } = mockData.stats;

  const stats = [
    {
      label: "Queries",
      value: queriesThisMonth.toLocaleString(),
      sublabel: "this month",
      icon: Zap,
      trend: "+12%",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      sublabel: "answered correctly",
      icon: CheckCircle,
      trend: "+2.1%",
    },
    {
      label: "Avg Response",
      value: `${avgResponseTime}s`,
      sublabel: "processing time",
      icon: TrendingUp,
      trend: "-0.3s",
    },
  ];

  return (
    <Card className="industrial-panel lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Performance Overview
        </CardTitle>
        <CardDescription>Key metrics for this billing period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-industrial-50 rounded border border-industrial-200"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-industrial-400" />
                <div className="flex items-center text-xs font-medium text-success-600">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {stat.trend}
                </div>
              </div>
              <div className="text-3xl font-bold font-mono text-industrial-900 animate-count-up">
                {stat.value}
              </div>
              <div className="text-sm text-industrial-500 mt-1">
                <span className="font-medium text-industrial-700">
                  {stat.label}
                </span>
                <span className="mx-1">·</span>
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WelcomeBanner() {
  return (
    <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-industrial-900 to-industrial-800 text-white relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.05) 20px,
              rgba(255,255,255,0.05) 21px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.05) 20px,
              rgba(255,255,255,0.05) 21px
            )
          `,
        }}
      />

      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to FieldOps AI
        </h2>
        <p className="text-industrial-300 max-w-xl">
          Your technical documentation assistant is ready. Upload manuals,
          register phone numbers, and start getting AI-powered answers via SMS.
        </p>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-success-400 rounded-full" />
            <span className="text-industrial-200">AI Engine: Online</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-success-400 rounded-full" />
            <span className="text-industrial-200">SMS Gateway: Connected</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-success-400 rounded-full" />
            <span className="text-industrial-200">Vector DB: Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuotaCard />
        <MessagesCard />
        <DocumentsStatusCard />
        <QuickStatsCard />
      </div>
    </div>
  );
}
