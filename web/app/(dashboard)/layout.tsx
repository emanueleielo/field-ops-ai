export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-industrial-200 bg-industrial-50 p-4">
        <nav className="space-y-2">
          <div className="mb-6 text-lg font-bold text-industrial-900">
            FieldOps AI
          </div>
          <a
            href="/documents"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Documents
          </a>
          <a
            href="/analytics"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Analytics
          </a>
          <a
            href="/simulator"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Simulator
          </a>
          <a
            href="/billing"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Billing
          </a>
          <a
            href="/activity"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Activity
          </a>
          <a
            href="/settings"
            className="block rounded-industrial p-2 text-industrial-700 hover:bg-industrial-100"
          >
            Settings
          </a>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
