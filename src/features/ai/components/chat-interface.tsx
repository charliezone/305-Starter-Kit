"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { Send, Loader2, Bot, User } from "lucide-react";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3">
              <Bot className="mx-auto h-12 w-12 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">
                IdeaLab Validator
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Describe your startup idea and I'll analyze market fit,
                competition, monetization, and feasibility.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 rounded-lg p-4",
              message.role === "user" ? "bg-muted/50" : "glass-panel",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                message.role === "user"
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary/20 text-secondary",
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
              {message.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null,
              )}
              {isLoading &&
                message.role === "assistant" &&
                message.parts.length === 0 && (
                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your startup idea..."
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50",
            )}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-4 py-2.5",
              "bg-primary text-primary-foreground font-medium text-sm",
              "hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              "glow-gold",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
