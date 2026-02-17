import { ChatInterface } from "@/features/ai";

export const metadata = {
  title: "AI Chat — 305 Starter Kit",
};

export default function AIChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Streaming proof-of-concept using the Vercel AI SDK.
        </p>
      </div>
      <div className="flex-1 glass-panel overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
