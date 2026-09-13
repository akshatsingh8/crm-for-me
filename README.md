# crm for me

A lightweight real-estate CRM for capturing property enquiries and keeping follow-ups organized. It is built with Next.js, TypeScript, and Supabase and is configured for Vercel deployment.

## Features

- Fixed, server-validated CRM login
- Real-estate lead directory and pipeline totals
- Buyer, renter, and seller requirements
- Property type, project, location, and budget tracking
- Lead source, temperature, status, and follow-up date
- Optional fields throughout the form; only name and phone are required
- Responsive dashboard for desktop and mobile
- Supabase Row Level Security with server-only database access

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Supabase Postgres and Data API
- Vercel-ready configuration

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide every value.

3. Apply [`supabase/migrations/20260913211511_create_clients.sql`](supabase/migrations/20260913211511_create_clients.sql) to your Supabase project.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and sign in using the values configured in `CRM_LOGIN_ID` and `CRM_LOGIN_PASSWORD`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase API key |
| `CRM_LOGIN_ID` | Fixed CRM login ID |
| `CRM_LOGIN_PASSWORD` | Fixed CRM login password |
| `CRM_SESSION_SECRET` | Long random value used to sign login sessions |
| `CRM_DB_ACCESS_TOKEN` | Private token sent only by server-side Supabase requests |

Never commit `.env.local`. It is excluded by `.gitignore`.

The SHA-256 hash of `CRM_DB_ACCESS_TOKEN` must match the hash in the migration's RLS policies. The current project owner's private token is already configured locally; copy that same value into Vercel without adding it to Git.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add all six environment variables above for the required Vercel environments.
3. Confirm that the Supabase migration has been applied.
4. Deploy. The included `vercel.json` selects Next.js, and no build-command override is needed.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Security model

The browser never receives `CRM_DB_ACCESS_TOKEN`. Reads and inserts happen in server-rendered code or Server Actions, while Supabase RLS accepts requests only when the private request header matches the SHA-256 hash stored in the database policy. Login sessions use an HTTP-only, HMAC-signed cookie.

This fixed-login model is intended for a small private CRM. For a multi-user product, replace it with Supabase Auth and user-owned RLS policies.
