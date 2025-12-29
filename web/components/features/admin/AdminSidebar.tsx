"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  Bell,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Configuration", href: "/admin/config", icon: Settings },
  { name: "Health", href: "/admin/health", icon: Activity },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Admin sidebar navigation component
 * Amber/warning colored to distinguish from user dashboard
 */
export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
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
        {/* Amber warning stripes at top - admin distinction */}
        <div className="h-2 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500" />

        <div className="flex flex-col h-[calc(100%-8px)] p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-500 rounded flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-industrial-900" />
              </div>
              <div>
                <div className="font-bold text-white tracking-tight">
                  Admin Panel
                </div>
                <div className="text-xs text-warning-400 font-mono">
                  FieldOps AI
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
                      ? "bg-warning-500/20 text-white"
                      : "text-industrial-300 hover:bg-industrial-800/50 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      active
                        ? "text-warning-400"
                        : "text-industrial-400 group-hover:text-industrial-300"
                    )}
                  />
                  {item.name}
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-warning-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin badge */}
          <div className="pt-4 border-t border-industrial-700">
            <div className="flex items-center gap-2 px-3 py-2 bg-warning-500/10 rounded-lg">
              <Shield className="w-4 h-4 text-warning-500" />
              <span className="text-xs font-medium text-warning-400 uppercase tracking-wider">
                Administrator Access
              </span>
            </div>
          </div>
        </div>

        {/* Amber warning stripe at bottom */}
        <div className="h-1 bg-warning-500" />
      </aside>
    </>
  );
}
