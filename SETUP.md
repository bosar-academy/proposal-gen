# ProposalGen - Setup Guide

AI-powered proposal generation platform. Generate professional proposals from call transcripts or project descriptions, get them signed digitally, and collect payments via Stripe.

## What You Get

- AI proposal generation from call transcripts or project descriptions (Claude API)
- Structured section editor (edit any part of the proposal before sending)
- Beautiful public proposal page with your logo, team photos, and signature
- Digital signature collection
- Stripe payment checkout with invoicing (billing address + tax ID collection)
- Email delivery to clients (Resend)
- Universal services agreement (auto-included in every proposal)

## Prerequisites

- Node.js 22+
- A Supabase account (free tier works)
- A Stripe account
- An Anthropic API key (Claude)
- A Resend account + verified domain
- A Vercel account (for deployment)

## Step 1: Clone and Install

```bash
git clone <repo-url> proposal-gen
cd proposal-gen
npm install
```

## Step 2: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Go to **SQL Editor** and run the following migrations in order:

**Migration 1** - paste contents of `supabase/migrations/001_initial_schema.sql`

**Migration 2** - paste contents of `supabase/migrations/002_business_profiles.sql`

**Migration 3** - paste contents of `supabase/migrations/003_remove_auth_rls.sql`

3. Go to **Storage** and create a bucket called `profile-assets` (set it to **public**)

4. Copy your project credentials from **Settings > API**:
   - Project URL
   - Anon key (public)
   - Service role key (secret)

## Step 3: Set Up Stripe

1. Go to https://dashboard.stripe.com
2. Make sure you're in **Live mode** (toggle in top right)
3. Go to **Developers > API Keys** and copy:
   - Publishable key (`pk_live_...`)
   - Secret key (`sk_live_...`)

The webhook will be configured after deployment (Step 7).

## Step 4: Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Create an API key
3. Copy it (`sk-ant-...`)

## Step 5: Set Up Resend

1. Go to https://resend.com
2. Add and verify your domain (e.g., `yourdomain.com`) - follow the DNS instructions
3. Copy your API key
4. Decide your "from" email (e.g., `proposals@yourdomain.com`)

## Step 6: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Resend
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=proposals@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 7: Deploy to Vercel

```bash
# Link to Vercel
npx vercel link

# Set all environment variables
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add RESEND_API_KEY production
npx vercel env add RESEND_FROM_EMAIL production
npx vercel env add NEXT_PUBLIC_APP_URL production

# Deploy
npx vercel --prod
```

After deployment, note your Vercel URL (e.g., `https://your-app.vercel.app`).

Update `NEXT_PUBLIC_APP_URL` to match:
```bash
npx vercel env rm NEXT_PUBLIC_APP_URL production --yes
npx vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-app.vercel.app
npx vercel --prod
```

## Step 8: Configure Stripe Webhook

1. Go to Stripe Dashboard > **Developers > Webhooks**
2. Create a new endpoint:
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`
3. Copy the signing secret (`whsec_...`)
4. Update on Vercel:
```bash
npx vercel env rm STRIPE_WEBHOOK_SECRET production --yes
npx vercel env add STRIPE_WEBHOOK_SECRET production
# Enter: whsec_your-secret
npx vercel --prod
```

## Step 9: Set Up Your Business Profile

1. Go to `https://your-app.vercel.app/settings`
2. Fill in:
   - **Company logo** - upload your logo
   - **Team member photos** - upload founder/team headshots
   - **Team member names** - name and title (e.g., "John Smith, Founder & CEO")
   - **Company name** - your agency/business name
   - **Company description** - what your company does (used by AI in proposals)
   - **Years in business** - how long you've been operating
   - **Team description** - team background story (used in proposals)
   - **Key differentiators** - what makes you different
   - **Notable clients** - past clients or results
   - **Industries** - industries you serve
   - **Website** - your website URL
   - **Signature** - draw or type your signature (pre-filled in every proposal)

## You're Done!

Go to your dashboard and create your first proposal:

1. Click **Create Proposal**
2. Choose input mode: paste a call transcript or write a project description
3. Optionally set pricing and payment type
4. Click Generate - AI creates a structured proposal
5. Edit any section in the structured editor
6. Click **Publish & Copy Link** or **Send to Client**
7. Client receives the proposal, can sign digitally and pay via Stripe

## Payment Types

- **One-time** - client pays the full amount upfront
- **Deposit + Milestones** - client pays the first phase as deposit, remaining later
- **Subscription** - recurring monthly payment

## Customization

- **Proposal style/voice**: Edit `lib/anthropic.ts` - the `PROPOSAL_SYSTEM_PROMPT` controls how AI writes proposals
- **Services agreement**: Edit `lib/agreement.ts` - the static legal agreement included in every proposal
- **Visual design**: Edit `components/proposal/ProposalRenderer.tsx` - the public proposal layout
- **Signature block**: Edit the Execution section in `ProposalRenderer.tsx`

## Troubleshooting

- **Proposal generation fails**: Check your Anthropic API key and that you have credits
- **Stripe checkout shows wrong amount**: Make sure you wait for "Saved" to appear after editing prices
- **Emails not sending**: Verify your domain is confirmed in Resend (green checkmark)
- **Public proposal page blank**: The proposal might not have structured content - try generating a new one
- **Settings won't save**: Check Supabase Storage bucket `profile-assets` exists and is public
