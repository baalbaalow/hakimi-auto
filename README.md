# Hakimi Auto

Hakimi Auto is a Next.js 16.2.10 app for a TikTok creator publishing workspace. The app currently includes the public marketing pages, Supabase email/password authentication, protected app pages, and the initial Supabase database migration.

## Local Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app runs locally at:

```text
http://localhost:3000
```

## Required Environment Variables

Create `.env.local` for local development and configure the same variables in Vercel for Production and Preview deployments.

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Do not commit real environment variable values. `.env.local.example` contains safe placeholders only.

## Supabase Auth URL Configuration

In the Supabase Dashboard, open Authentication > URL Configuration.

For production, set:

```text
Site URL: https://your-production-domain
```

Add the auth callback URL to the redirect allow list:

```text
https://your-production-domain/auth/callback
```

For Vercel preview deployments, add either the exact preview callback URL you are testing or a safe wildcard pattern for your Vercel preview domain:

```text
https://your-preview-domain/auth/callback
https://*-your-vercel-team-or-account-slug.vercel.app/**
```

Local development should remain allowed while testing locally:

```text
http://localhost:3000/auth/callback
```

The signup flow builds `emailRedirectTo` from the current app origin, so production confirmation emails will return to `/auth/callback` on the deployed domain once Supabase allows that URL.

## Vercel Deployment

Vercel can deploy this Next.js app with the default framework settings.

Use these commands if Vercel asks for them:

```text
Install Command: npm install
Build Command: npm run build
Development Command: npm run dev
```

No custom output directory is required.

Before deploying, verify:

```bash
npm run lint
npm run build
```

## Deployment Steps

1. Push this project to a Git repository.
2. Import the repository in Vercel as a Next.js project.
3. Add the required environment variables in Vercel Project Settings > Environment Variables.
4. Deploy the project.
5. Copy the production deployment URL or custom domain.
6. Update Supabase Authentication > URL Configuration with the production Site URL and `/auth/callback` redirect URL.
7. Test signup, email confirmation, login, logout, and protected dashboard redirect behavior on the production URL.

Do not add TikTok OAuth, the TikTok Content Posting API, n8n, billing, or production automation until those phases are approved.
