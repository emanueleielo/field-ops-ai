"use client";

import { Sparkles, Zap, Wrench, Bug, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChangelogEntry {
  type: "feature" | "improvement" | "fix" | "breaking";
  text: string;
}

export interface ChangelogData {
  version: string;
  date: string;
  title?: string;
  changes: ChangelogEntry[];
}

interface ChangelogModalProps {
  changelog: ChangelogData;
  isOpen: boolean;
  onClose: () => void;
}

const CHANGE_TYPE_CONFIG = {
  feature: {
    icon: Sparkles,
    label: "New Feature",
    color: "text-success-600",
    bgColor: "bg-success-100",
    borderColor: "border-success-200",
  },
  improvement: {
    icon: Zap,
    label: "Improvement",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
  },
  fix: {
    icon: Bug,
    label: "Bug Fix",
    color: "text-warning-600",
    bgColor: "bg-warning-100",
    borderColor: "border-warning-200",
  },
  breaking: {
    icon: Wrench,
    label: "Breaking Change",
    color: "text-danger-600",
    bgColor: "bg-danger-100",
    borderColor: "border-danger-200",
  },
};

export function ChangelogModal({
  changelog,
  isOpen,
  onClose,
}: ChangelogModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group changes by type
  const groupedChanges = changelog.changes.reduce(
    (acc, change) => {
      if (!acc[change.type]) {
        acc[change.type] = [];
      }
      acc[change.type].push(change);
      return acc;
    },
    {} as Record<string, ChangelogEntry[]>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header with decorative elements */}
        <div className="relative">
          {/* Background accent */}
          <div className="absolute -top-6 -left-6 -right-6 h-32 bg-gradient-to-br from-warning-100 via-warning-50 to-transparent -z-10" />

          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-warning-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-industrial-900">
              {changelog.title || "What's New"}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 bg-industrial-100 rounded font-mono text-sm font-semibold text-industrial-700">
                v{changelog.version}
              </span>
              <span className="text-industrial-400">•</span>
              <span>{formatDate(changelog.date)}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-industrial">
          {(Object.keys(CHANGE_TYPE_CONFIG) as Array<keyof typeof CHANGE_TYPE_CONFIG>).map(
            (type) => {
              const changes = groupedChanges[type];
              if (!changes?.length) return null;

              const config = CHANGE_TYPE_CONFIG[type];
              const Icon = config.icon;

              return (
                <div key={type} className="space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    </div>
                    <h4 className="font-semibold text-industrial-900 uppercase text-xs tracking-wider">
                      {config.label}s
                    </h4>
                    <span className="text-xs text-industrial-400 font-mono">
                      ({changes.length})
                    </span>
                  </div>

                  {/* Changes */}
                  <ul className="space-y-2 pl-8">
                    {changes.map((change, index) => (
                      <li
                        key={index}
                        className={cn(
                          "relative text-sm text-industrial-700 pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full",
                          config.bgColor.replace("bg-", "before:bg-")
                        )}
                      >
                        {change.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-industrial-200">
          <Button onClick={onClose} className="w-full">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
