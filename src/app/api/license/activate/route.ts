import { NextResponse } from "next/server";
import { activateLicenseKey } from "@/features/licensing";
import { z } from "zod";

const activateSchema = z.object({
  key: z.string().min(1, "License key is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await activateLicenseKey(parsed.data.key);
    return NextResponse.json(result, {
      status: result.valid ? 200 : 403,
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
