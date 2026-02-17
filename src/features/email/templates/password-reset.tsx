import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  userName = "there",
  resetUrl = "http://localhost:3000/auth/reset",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your 305 Starter Kit password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Password Reset</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            We received a request to reset your password. Click the button below
            to choose a new password.
          </Text>
          <Section style={buttonSection}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>
          <Text style={smallText}>
            This link will expire in 1 hour. If you didn&apos;t request a
            password reset, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            305 Starter Kit — Ship faster, build smarter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

const main = {
  backgroundColor: "#0f172a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const heading = {
  color: "#e2b340",
  fontSize: "28px",
  fontWeight: "700" as const,
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#e2e8f0",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#e2b340",
  color: "#1a1a2e",
  padding: "12px 32px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  display: "inline-block",
};

const smallText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const hr = {
  borderColor: "#334155",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  margin: "0",
};
