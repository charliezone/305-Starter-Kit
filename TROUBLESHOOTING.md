# Troubleshooting Guide

Common issues, their causes, and step-by-step solutions.

---

## Table of Contents

1. [Build & Compilation Errors](#build--compilation-errors)
2. [Authentication Issues](#authentication-issues)
3. [Database Issues](#database-issues)
4. [Stripe Integration Issues](#stripe-integration-issues)
5. [AI Feature Issues](#ai-feature-issues)
6. [Email Issues](#email-issues)
7. [Deployment Issues](#deployment-issues)
8. [Performance Issues](#performance-issues)

---

## Build & Compilation Errors

### Error: "Cannot find module '@/...' or its corresponding type declarations"

**Cause:** TypeScript can't resolve path alias or module doesn't exist

**Solutions:**

1. **Check tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. **Restart TypeScript server:**
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Or restart IDE

3. **Check file exists:**
```bash
ls -la src/features/auth/index.ts
```

4. **Verify barrel export:**
```tsx
// src/features/auth/index.ts should export the function
export { getCurrentUser } from "./lib/actions";
```

---

### Error: "Type 'X' is not assignable to type 'Y'"

**Cause:** Type mismatch between expected and actual types

**Common scenarios:**

**1. Drizzle schema types:**
```tsx
// ❌ Wrong
const profile: Profile = await db.select().from(profiles);

// ✅ Correct
const [profile] = await db.select().from(profiles);
// or
const profiles = await db.select().from(profiles); // Array<Profile>
```

**2. Async function in Server Component:**
```tsx
// ❌ Wrong
export default function Page() {
  const data = await fetchData(); // Error: 'await' only in async
}

// ✅ Correct
export default async function Page() {
  const data = await fetchData();
}
```

**3. Client component trying to accept server function:**
```tsx
// ❌ Wrong
"use client";
export function ClientComp({ serverAction }: { serverAction: () => Promise<void> }) {
  // Error: Functions cannot be passed to Client Components
}

// ✅ Correct - Import and call directly
"use client";
import { serverAction } from "@/features/auth";
export function ClientComp() {
  const handleClick = () => serverAction();
}
```

---

### Error: "You're importing a component that needs X. It only works in a Client Component"

**Cause:** Using client-only features in Server Component

**Solution:** Add `"use client"` directive

```tsx
"use client"; // Add this at the top

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Client-only features:**
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)
- `useRouter` from `next/navigation`

---

### Error: "Module not found: Can't resolve 'X'"

**Cause:** Package not installed

**Solution:**
```bash
npm install X
# or if it's a dev dependency
npm install -D X
```

**Common missing packages:**
```bash
npm install lucide-react        # Icons
npm install @react-email/components  # Email templates
npm install resend              # Email sending
```

---

## Authentication Issues

### User can't log in - "Invalid login credentials"

**Possible causes:**

**1. Wrong password:**
- User typed wrong password
- Password manager autofilled wrong credentials

**2. Email not confirmed:**
- Check Supabase Dashboard → Authentication → Users
- Look for "Email Confirmed" column
- If false, user needs to click confirmation link

**3. User doesn't exist:**
```sql
-- Check in Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'user@example.com';
```

**Solution:**
- Resend confirmation email: Supabase Dashboard → Users → Click user → "Send Magic Link"
- Or disable email confirmation: Supabase Dashboard → Authentication → Email Auth → Disable "Confirm email"

---

### User logged in but immediately redirected to login

**Cause:** Session not persisting or middleware rejecting

**Debug steps:**

**1. Check cookies in browser:**
- Open DevTools → Application → Cookies
- Look for `sb-<project-ref>-auth-token`
- If missing, cookies are being blocked

**2. Check middleware:**
```tsx
// src/middleware.ts
export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);
  const { supabase } = await updateSession(request);
  const { data: { user } } = await supabase.auth.getUser();
  console.log("User in middleware:", user?.email);
  // ...
}
```

**3. Verify middleware matcher:**
```tsx
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**4. Check Supabase URL:**
```bash
# .env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # Must be https://
```

**Solutions:**
- Clear cookies and try again
- Check if third-party cookies are blocked (Safari, Firefox strict mode)
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### OAuth redirect not working

**Cause:** Redirect URL not whitelisted in Supabase

**Solution:**

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
3. Save changes
4. Try OAuth again

---

### "Auth session missing" error in Server Component

**Cause:** Using browser client instead of server client

**Wrong:**
```tsx
import { createClient } from "@/lib/supabase/client"; // ❌ Browser client

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
}
```

**Correct:**
```tsx
import { createClient } from "@/lib/supabase/server"; // ✅ Server client

export default async function Page() {
  const supabase = await createClient(); // Note: await
  const { data: { user } } = await supabase.auth.getUser();
}
```

---

## Database Issues

### Error: "relation 'profiles' does not exist"

**Cause:** Database schema not pushed

**Solution:**
```bash
npm run db:push
```

**Verify schema exists:**
```sql
-- In Supabase SQL Editor
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
```

---

### Error: "null value in column 'X' violates not-null constraint"

**Cause:** Trying to insert row without required field

**Debug:**
```tsx
// Check your schema
export const profiles = pgTable("profiles", {
  userId: uuid("user_id").notNull(), // This field is required
  email: text("email").notNull(),    // This field is required
});

// Make sure you provide all notNull fields
await db.insert(profiles).values({
  userId: user.id,  // ✅ Provided
  email: user.email, // ✅ Provided
  fullName: "John",  // Optional, can be null
});
```

**Solution:** Provide all required fields or make field nullable in schema

---

### Query returns empty array instead of single object

**Cause:** Forgot to destructure result

**Wrong:**
```tsx
const profile = await db.select().from(profiles).where(eq(profiles.userId, userId));
console.log(profile.email); // ❌ Error: profile is array
```

**Correct:**
```tsx
const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
console.log(profile?.email); // ✅ Works
```

---

### Error: "operator does not exist: uuid = text"

**Cause:** Type mismatch in where clause

**Wrong:**
```tsx
where(eq(profiles.userId, "some-string")) // userId is uuid, comparing to text
```

**Correct:**
```tsx
where(eq(profiles.userId, userId)) // Both uuid
```

**Solution:** Ensure column type matches value type

---

### Drizzle Studio won't open

**Cause:** Port already in use or DATABASE_URL wrong

**Solutions:**

1. **Check DATABASE_URL:**
```bash
echo $DATABASE_URL
# Should be: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

2. **Try different port:**
```bash
npx drizzle-kit studio --port 4983
```

3. **Check if port is in use:**
```bash
lsof -i :4983
# Kill process if needed
kill -9 <PID>
```

---

## Stripe Integration Issues

### Webhook returns 400 "No signatures found matching the expected signature"

**Cause:** Wrong webhook secret or body not raw text

**Solutions:**

1. **Verify webhook secret:**
```bash
# Get from Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy whsec_... to .env as STRIPE_WEBHOOK_SECRET
```

2. **Check API route uses raw body:**
```tsx
// ✅ Correct
const body = await req.text(); // Raw text

// ❌ Wrong
const body = await req.json(); // Parsed JSON breaks signature
```

3. **Verify secret in .env:**
```bash
cat .env | grep STRIPE_WEBHOOK_SECRET
# Should be: STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### Subscription created but database not updated

**Debug steps:**

1. **Check webhook logs in Stripe Dashboard:**
   - Go to Developers → Webhooks → Click your endpoint
   - Check "Recent events" for errors

2. **Add logging to webhook handler:**
```tsx
export async function POST(req: Request) {
  console.log("Webhook received");
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  console.log("Event type:", event.type);
  console.log("Metadata:", event.data.object.metadata);
  
  // Check if org_id exists
  const orgId = event.data.object.metadata?.org_id;
  if (!orgId) {
    console.error("Missing org_id in metadata");
    return NextResponse.json({ error: "Missing org_id" }, { status: 400 });
  }
}
```

3. **Verify metadata in Checkout Session:**
```tsx
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: { org_id: org.id }, // ✅ Must include this
  subscription_data: {
    metadata: { org_id: org.id }, // ✅ And this
  },
});
```

---

### Customer Portal redirect fails

**Cause:** Customer ID not stored or invalid

**Debug:**
```tsx
export async function createPortalSession() {
  const org = await getOwnedOrganization(user.id);
  
  console.log("Org:", org);
  console.log("Customer ID:", org.stripeCustomerId);
  
  if (!org.stripeCustomerId) {
    return { success: false, error: "No Stripe customer found" };
  }
  
  // Verify customer exists in Stripe
  try {
    const customer = await stripe.customers.retrieve(org.stripeCustomerId);
    console.log("Customer:", customer);
  } catch (err) {
    console.error("Customer not found in Stripe:", err);
    return { success: false, error: "Invalid customer" };
  }
}
```

**Solution:** Ensure Customer ID is stored when creating checkout session

---

### Checkout redirects but subscription not active

**Possible causes:**

1. **Payment failed** - Check Stripe Dashboard → Payments
2. **Webhook not configured** - Set up webhook endpoint
3. **Test mode mismatch** - Using test key with live webhook or vice versa

**Solution:**
- Use test card: `4242 4242 4242 4242`
- Check webhook is listening: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook events include `checkout.session.completed`

---

## AI Feature Issues

### Error: "useChat is not a function"

**Cause:** Wrong import path

**Wrong:**
```tsx
import { useChat } from "ai"; // ❌
```

**Correct:**
```tsx
import { useChat } from "ai/react"; // ✅
```

---

### AI responses not streaming, appear all at once

**Cause:** API route not returning stream

**Wrong:**
```tsx
export async function POST(req: Request) {
  const result = await streamText({ model, messages });
  return NextResponse.json(result); // ❌ Returns JSON
}
```

**Correct:**
```tsx
export async function POST(req: Request) {
  const result = streamText({ model, messages }); // No await
  return result.toDataStreamResponse(); // ✅ Returns stream
}
```

---

### Error: "OpenAI API key not found"

**Cause:** `OPENAI_API_KEY` not set or wrong format

**Solution:**
```bash
# Check .env
cat .env | grep OPENAI_API_KEY

# Should be:
OPENAI_API_KEY=sk-proj-...

# Get from: https://platform.openai.com/api-keys
```

---

### Rate limit errors from OpenAI

**Cause:** Too many requests or quota exceeded

**Solutions:**

1. **Add rate limiting:**
```tsx
// Store request count in database
const requestCount = await getRequestCount(user.id, "today");
if (requestCount > 100) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

2. **Use cheaper model:**
```tsx
// Change from gpt-4 to gpt-3.5-turbo
const model = openai("gpt-3.5-turbo");
```

3. **Add retry logic:**
```tsx
try {
  const result = await streamText({ model, messages });
} catch (err) {
  if (err.status === 429) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return streamText({ model, messages });
  }
}
```

---

## Email Issues

### Emails not sending - "API key not found"

**Cause:** `RESEND_API_KEY` not set

**Solution:**
```bash
# Get API key from resend.com
# Add to .env:
RESEND_API_KEY=re_...
```

---

### Emails sent but not received

**Possible causes:**

1. **Domain not verified** - Resend requires domain verification for production
2. **Test mode** - Emails captured in Resend dashboard, not delivered
3. **Spam folder** - Check recipient's spam

**Solutions:**

1. **Verify domain:**
   - Go to resend.com → Domains → Add domain
   - Add DNS records (SPF, DKIM)
   - Wait for verification

2. **Check Resend logs:**
   - Go to resend.com → Logs
   - Find your email, check status

3. **Use verified sender:**
```tsx
// .env
EMAIL_FROM=Your App <noreply@yourdomain.com>
```

---

### Email template not rendering correctly

**Cause:** Missing React Email components or wrong styles

**Debug:**
```bash
# Preview template locally
npx react-email dev

# Open http://localhost:3000
# Select your template from sidebar
```

**Common issues:**

1. **Inline styles required:**
```tsx
// ❌ Wrong - Tailwind classes don't work in email
<div className="bg-blue-500">

// ✅ Correct - Use inline styles
<div style={{ backgroundColor: "#3b82f6" }}>
```

2. **Use React Email components:**
```tsx
import { Html, Body, Container, Text } from "@react-email/components";

// ✅ Use these instead of regular HTML
<Html>
  <Body>
    <Container>
      <Text>Hello</Text>
    </Container>
  </Body>
</Html>
```

---

## Deployment Issues

### Build fails on Vercel with "Module not found"

**Cause:** Missing dependency or wrong import

**Solutions:**

1. **Check package.json:**
```bash
npm install
npm run build  # Test locally first
```

2. **Verify all imports:**
```bash
# Find all imports
grep -r "from '@/" src/
```

3. **Check Vercel build logs:**
- Go to Vercel Dashboard → Deployments → Click failed build
- Read error message carefully

---

### Environment variables not working in production

**Cause:** Not set in Vercel dashboard

**Solution:**

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from `.env.example`
3. Redeploy

**Important:** `NEXT_PUBLIC_*` variables are embedded at build time. If you change them, you must redeploy.

---

### Database connection fails in production

**Cause:** Wrong DATABASE_URL or connection limit reached

**Solutions:**

1. **Use connection pooler:**
```bash
# Instead of direct connection:
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Use pooler (port 6543):
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres
```

2. **Check Supabase connection limit:**
   - Free tier: 60 connections
   - Upgrade plan if needed

---

### Middleware not running in production

**Cause:** Wrong matcher or Next.js version issue

**Solution:**

1. **Verify matcher:**
```tsx
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

2. **Check Next.js version:**
```bash
npm list next
# Should be 15.x or higher
```

3. **Add logging:**
```tsx
export async function middleware(request: NextRequest) {
  console.log("Middleware running:", request.nextUrl.pathname);
  // ...
}
```

---

## Performance Issues

### Page loads slowly

**Possible causes:**

1. **Too many database queries**
2. **Not using Server Components**
3. **Large client bundle**

**Solutions:**

**1. Optimize database queries:**
```tsx
// ❌ N+1 query problem
const users = await db.select().from(profiles);
for (const user of users) {
  const org = await db.select().from(organizations).where(eq(organizations.id, user.orgId));
}

// ✅ Use join
const results = await db
  .select()
  .from(profiles)
  .innerJoin(organizations, eq(profiles.orgId, organizations.id));
```

**2. Use Server Components:**
```tsx
// ✅ Server Component - no JS sent to client
export default async function Page() {
  const data = await db.select().from(profiles);
  return <div>{data.length} users</div>;
}

// ❌ Client Component - sends React + data to client
"use client";
export default function Page() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(setData);
  }, []);
  return <div>{data.length} users</div>;
}
```

**3. Analyze bundle:**
```bash
npm run build
# Check output for large bundles
```

---

### Database queries timing out

**Cause:** Missing index or complex query

**Solutions:**

1. **Add index:**
```sql
-- In Supabase SQL Editor
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_org_id ON memberships(organization_id);
```

2. **Use EXPLAIN:**
```sql
EXPLAIN ANALYZE
SELECT * FROM profiles
INNER JOIN memberships ON profiles.user_id = memberships.user_id
WHERE memberships.organization_id = 'xxx';
```

3. **Add pagination:**
```tsx
const results = await db
  .select()
  .from(profiles)
  .limit(20)
  .offset((page - 1) * 20);
```

---

## Quick Diagnostic Checklist

When something breaks, check these in order:

1. ✅ **Environment variables set?** `cat .env`
2. ✅ **Database schema pushed?** `npm run db:push`
3. ✅ **Dependencies installed?** `npm install`
4. ✅ **Build passes?** `npm run build`
5. ✅ **TypeScript errors?** Check IDE or run `npx tsc --noEmit`
6. ✅ **Console errors?** Open browser DevTools
7. ✅ **Server logs?** Check terminal running `npm run dev`
8. ✅ **Supabase status?** Check status.supabase.com
9. ✅ **Stripe webhooks?** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
10. ✅ **Clear cache?** Delete `.next` folder and rebuild

---

## Getting Help

If you're still stuck:

1. **Check error message carefully** - Often tells you exactly what's wrong
2. **Search GitHub Issues** - Someone may have had same problem
3. **Check documentation:**
   - Next.js: nextjs.org/docs
   - Drizzle: orm.drizzle.team
   - Supabase: supabase.com/docs
   - Stripe: stripe.com/docs
4. **Enable debug logging** - Add `console.log` statements
5. **Isolate the problem** - Create minimal reproduction
6. **Ask for help** - Provide error message, code snippet, and what you've tried
