import Link from "next/link";
import { HardHat } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-industrial-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-500 rounded flex items-center justify-center shadow-lg">
                <HardHat className="w-6 h-6 text-industrial-900" />
              </div>
              <span className="font-bold text-xl text-industrial-900 tracking-tight">
                FieldOps AI
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-industrial-600 hover:text-industrial-900 transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-industrial-600 hover:text-industrial-900 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-industrial-600 hover:text-industrial-900 transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-industrial-600 hover:text-industrial-900 transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-industrial-900 hover:bg-industrial-800 rounded-industrial transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with padding for fixed header */}
      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="bg-industrial-900 text-industrial-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-warning-500 rounded flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-industrial-900" />
                </div>
                <span className="font-bold text-xl text-white tracking-tight">
                  FieldOps AI
                </span>
              </div>
              <p className="text-sm text-industrial-400 max-w-md">
                SMS-based AI assistant for field technicians in Heavy Machinery
                & Mining. Get instant answers from your technical manuals,
                anywhere.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-industrial-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-industrial-400">
              &copy; {new Date().getFullYear()} FieldOps AI. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-industrial-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-industrial-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
