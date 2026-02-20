# Support Playbook

Step-by-step workflows for providing expert support on the 305 Starter Kit.

---

## Table of Contents

1. [Support Workflow](#support-workflow)
2. [Common Support Scenarios](#common-support-scenarios)
3. [Debugging Workflows](#debugging-workflows)
4. [Customer Onboarding](#customer-onboarding)
5. [Customization Requests](#customization-requests)
6. [Emergency Procedures](#emergency-procedures)

---

## Support Workflow

### Initial Response Template

```
Hi [Customer Name],

Thanks for reaching out about [issue].

To help you quickly, I need a few details:

1. What were you trying to do?
2. What happened instead?
3. Any error messages? (screenshot or copy/paste)
4. Environment: Development (localhost) or Production?
5. Have you made any customizations to the code?

In the meantime, here are some quick checks:
- [ ] Run `npm install` to ensure dependencies are up to date
- [ ] Run `npm run db:push` to sync database schema
- [ ] Check `.env` file has all required variables
- [ ] Try `npm run build` to see if there are any errors

I'll get back to you within [timeframe] with a solution.

Best,
[Your Name]
```

### Triage Process

**Priority Levels:**

**P0 - Critical (respond within 1 hour)**
- Production down
- Payment processing broken
- Data loss
- Security vulnerability

**P1 - High (respond within 4 hours)**
- Feature completely broken
- Authentication not working
- Database errors

**P2 - Medium (respond within 24 hours)**
- Feature partially working
- UI issues
- Performance problems

**P3 - Low (respond within 48 hours)**
- Questions about usage
- Feature requests
- Documentation clarifications

---

## Common Support Scenarios

### Scenario 1: "I can't log in"

**Questions to ask:**
1. Are you getting an error message? What does it say?
2. Did you confirm your email?
3. Are you using the correct email/password?
4. Have you tried resetting your password?

**Debug steps:**

1. **Check if user exists:**
```sql
-- In Supabase SQL Editor
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'customer@example.com';
```

2. **Check email confirmation:**
- If `email_confirmed_at` is NULL → User hasn't confirmed email
- Solution: Resend confirmation from Supabase Dashboard

3. **Check for multiple accounts:**
```sql
SELECT email, COUNT(*) 
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

4. **Test login yourself:**
- Create test account with same email domain
- Try logging in
- Check browser console for errors

**Common fixes:**
- Resend confirmation email
- Reset password via Supabase Dashboard
- Check if email provider is blocking confirmation emails
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

---

### Scenario 2: "Stripe checkout isn't working"

**Questions to ask:**
1. What happens when you click "Subscribe"?
2. Are you redirected to Stripe?
3. Do you see an error message?
4. Are you using test mode or live mode?

**Debug steps:**

1. **Check Stripe keys:**
```bash
# Verify in .env
STRIPE_SECRET_KEY=sk_test_... (test) or sk_live_... (live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```

2. **Check Price IDs:**
```bash
# Verify prices exist in Stripe Dashboard
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_...
```

3. **Test checkout flow:**
- Click "Subscribe" button
- Check browser console for errors
- Check Network tab for failed requests
- Verify redirect to Stripe Checkout

4. **Check webhook:**
```bash
stripe listen --forward-to https://customer-domain.com/api/webhooks/stripe
# Try completing a test payment
# Check if webhook receives event
```

**Common fixes:**
- Wrong Price ID → Update in `.env` and redeploy
- Test/Live mode mismatch → Use matching keys
- Webhook not configured → Set up in Stripe Dashboard
- Missing metadata → Verify `org_id` in checkout session

---

### Scenario 3: "Database schema errors"

**Questions to ask:**
1. What's the exact error message?
2. Have you run `npm run db:push`?
3. Did you modify the schema?
4. Is this a fresh install or existing database?

**Debug steps:**

1. **Check schema is pushed:**
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should see: profiles, organizations, memberships, license_keys
```

2. **Check for schema drift:**
```bash
npm run db:generate
# Check if any migrations are created
# If yes, schema doesn't match database
```

3. **Verify DATABASE_URL:**
```bash
echo $DATABASE_URL
# Should be: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

4. **Test connection:**
```bash
npm run db:studio
# Should open Drizzle Studio
# If fails, connection issue
```

**Common fixes:**
- Run `npm run db:push` to sync schema
- Drop and recreate tables if corrupted
- Check DATABASE_URL format
- Verify Supabase project is active

---

### Scenario 4: "AI chat not working"

**Questions to ask:**
1. What happens when you send a message?
2. Do you see any error in the browser console?
3. Have you set OPENAI_API_KEY?
4. Are you getting rate limit errors?

**Debug steps:**

1. **Check API key:**
```bash
cat .env | grep OPENAI_API_KEY
# Should be: OPENAI_API_KEY=sk-proj-...
```

2. **Test API key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
# Should return list of models
```

3. **Check API route:**
```bash
# Test endpoint directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

4. **Check browser console:**
- Open DevTools → Console
- Send message
- Look for errors

**Common fixes:**
- Invalid API key → Get new key from OpenAI
- Rate limit → Wait or upgrade OpenAI plan
- Wrong model → Change to available model
- Network error → Check OpenAI status

---

### Scenario 5: "Emails not sending"

**Questions to ask:**
1. Have you set up Resend?
2. Is your domain verified?
3. Are emails going to spam?
4. What email are you trying to send?

**Debug steps:**

1. **Check Resend API key:**
```bash
cat .env | grep RESEND_API_KEY
# Should be: RESEND_API_KEY=re_...
```

2. **Check Resend logs:**
- Go to resend.com → Logs
- Find recent emails
- Check status (delivered, bounced, etc.)

3. **Test email sending:**
```tsx
// In a Server Action or API route
import { sendWelcomeEmail } from "@/features/email";

await sendWelcomeEmail("test@example.com", "Test User");
```

4. **Check domain verification:**
- Go to resend.com → Domains
- Verify domain status is "Verified"
- If not, add DNS records

**Common fixes:**
- Add Resend API key
- Verify domain in Resend
- Check spam folder
- Use verified sender address

---

## Debugging Workflows

### Workflow 1: Authentication Issue

```
1. Verify user exists in Supabase
   └─ No → User needs to sign up
   └─ Yes → Continue

2. Check email confirmation
   └─ Not confirmed → Resend confirmation
   └─ Confirmed → Continue

3. Test login with same credentials
   └─ Works → User error (wrong password)
   └─ Fails → Continue

4. Check browser console for errors
   └─ "Invalid credentials" → Password wrong
   └─ "Session missing" → Cookie issue
   └─ Other error → Investigate specific error

5. Check middleware logs
   └─ User object null → Session not created
   └─ Redirect loop → Middleware config issue

6. Verify environment variables
   └─ NEXT_PUBLIC_SUPABASE_URL correct?
   └─ NEXT_PUBLIC_SUPABASE_ANON_KEY correct?
```

### Workflow 2: Payment Issue

```
1. Verify Stripe keys are set
   └─ Missing → Add to .env
   └─ Present → Continue

2. Check test/live mode match
   └─ Mismatch → Use matching keys
   └─ Match → Continue

3. Test checkout creation
   └─ Error → Check Price IDs
   └─ Success → Continue

4. Complete test payment
   └─ Payment fails → Check test card
   └─ Payment succeeds → Continue

5. Check webhook received
   └─ Not received → Configure webhook
   └─ Received → Continue

6. Check database updated
   └─ Not updated → Check webhook handler
   └─ Updated → Issue resolved
```

### Workflow 3: Build Error

```
1. Read error message carefully
   └─ Module not found → npm install
   └─ Type error → Check types
   └─ Other → Continue

2. Try clean build
   └─ rm -rf .next && npm run build

3. Check TypeScript errors
   └─ npx tsc --noEmit

4. Verify all imports exist
   └─ grep -r "from '@/" src/

5. Check tsconfig.json paths
   └─ "@/*": ["./src/*"]

6. Restart TypeScript server
   └─ Cmd+Shift+P → Restart TS Server
```

---

## Customer Onboarding

### New Customer Checklist

**Send this checklist to new customers:**

```markdown
# 305 Starter Kit - Setup Checklist

Welcome! Follow these steps to get your SaaS up and running.

## 1. Initial Setup (15 minutes)

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`

## 2. Supabase Setup (10 minutes)

- [ ] Create project at supabase.com
- [ ] Copy project URL to `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy service role key to `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Get database URL from Settings → Database → Connection string (Direct)
- [ ] Add to `DATABASE_URL`
- [ ] Run `npm run db:push` to create tables

## 3. Stripe Setup (15 minutes)

- [ ] Create account at stripe.com
- [ ] Get API keys from Developers → API keys
- [ ] Add to `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Create 3 products with prices (Starter, Pro, Enterprise)
- [ ] Copy Price IDs to `NEXT_PUBLIC_STRIPE_PRICE_*`
- [ ] Set up webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## 4. OpenAI Setup (5 minutes)

- [ ] Create account at platform.openai.com
- [ ] Create API key
- [ ] Add to `OPENAI_API_KEY`

## 5. Optional: Email Setup (10 minutes)

- [ ] Create account at resend.com
- [ ] Get API key
- [ ] Add to `RESEND_API_KEY`
- [ ] Verify domain (for production)

## 6. Run & Test (10 minutes)

- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Sign up for an account
- [ ] Test login
- [ ] Test AI chat
- [ ] Test Stripe checkout (use test card: 4242 4242 4242 4242)

## 7. Deploy (15 minutes)

- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy
- [ ] Update Stripe webhook URL to production
- [ ] Update Supabase redirect URLs

Total time: ~1.5 hours

Need help? Email support@yourcompany.com
```

---

## Customization Requests

### Common Customization: Add New Field to User Profile

**Customer asks:** "How do I add a phone number field to user profiles?"

**Response:**

```markdown
Here's how to add a phone number field:

1. **Update schema** (`src/lib/db/schema/profiles.ts`):
```tsx
export const profiles = pgTable("profiles", {
  // ... existing fields
  phoneNumber: text("phone_number"), // Add this
});
```

2. **Push schema**:
```bash
npm run db:push
```

3. **Update Zod schema** (`src/lib/types/index.ts`):
```tsx
export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(), // Add this
});
```

4. **Update form** (`src/features/auth/components/profile-form.tsx` - create if needed):
```tsx
<Label htmlFor="phone">Phone Number</Label>
<Input
  id="phone"
  type="tel"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
/>
```

5. **Update Server Action** (already handles it via Zod schema):
```tsx
// No changes needed - updateProfile already accepts any fields in schema
await updateProfile({ phoneNumber: "+1234567890" });
```

That's it! The field is now available throughout the app.
```

### Common Customization: Add OAuth Provider

**Customer asks:** "How do I add Google sign-in?"

**Response:**

```markdown
Here's how to add Google OAuth:

1. **Enable in Supabase**:
   - Go to Authentication → Providers
   - Enable Google
   - Add OAuth credentials from Google Cloud Console
   - Save

2. **Add button to login form** (`src/features/auth/components/login-form.tsx`):
```tsx
const handleGoogleSignIn = async () => {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};

// In JSX:
<Button onClick={handleGoogleSignIn} variant="outline">
  <GoogleIcon className="mr-2" />
  Continue with Google
</Button>
```

3. **Add to signup form** (same code):
```tsx
// Copy the same button to signup-form.tsx
```

4. **Test**:
   - Click "Continue with Google"
   - Authorize app
   - Should redirect to /dashboard

That's it! Google sign-in is now working.
```

---

## Emergency Procedures

### Production Down

**Immediate actions:**

1. **Check status pages:**
   - Vercel: vercel-status.com
   - Supabase: status.supabase.com
   - Stripe: status.stripe.com
   - OpenAI: status.openai.com

2. **Check deployment logs:**
   - Vercel Dashboard → Deployments → Latest
   - Look for build errors or runtime errors

3. **Rollback if needed:**
   - Vercel Dashboard → Deployments → Previous working deployment → Promote to Production

4. **Check error logs:**
   - Vercel Dashboard → Logs
   - Filter by errors
   - Identify pattern

5. **Communicate:**
   - Update status page if you have one
   - Email affected customers
   - Post on social media if appropriate

### Data Loss

**Immediate actions:**

1. **Stop writes:**
   - Disable affected features
   - Put site in maintenance mode if needed

2. **Check backups:**
   - Supabase: Database → Backups
   - Restore from most recent backup

3. **Investigate cause:**
   - Check recent deployments
   - Check database logs
   - Check for malicious activity

4. **Document:**
   - What happened
   - What data was lost
   - How it was recovered
   - How to prevent in future

### Security Incident

**Immediate actions:**

1. **Assess severity:**
   - Is user data exposed?
   - Is system compromised?
   - Is attacker still active?

2. **Contain:**
   - Rotate all API keys
   - Force logout all users
   - Block suspicious IPs

3. **Investigate:**
   - Check access logs
   - Check database for unauthorized changes
   - Check for backdoors

4. **Notify:**
   - Affected users (if data exposed)
   - Authorities (if required by law)
   - Insurance (if applicable)

5. **Remediate:**
   - Patch vulnerability
   - Deploy fix
   - Monitor for recurrence

---

## Support Metrics to Track

1. **Response time** - Time from ticket creation to first response
2. **Resolution time** - Time from ticket creation to resolution
3. **Customer satisfaction** - Survey after ticket closed
4. **Common issues** - Track frequency of each issue type
5. **Escalations** - How many tickets need escalation

**Target SLAs:**
- P0: 1 hour response, 4 hour resolution
- P1: 4 hour response, 24 hour resolution
- P2: 24 hour response, 3 day resolution
- P3: 48 hour response, 1 week resolution

---

## Support Tools

**Recommended tools:**

1. **Ticketing:** Zendesk, Intercom, or plain email
2. **Monitoring:** Sentry for error tracking
3. **Logging:** Vercel logs or LogRocket
4. **Analytics:** PostHog or Mixpanel
5. **Status page:** Statuspage.io
6. **Documentation:** Notion or GitBook

---

## Escalation Path

**When to escalate:**

1. **Security issue** → Escalate immediately to senior engineer
2. **Data loss** → Escalate to database admin
3. **Payment issue affecting multiple customers** → Escalate to finance team
4. **Legal request** → Escalate to legal team
5. **Can't resolve in 2x SLA time** → Escalate to senior support

**Escalation template:**

```
ESCALATION NEEDED

Priority: [P0/P1/P2/P3]
Customer: [Name/Email]
Issue: [Brief description]
What I've tried: [List of debugging steps]
Current status: [Where we're stuck]
Impact: [How many customers affected]
Deadline: [When does this need to be resolved]

Ticket link: [URL]
```
