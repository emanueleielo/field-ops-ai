import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - FieldOps AI",
  description:
    "Terms of Service for FieldOps AI, the SMS-based AI assistant for field technicians.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "December 29, 2024";

  return (
    <div className="min-h-screen bg-industrial-50">
      {/* Header section */}
      <div className="bg-industrial-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-industrial-300">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-industrial-md p-8 sm:p-12">
          <div className="prose prose-industrial max-w-none">
            {/* AI Disclaimer - Prominent */}
            <section className="mb-10 p-6 bg-warning-50 border border-warning-200 rounded-lg">
              <h2 className="text-xl font-bold text-warning-800 mb-3 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Important AI Disclaimer
              </h2>
              <p className="text-warning-700 leading-relaxed font-medium">
                DISCLAIMER: FieldOps AI provides AI-generated responses based on
                uploaded documents. Responses do not replace professional
                judgment. Users are responsible for verifying information before
                operational use. FieldOps AI disclaims all liability for damages
                arising from use of provided responses.
              </p>
            </section>

            {/* Introduction */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                Welcome to FieldOps AI. These Terms of Service
                (&quot;Terms&quot;) govern your access to and use of the
                FieldOps AI service (&quot;Service&quot;), including our
                website, SMS-based assistant, and related services.
              </p>
              <p className="text-industrial-600 leading-relaxed">
                By accessing or using our Service, you agree to be bound by
                these Terms. If you disagree with any part of the Terms, you may
                not access the Service.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                2. Service Description
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                FieldOps AI is an SMS-based AI assistant designed for field
                technicians in Heavy Machinery & Mining industries. The Service
                provides:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  Document upload and processing for technical manuals and
                  documentation
                </li>
                <li>
                  AI-powered question answering via SMS based on your uploaded
                  documents
                </li>
                <li>
                  Semantic and keyword search capabilities across your
                  documentation
                </li>
                <li>Usage analytics and quota management</li>
                <li>Web-based dashboard for document and account management</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                3. User Responsibilities
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                As a user of FieldOps AI, you agree to:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  Provide accurate and complete account information and keep it
                  updated
                </li>
                <li>
                  Maintain the confidentiality of your account credentials
                </li>
                <li>
                  Only upload documents you have the right to use and share
                </li>
                <li>
                  Verify AI-generated responses before applying them in
                  operational contexts
                </li>
                <li>
                  Not exceed the query limits specified in your subscription
                  plan
                </li>
                <li>
                  Comply with all applicable laws and regulations in your use of
                  the Service
                </li>
                <li>
                  Report any unauthorized access or security concerns promptly
                </li>
              </ul>
            </section>

            {/* Acceptable Use */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                4. Acceptable Use Policy
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                You may not use FieldOps AI to:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  Upload documents containing malware, viruses, or malicious
                  code
                </li>
                <li>
                  Upload documents that infringe on intellectual property rights
                  of third parties
                </li>
                <li>
                  Attempt to reverse engineer, decompile, or extract the AI
                  models or algorithms
                </li>
                <li>
                  Abuse the service through excessive automated queries or
                  denial-of-service attacks
                </li>
                <li>Exceed burst protection limits (50 queries per hour)</li>
                <li>
                  Share access credentials or allow unauthorized access to your
                  account
                </li>
                <li>
                  Use the Service for any illegal, harmful, or fraudulent
                  purpose
                </li>
                <li>
                  Resell or redistribute the Service without explicit written
                  permission
                </li>
              </ul>
            </section>

            {/* Subscription and Payment */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                5. Subscription and Payment Terms
              </h2>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                5.1 Subscription Plans
              </h3>
              <p className="text-industrial-600 leading-relaxed mb-4">
                FieldOps AI offers multiple subscription tiers with different
                features and usage limits. Current plans and pricing are
                available on our website.
              </p>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                5.2 Token-Based Quota System
              </h3>
              <p className="text-industrial-600 leading-relaxed mb-4">
                The Service uses a token-based quota system. Tokens are consumed
                based on the length and complexity of queries and responses. You
                are responsible for monitoring your usage through the dashboard.
              </p>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                5.3 Payment
              </h3>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  Subscriptions are billed monthly in advance unless otherwise
                  agreed
                </li>
                <li>All fees are non-refundable unless otherwise specified</li>
                <li>
                  We reserve the right to modify pricing with 30 days&apos;
                  notice
                </li>
                <li>
                  Failure to pay may result in service suspension or termination
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                5.4 Free Trial
              </h3>
              <p className="text-industrial-600 leading-relaxed">
                New users may be eligible for a free trial period. The trial
                includes limited features and usage quotas. At the end of the
                trial, you must subscribe to continue using the Service.
              </p>
            </section>

            {/* AI Disclaimer Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                6. AI-Generated Content Disclaimer
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                FieldOps AI uses artificial intelligence to generate responses
                based on your uploaded technical documentation. You acknowledge
                and agree that:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  AI responses are generated algorithmically and may contain
                  errors, inaccuracies, or incomplete information
                </li>
                <li>
                  AI responses do not replace professional judgment, expertise,
                  or official manufacturer guidance
                </li>
                <li>
                  You are solely responsible for verifying all information
                  before operational use
                </li>
                <li>
                  AI responses should not be used as the sole basis for
                  safety-critical decisions
                </li>
                <li>
                  We do not guarantee the accuracy, completeness, or timeliness
                  of AI-generated content
                </li>
                <li>
                  You should always consult original documentation and qualified
                  professionals when in doubt
                </li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                7. Intellectual Property
              </h2>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                7.1 Your Content
              </h3>
              <p className="text-industrial-600 leading-relaxed mb-4">
                You retain all ownership rights to the documents you upload. By
                uploading documents, you grant us a limited license to process,
                store, and analyze them for the purpose of providing the
                Service.
              </p>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                7.2 Our Service
              </h3>
              <p className="text-industrial-600 leading-relaxed">
                FieldOps AI, including its software, algorithms, user interface,
                and documentation, is owned by us and protected by intellectual
                property laws. You may not copy, modify, or distribute any part
                of the Service without our written permission.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                  AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND
                </li>
                <li>
                  WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
                  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT
                </li>
                <li>
                  WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES
                </li>
                <li>
                  OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN
                  THE TWELVE MONTHS PRECEDING THE CLAIM
                </li>
                <li>
                  WE ARE NOT RESPONSIBLE FOR ANY DECISIONS MADE OR ACTIONS TAKEN
                  BASED ON AI-GENERATED RESPONSES
                </li>
              </ul>
            </section>

            {/* Indemnification */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                9. Indemnification
              </h2>
              <p className="text-industrial-600 leading-relaxed">
                You agree to indemnify, defend, and hold harmless FieldOps AI
                and its officers, directors, employees, and agents from any
                claims, damages, losses, liabilities, and expenses (including
                legal fees) arising from your use of the Service, violation of
                these Terms, or infringement of any third-party rights.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                10. Termination
              </h2>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                10.1 Termination by You
              </h3>
              <p className="text-industrial-600 leading-relaxed mb-4">
                You may terminate your account at any time through the dashboard
                or by contacting support. Termination does not entitle you to
                refunds of prepaid fees.
              </p>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                10.2 Termination by Us
              </h3>
              <p className="text-industrial-600 leading-relaxed mb-4">
                We may suspend or terminate your access to the Service
                immediately, without prior notice, if you:
              </p>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>Breach these Terms</li>
                <li>Fail to pay fees when due</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Abuse the Service or its infrastructure</li>
              </ul>

              <h3 className="text-xl font-semibold text-industrial-800 mt-6 mb-3">
                10.3 Effect of Termination
              </h3>
              <p className="text-industrial-600 leading-relaxed">
                Upon termination, your right to use the Service ceases
                immediately. We may delete your data in accordance with our data
                retention policy. You may request export of your data before
                termination.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-industrial-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will
                provide notice of significant changes via email or through the
                Service. Your continued use of the Service after changes
                constitutes acceptance of the modified Terms. If you do not
                agree to the changes, you must stop using the Service.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                12. Governing Law and Disputes
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance
                with applicable laws. Any disputes arising from these Terms or
                your use of the Service shall be resolved through binding
                arbitration, except where prohibited by law.
              </p>
            </section>

            {/* Miscellaneous */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                13. Miscellaneous
              </h2>
              <ul className="list-disc pl-6 text-industrial-600 space-y-2">
                <li>
                  <strong>Entire Agreement:</strong> These Terms constitute the
                  entire agreement between you and FieldOps AI regarding the
                  Service
                </li>
                <li>
                  <strong>Severability:</strong> If any provision is found
                  invalid, the remaining provisions remain in effect
                </li>
                <li>
                  <strong>Waiver:</strong> Failure to enforce any right does not
                  constitute a waiver of that right
                </li>
                <li>
                  <strong>Assignment:</strong> You may not assign these Terms
                  without our consent
                </li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-industrial-900 mb-4">
                14. Contact Us
              </h2>
              <p className="text-industrial-600 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="bg-industrial-50 p-6 rounded-lg">
                <p className="text-industrial-700 font-medium">FieldOps AI</p>
                <p className="text-industrial-600">Email: legal@fieldops.ai</p>
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
