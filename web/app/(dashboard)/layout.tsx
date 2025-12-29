"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardHat,
  LayoutDashboard,
  FileText,
  BarChart3,
  MessageSquare,
  Activity,
  Settings,
  CreditCard,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth/actions";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ChangelogProvider, useChangelog } from "@/components/features/changelog";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Chat Simulator", href: "/simulator", icon: MessageSquare },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-industrial-950/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-industrial-900 transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Warning stripes at top */}
        <div className="h-1.5 warning-stripe" />

        <div className="flex flex-col h-[calc(100%-6px)] p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-500 rounded flex items-center justify-center shadow-lg">
                <HardHat className="w-6 h-6 text-industrial-900" />
              </div>
              <div>
                <div className="font-bold text-white tracking-tight">
                  FieldOps AI
                </div>
                <div className="text-xs text-industrial-400 font-mono">
                  v1.0.0
                </div>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-industrial-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all group",
                    active
                      ? "bg-industrial-800 text-white nav-item-active"
                      : "text-industrial-300 hover:bg-industrial-800/50 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      active
                        ? "text-warning-500"
                        : "text-industrial-400 group-hover:text-industrial-300"
                    )}
                  />
                  {item.name}
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-warning-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="pt-4 border-t border-industrial-700">
            <div className="px-3 py-2">
              <div className="text-xs text-industrial-500 uppercase tracking-wider mb-1">
                Logged in as
              </div>
              <div className="text-sm text-industrial-200 truncate font-medium">
                {user?.email || "Loading..."}
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded text-sm font-medium text-industrial-400 hover:bg-industrial-800/50 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Warning stripes at bottom */}
        <div className="h-1.5 warning-stripe" />
      </aside>
    </>
  );
}

function WhatsNewButton() {
  const { showChangelog, hasUnseenChanges, currentVersion } = useChangelog();

  return (
    <button
      onClick={showChangelog}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        hasUnseenChanges
          ? "bg-warning-100 text-warning-800 border border-warning-200 hover:bg-warning-200"
          : "bg-industrial-100 text-industrial-600 hover:bg-industrial-200"
      )}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">What&apos;s New</span>
      <span className="font-mono">v{currentVersion}</span>
      {hasUnseenChanges && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const route = navigation.find((item) => {
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(item.href);
    });
    return route?.name || "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-industrial-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-industrial-600 hover:text-industrial-900 hover:bg-industrial-100 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-industrial-900">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* What's New Button */}
          <WhatsNewButton />

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success-50 border border-success-200 rounded-full">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-success-700">
              System Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryProvider>
      <ChangelogProvider>
        <div className="flex min-h-screen bg-industrial-100">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="flex-1 p-4 lg:p-8 overflow-auto scrollbar-industrial">
              <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
            </main>
          </div>
        </div>
      </ChangelogProvider>
    </QueryProvider>
  );
}
