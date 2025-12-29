import Link from "next/link";
import { MessageSquare, FileText, Zap, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-industrial-50 to-white">
      {/* Warning stripe accent at top */}
      <div className="h-1.5 warning-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-50 border border-warning-200 rounded-full text-sm font-medium text-warning-800 mb-8">
            <Zap className="w-4 h-4" />
            <span>For Heavy Machinery & Mining Professionals</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-industrial-900 tracking-tight mb-6">
            Your Technical Manuals,
            <br />
            <span className="text-warning-600">One SMS Away</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-industrial-600 max-w-2xl mx-auto mb-10">
            Upload your equipment manuals. Send an SMS with your question. Get
            AI-powered answers instantly. Works anywhere with GSM signal.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-industrial-900 hover:bg-industrial-800 rounded-industrial transition-colors shadow-industrial-lg"
            >
              Start Free Trial
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-industrial-700 bg-white border border-industrial-300 hover:bg-industrial-50 rounded-industrial transition-colors"
            >
              See How It Works
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-industrial-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success-500" />
              <span>14-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-warning-500" />
              <span>Unlimited SMS included</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-industrial-400" />
              <span>PDF, DOCX, XLSX supported</span>
            </div>
          </div>
        </div>

        {/* Demo visualization */}
        <div className="mt-20 relative">
          <div className="max-w-3xl mx-auto">
            {/* Phone mockup */}
            <div className="relative bg-industrial-900 rounded-3xl p-4 shadow-2xl">
              {/* Phone frame */}
              <div className="bg-white rounded-2xl overflow-hidden">
                {/* Status bar */}
                <div className="bg-industrial-100 px-4 py-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-industrial-600">SMS</span>
                  <span className="text-industrial-500">FieldOps AI</span>
                  <span className="font-mono text-industrial-600">4:32 PM</span>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-4 min-h-[280px] bg-industrial-50">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-industrial-900 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm">
                        What&apos;s the torque spec for CAT 320 track adjuster?
                      </p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-industrial-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm text-industrial-800">
                        CAT 320 track adjuster torque: 410 Nm (300 lb-ft). Use
                        lithium grease on threads. Ref: Service Manual Ch. 4.2
                      </p>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-industrial-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-industrial-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-industrial-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-industrial-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="bg-warning-100 border border-warning-200 rounded-lg p-4 shadow-lg transform -rotate-3">
                <FileText className="w-8 h-8 text-warning-600 mb-2" />
                <p className="text-xs font-medium text-industrial-700">
                  500+ page manuals
                </p>
              </div>
            </div>

            <div className="absolute -right-8 top-1/3 hidden lg:block">
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 shadow-lg transform rotate-3">
                <Zap className="w-8 h-8 text-success-600 mb-2" />
                <p className="text-xs font-medium text-industrial-700">
                  Instant answers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
