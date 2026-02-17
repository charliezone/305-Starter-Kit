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

interface WelcomeEmailProps {
  userName: string;
  appUrl: string;
}

export function WelcomeEmail({
  userName = "there",
  appUrl = "http://localhost:3000",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to 305 Starter Kit — let&apos;s get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to 305 Starter Kit</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            Thanks for signing up! Your account is ready. Here&apos;s what you
            can do next:
          </Text>
          <Section style={bulletSection}>
            <Text style={listItem}>
              1. <strong>Create your organization</strong> — Set up your team
              workspace.
            </Text>
            <Text style={listItem}>
              2. <strong>Invite team members</strong> — Collaborate with your
              team.
            </Text>
            <Text style={listItem}>
              3. <strong>Try AI features</strong> — Chat with our built-in AI
              assistant.
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Link href={`${appUrl}/dashboard`} style={button}>
              Go to Dashboard
            </Link>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            305 Starter Kit — Ship faster, build smarter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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

const bulletSection = {
  margin: "24px 0",
  padding: "20px",
  backgroundColor: "#1e293b",
  borderRadius: "8px",
  border: "1px solid #334155",
};

const listItem = {
  color: "#e2e8f0",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
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

const hr = {
  borderColor: "#334155",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  margin: "0",
};
