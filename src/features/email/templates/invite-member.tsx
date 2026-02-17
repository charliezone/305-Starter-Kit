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

interface InviteMemberEmailProps {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}

export function InviteMemberEmail({
  inviterName = "Someone",
  organizationName = "Acme Corp",
  role = "member",
  inviteUrl = "http://localhost:3000/invite/abc123",
}: InviteMemberEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re Invited</Heading>
          <Text style={paragraph}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{organizationName}</strong> as a{" "}
            <span style={roleBadge}>{role}</span>.
          </Text>
          <Text style={paragraph}>
            Accept the invitation below to get started with your team.
          </Text>
          <Section style={buttonSection}>
            <Link href={inviteUrl} style={button}>
              Accept Invitation
            </Link>
          </Section>
          <Text style={smallText}>
            This invitation will expire in 7 days. If you weren&apos;t
            expecting this, you can safely ignore this email.
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

export default InviteMemberEmail;

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
  color: "#4dd4ac",
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

const roleBadge = {
  backgroundColor: "#1e293b",
  color: "#4dd4ac",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "600" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#4dd4ac",
  color: "#0f172a",
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
