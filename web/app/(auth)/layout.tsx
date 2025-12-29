import Link from "next/link";
import { HardHat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-industrial-100 flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-industrial-900 relative overflow-hidden">
        {/* Industrial pattern background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.03) 50px,
                rgba(255,255,255,0.03) 51px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.03) 50px,
                rgba(255,255,255,0.03) 51px
              )
            `,
          }}
        />

        {/* Warning stripes at top */}
        <div className="absolute top-0 left-0 right-0 h-2 warning-stripe" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-warning-500 rounded flex items-center justify-center">
              <HardHat className="w-7 h-7 text-industrial-900" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              FieldOps AI
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Technical Knowledge
            <br />
            <span className="text-warning-500">At Your Fingertips</span>
          </h1>

          <p className="text-industrial-300 text-lg max-w-md leading-relaxed">
            SMS-based AI assistant for field technicians in Heavy Machinery & Mining.
            Get instant answers from your technical manuals, anywhere.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-warning-500 font-mono">
                &lt;30s
              </div>
              <div className="text-sm text-industrial-400 mt-1">
                Response Time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-warning-500 font-mono">
                99.5%
              </div>
              <div className="text-sm text-industrial-400 mt-1">
                Accuracy Rate
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-warning-500 font-mono">
                24/7
              </div>
              <div className="text-sm text-industrial-400 mt-1">
                Availability
              </div>
            </div>
          </div>
        </div>

        {/* Warning stripes at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 warning-stripe" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-industrial-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-warning-500 rounded flex items-center justify-center">
              <HardHat className="w-5 h-5 text-industrial-900" />
            </div>
            <span className="font-bold text-industrial-900">FieldOps AI</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-industrial-500">
          <Link href="/privacy" className="hover:text-industrial-700">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-industrial-700">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
