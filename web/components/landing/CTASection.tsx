import Link from "next/link";
import { Shield, Zap, Clock } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-industrial-900 relative overflow-hidden">
      {/* Warning stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 warning-stripe" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              white 10px,
              white 11px
            )`,
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-500/20 border border-warning-500/30 rounded-full text-sm font-medium text-warning-400 mb-8">
          <Shield className="w-4 h-4" />
          <span>14-day money-back guarantee</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Field Operations?
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-industrial-300 max-w-2xl mx-auto mb-10">
          Join field technicians who are saving hours every week with instant
          access to their technical manuals.
        </p>

        {/* CTA Button */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-industrial-900 bg-warning-500 hover:bg-warning-400 rounded-industrial transition-colors shadow-lg"
        >
          <Zap className="w-5 h-5" />
          Start Your Free Trial
        </Link>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-industrial-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Setup in 5 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>No credit card required to start</span>
          </div>
        </div>
      </div>

      {/* Warning stripe accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 warning-stripe" />
    </section>
  );
}
