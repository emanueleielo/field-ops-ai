"use client";

import { usePathname } from "next/navigation";
import { Menu, LogOut, Shield } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Users", href: "/admin/users" },
  { name: "Configuration", href: "/admin/config" },
  { name: "Health", href: "/admin/health" },
  { name: "Notifications", href: "/admin/notifications" },
];

interface AdminHeaderProps {
  onMenuClick: () => void;
  notificationsCount?: number;
}

/**
 * Admin header component with title, notifications, and logout
 */
export function AdminHeader({
  onMenuClick,
  notificationsCount = 0,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  const getPageTitle = () => {
    const route = navigation.find((item) => {
      if (item.href === "/admin/dashboard") {
        return pathname === "/admin/dashboard" || pathname === "/admin";
      }
      return pathname.startsWith(item.href);
    });
    return route?.name || "Admin";
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-warning-200">
      {/* Thin amber accent line */}
      <div className="h-0.5 bg-gradient-to-r from-warning-400 via-warning-500 to-warning-400" />

      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-industrial-600 hover:text-industrial-900 hover:bg-industrial-100 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-warning-100 rounded text-warning-700">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Admin</span>
            </div>
            <h1 className="text-xl font-bold text-industrial-900">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <NotificationBell initialCount={notificationsCount} />

          {/* Admin info and logout */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-industrial-200">
            <div className="text-right">
              <p className="text-xs text-industrial-500">Logged in as</p>
              <p className="text-sm font-medium text-industrial-900 truncate max-w-[150px]">
                {admin?.email || "Admin"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-warning-300 text-warning-700 hover:bg-warning-50 hover:text-warning-800"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>

          {/* Mobile logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="sm:hidden text-industrial-600 hover:text-industrial-900"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
