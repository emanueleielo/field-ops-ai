"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar, AdminHeader } from "@/components/features/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminApi } from "@/lib/api/admin-client";
import { QueryProvider } from "@/components/providers/QueryProvider";

/**
 * Admin layout with dedicated sidebar and header
 * Separated from user dashboard with amber/warning color scheme
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if on login page
  const isLoginPage = pathname === "/admin/login";

  // Redirect to login if not authenticated and not on login page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Redirect to dashboard if authenticated and on login page
  useEffect(() => {
    if (!isLoading && isAuthenticated && isLoginPage) {
      router.push("/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Fetch notifications count on mount
  useEffect(() => {
    if (isAuthenticated && !isLoginPage) {
      const fetchNotificationsCount = async () => {
        try {
          const data = await adminApi.getDashboard();
          setNotificationsCount(data.notifications_count || 0);
        } catch {
          // Ignore errors - just don't show notification count
        }
      };

      fetchNotificationsCount();

      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isLoginPage]);

  // For login page, render without sidebar/header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-industrial-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-warning-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-industrial-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-industrial-100">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            onMenuClick={() => setSidebarOpen(true)}
            notificationsCount={notificationsCount}
          />

          <main className="flex-1 p-4 lg:p-8 overflow-auto scrollbar-industrial">
            <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
