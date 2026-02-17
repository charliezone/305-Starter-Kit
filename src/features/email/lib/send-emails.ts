"use server";

import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "../templates/welcome";
import { PasswordResetEmail } from "../templates/password-reset";
import { InviteMemberEmail } from "../templates/invite-member";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendWelcomeEmail(to: string, userName: string) {
  return sendEmail({
    to,
    subject: "Welcome to 305 Starter Kit",
    react: WelcomeEmail({ userName, appUrl: APP_URL }),
  });
}

export async function sendPasswordResetEmail(to: string, userName: string, resetToken: string) {
  const resetUrl = `${APP_URL}/auth/reset?token=${resetToken}`;
  return sendEmail({
    to,
    subject: "Reset your password — 305 Starter Kit",
    react: PasswordResetEmail({ userName, resetUrl }),
  });
}

export async function sendInviteMemberEmail(
  to: string,
  inviterName: string,
  organizationName: string,
  role: string,
  inviteToken: string
) {
  const inviteUrl = `${APP_URL}/invite/${inviteToken}`;
  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${organizationName}`,
    react: InviteMemberEmail({ inviterName, organizationName, role, inviteUrl }),
  });
}
