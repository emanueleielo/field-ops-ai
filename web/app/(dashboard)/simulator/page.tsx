"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Clock,
  Cpu,
  Search,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    responseTime?: number;
    toolsUsed?: string[];
    documentsReferenced?: string[];
  };
}

// Mock daily limit
const FREE_MESSAGES_PER_DAY = 10;

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const freeMessagesRemaining = FREE_MESSAGES_PER_DAY - freeMessagesUsed;
  const isOverFreeLimit = freeMessagesRemaining <= 0;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockResponses = [
        {
          content:
            "Per cambiare il filtro olio sul CAT 320: 1) Spegni motore e attendi 5 min. 2) Posiziona bacinella sotto filtro. 3) Svita filtro in senso antiorario. 4) Applica olio nuovo sulla guarnizione. 5) Avvita nuovo filtro a mano fino contatto, poi 3/4 giro.",
          tools: ["semantic_search", "get_document_section"],
          docs: ["CAT-320-Service-Manual.pdf"],
        },
        {
          content:
            "La pressione idraulica corretta per l'escavatore PC200 dovrebbe essere tra 320-350 bar per il circuito principale. Verificare con manometro a motore caldo (temp olio >50C). Se bassa, controllare pompa idraulica e valvola di sicurezza.",
          tools: ["semantic_search"],
          docs: ["Komatsu-PC200-Parts.pdf"],
        },
        {
          content:
            "Codice errore E02-34 indica problema sensore temperatura liquido raffreddamento. Controllare: 1) Connessione cablaggio sensore. 2) Resistenza sensore (2-3kOhm a 20C). 3) Livello liquido. 4) Termostato bloccato.",
          tools: ["keyword_search", "grep_documents"],
          docs: ["Hitachi-EX200-Troubleshooting.pdf"],
        },
      ];

      const mockResponse = mockResponses[messages.length % mockResponses.length];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: mockResponse.content,
        timestamp: new Date(),
        metadata: {
          model: "claude-3.5-haiku",
          responseTime: Math.random() * 2 + 1.5,
          toolsUsed: mockResponse.tools,
          documentsReferenced: mockResponse.docs,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFreeMessagesUsed((prev) => prev + 1);
      setIsLoading(false);
    }, 1500 + Math.random() * 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-industrial-900">
              Chat Simulator
            </h2>
            <p className="text-sm text-industrial-500">
              Test AI responses without using SMS
            </p>
          </div>

          {/* Free messages counter */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              isOverFreeLimit
                ? "bg-warning-100 text-warning-700 border border-warning-200"
                : "bg-industrial-100 text-industrial-700"
            )}
          >
            {isOverFreeLimit ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Using quota</span>
              </>
            ) : (
              <>
                <span className="font-mono font-bold">{freeMessagesRemaining}</span>
                <span>free messages left today</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="industrial-panel flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-industrial">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-xl bg-industrial-100 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-industrial-400" />
              </div>
              <h3 className="text-lg font-semibold text-industrial-900 mb-2">
                Start a Conversation
              </h3>
              <p className="text-industrial-500 max-w-md mb-4">
                Ask questions about your technical documentation. The AI will
                search your uploaded manuals and provide accurate answers.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How do I change the oil filter?",
                  "What's the hydraulic pressure spec?",
                  "Engine error code E02-34",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-sm bg-industrial-50 text-industrial-700 rounded-full hover:bg-industrial-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-industrial-900 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === "user"
                        ? "bg-industrial-900 text-white"
                        : "bg-industrial-50 text-industrial-900"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Metadata for assistant messages */}
                    {message.role === "assistant" && message.metadata && (
                      <div className="mt-3 pt-3 border-t border-industrial-200 space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {message.metadata.responseTime && (
                            <span className="flex items-center gap-1 text-industrial-500">
                              <Clock className="w-3 h-3" />
                              {message.metadata.responseTime.toFixed(1)}s
                            </span>
                          )}
                          {message.metadata.model && (
                            <span className="flex items-center gap-1 text-industrial-500">
                              <Cpu className="w-3 h-3" />
                              {message.metadata.model}
                            </span>
                          )}
                        </div>

                        {message.metadata.toolsUsed &&
                          message.metadata.toolsUsed.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.toolsUsed.map((tool) => (
                                <span
                                  key={tool}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-industrial-100 text-industrial-600"
                                >
                                  <Search className="w-3 h-3" />
                                  {tool.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          )}

                        {message.metadata.documentsReferenced &&
                          message.metadata.documentsReferenced.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.documentsReferenced.map((doc) => (
                                <span
                                  key={doc}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-success-50 text-success-700"
                                >
                                  <FileText className="w-3 h-3" />
                                  {doc}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                    <span
                      className={cn(
                        "text-xs mt-1 block",
                        message.role === "user"
                          ? "text-industrial-300"
                          : "text-industrial-400"
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-warning-500 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-industrial-900" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-industrial-900 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-industrial-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-industrial-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Searching documents...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Warning banner when over free limit */}
        {isOverFreeLimit && (
          <div className="mx-4 mb-2 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
            <p className="text-warning-700">
              You&apos;ve used all free messages for today. Additional messages will
              consume your monthly quota.
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-industrial-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your technical documentation..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
