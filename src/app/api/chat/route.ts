import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { generateChatStream } from "@/features/ai/lib/actions";
import { createClient } from "@/lib/supabase/server";

function convertToModelMessages(uiMessages: UIMessage[]) {
  return uiMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content:
      msg.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? "",
  }));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const modelMessages = convertToModelMessages(messages);

  const result = await generateChatStream(modelMessages);

  return createUIMessageStreamResponse({
    status: 200,
    stream: result.toUIMessageStream(),
  });
}
