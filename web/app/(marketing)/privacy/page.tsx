import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - FieldOps AI",
  description:
    "Privacy Policy for FieldOps AI, the SMS-based AI assistant for field technicians.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 29, 2024";

  return (
    <div className="min-h-screen bg-industrial-50">
      {/* Header section */}
      <div className="bg-industrial-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-industrial-300">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-industrial-md p-8 sm:p-12">
          <div className="prose prose-industrial max-w-none">
            {/* Introduction */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Introduction
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                FieldOps AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
                is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our SMS-based AI assistant service for
                technical documentation in Heavy Machinery & Mining industries.
              </p>
              <p className="text-industrial-600 leading-relaxed">
                By using FieldOps AI, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                Account Information
              </h3>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>Company name and contact information</li>
                <li>Administrator email address</li>
                <li>Phone numbers authorized to use the service</li>
                <li>Billing and payment information</li>
              </ul>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                Technical Documents
              </h3>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  PDF manuals and technical documentation you upload to the
                  platform
                </li>
                <li>
                  Document metadata (filename, size, upload date, page count)
                </li>
                <li>
                  Processed text and vector embeddings generated from your
                  documents
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                SMS Messages and Queries
              </h3>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>Questions sent via SMS to our service</li>
                <li>AI-generated responses</li>
                <li>
                  Conversation history (retained for up to 30 days, then
                  automatically deleted)
                </li>
                <li>Phone numbers of users sending queries</li>
              </ul>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                Usage Data
              </h3>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>Number of queries and token consumption</li>
                <li>Response times and service performance metrics</li>
                <li>Feature usage patterns</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  <strong>Service Delivery:</strong> To process your documents,
                  answer technical questions via SMS, and provide AI-powered
                  responses
                </li>
                <li>
                  <strong>AI Processing:</strong> To generate vector embeddings
                  and perform semantic search across your technical
                  documentation
                </li>
                <li>
                  <strong>Conversation Context:</strong> To maintain conversation
                  history (last 5 messages) for more accurate and contextual
                  responses
                </li>
                <li>
                  <strong>Analytics:</strong> To provide usage statistics,
                  monitor service performance, and improve our AI capabilities
                </li>
                <li>
                  <strong>Billing:</strong> To manage your subscription and
                  process payments
                </li>
                <li>
                  <strong>Support:</strong> To respond to your inquiries and
                  provide technical assistance
                </li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Data Retention
              </h2>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  <strong>SMS Messages:</strong> Automatically deleted after 30
                  days
                </li>
                <li>
                  <strong>Documents:</strong> Retained until you delete them or
                  close your account
                </li>
                <li>
                  <strong>Account Data:</strong> Retained for the duration of
                  your subscription plus any legally required retention period
                </li>
                <li>
                  <strong>Usage Analytics:</strong> Aggregated data may be
                  retained indefinitely for service improvement
                </li>
              </ul>
            </section>

            {/* Third-Party Data Processors */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Third-Party Data Processors
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                We use the following third-party services to operate FieldOps
                AI:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-3">
                <li>
                  <strong>Supabase:</strong> Database hosting and user
                  authentication (PostgreSQL database for account data, document
                  metadata, and conversation history)
                </li>
                <li>
                  <strong>Anthropic (Claude) / OpenAI / Google:</strong> AI
                  language models for processing your questions and generating
                  responses. Your queries are sent to these services for
                  processing
                </li>
                <li>
                  <strong>Twilio:</strong> SMS gateway for sending and receiving
                  text messages. Phone numbers and message content are processed
                  through Twilio&apos;s infrastructure
                </li>
                <li>
                  <strong>Qdrant:</strong> Vector database for storing and
                  searching document embeddings to enable semantic search
                  capabilities
                </li>
              </ul>
              <p className="text-industrial-600 leading-relaxed mt-4">
                Each of these providers maintains their own privacy policies and
                data handling practices. We recommend reviewing their respective
                privacy policies for more information.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Your Rights
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data
                  we hold about you
                </li>
                <li>
                  <strong>Export:</strong> Export your uploaded documents and
                  conversation history
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  personal data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  data (subject to legal retention requirements)
                </li>
                <li>
                  <strong>Restriction:</strong> Request restriction of
                  processing under certain circumstances
                </li>
                <li>
                  <strong>Objection:</strong> Object to processing of your
                  personal data for certain purposes
                </li>
              </ul>
              <p className="text-industrial-600 leading-relaxed mt-4">
                To exercise any of these rights, please contact us using the
                information provided below.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Data Security
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures
                to protect your data, including:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>Encryption of data in transit (TLS/HTTPS)</li>
                <li>Encryption of data at rest</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
                <li>Secure data center hosting with industry certifications</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Children&apos;s Privacy
              </h2>
              <p className="text-industrial-600 leading-relaxed">
                FieldOps AI is designed for professional use in industrial
                settings and is not intended for individuals under 18 years of
                age. We do not knowingly collect personal information from
                children.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Changes to This Privacy Policy
              </h2>
              <p className="text-industrial-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date. For
                significant changes, we will provide additional notice via email
                to account administrators.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                Contact Us
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="bg-industrial-50 p-6 rounded-lg">
                <p className="text-industrial-700 font-medium">FieldOps AI</p>
                <p className="text-industrial-600">
                  Email: privacy@fieldops.ai
                </p>
              </div>
            </section>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-industrial-200">
            <Link
              href="/"
              className="text-industrial-600 hover:text-industrial-900 transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
