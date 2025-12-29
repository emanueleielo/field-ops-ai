import { Upload, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Manuals",
    description:
      "Upload technical documentation in PDF, DOCX, TXT, XLSX, or CSV format. Our AI indexes everything automatically.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Send an SMS",
    description:
      "Text your question from your registered phone number. No app needed. Works with any basic phone.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Get Instant Answers",
    description:
      "Receive AI-powered responses with references to your documentation. Fast, accurate, reliable.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-industrial-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-industrial-600">
            Get started in minutes. No complex setup. No training required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-industrial-200" />
              )}

              <div className="relative bg-industrial-50 rounded-lg p-8 border border-industrial-200 text-center">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-warning-500 text-industrial-900 font-mono font-bold text-sm px-3 py-1 rounded-full shadow-md">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-xl border border-industrial-200 flex items-center justify-center shadow-sm">
                  <step.icon className="w-8 h-8 text-industrial-700" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-industrial-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-industrial-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Languages Supported", value: "5", detail: "EN, DE, FR, IT, ES" },
            { label: "Response Time", value: "<30s", detail: "Average" },
            { label: "Accuracy Rate", value: "95%+", detail: "Verified answers" },
            { label: "Uptime", value: "99.9%", detail: "Guaranteed" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-industrial-900 rounded-lg p-6 text-center"
            >
              <div className="text-3xl font-bold text-warning-400 mb-1 font-mono">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-white mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-industrial-400">{stat.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
