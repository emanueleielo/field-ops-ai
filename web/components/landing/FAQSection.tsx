"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What file formats are supported?",
    answer:
      "FieldOps AI supports PDF, DOCX, DOC, TXT, MD, XLSX, CSV, and HTML files. All files must contain extractable text - scanned documents without OCR are not supported in the current version.",
  },
  {
    question: "How does the SMS system work?",
    answer:
      "After registering your phone number in the dashboard, simply send an SMS with your question to our service number. Our AI searches through your uploaded manuals and sends back a concise answer within seconds. Works anywhere you have GSM signal - no internet required on your phone.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is stored in EU-based servers (GDPR compliant). Your documents are encrypted at rest and in transit. We never share your data with third parties. You can request complete data deletion at any time.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from the billing page. If you cancel within the first 14 days, you get a full refund - no questions asked. After cancellation, you maintain access until the end of your billing period.",
  },
  {
    question: "What languages are supported?",
    answer:
      "FieldOps AI automatically detects the language of your question and responds in the same language. Currently supported: English (EN), German (DE), French (FR), Italian (IT), and Spanish (ES).",
  },
  {
    question: "How accurate are the AI responses?",
    answer:
      "Our AI achieves 95%+ accuracy on technical queries by searching directly in your uploaded documentation. Every response includes references to the source document and section. For critical operations, always verify with the original manual.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-industrial-200 last:border-b-0">
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-6 text-left group"
      >
        <span className="text-lg font-semibold text-industrial-900 pr-8 group-hover:text-industrial-700 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-industrial-500 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-6" : "max-h-0"
        )}
      >
        <p className="text-industrial-600 leading-relaxed pr-12">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-industrial-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-industrial-600">
            Everything you need to know about FieldOps AI
          </p>
        </div>

        {/* FAQ list */}
        <div className="bg-industrial-50 rounded-lg border border-industrial-200 px-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-industrial-600">
            Still have questions?{" "}
            <a
              href="mailto:support@fieldops.ai"
              className="text-industrial-900 font-semibold hover:underline"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
