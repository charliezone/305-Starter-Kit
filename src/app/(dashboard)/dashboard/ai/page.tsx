import { ChatInterface } from "@/features/ai";

export const metadata = {
  title: "Validate Idea — IdeaLab",
};

export default function AIChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Validate Your Idea
        </h1>
        <p className="text-sm text-muted-foreground">
          Describe your startup idea and get instant AI-powered analysis.
        </p>
      </div>
      <div className="flex-1 glass-panel overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
