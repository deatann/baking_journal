# Setup & deployment

Next.js app. Supabase = database, auth, photo storage. Gemini = AI recipe reading. Vercel = hosting.
Full behaviour spec: `PRD-baking-journal.md`.

## 1. Supabase (one-time)

1. SQL Editor -> New query -> paste `supabase/schema.sql` -> Run.
   Already have a working database from the earlier single-user version? Run only
   `supabase/migration_shared_book.sql` instead. Both are safe to re-run.
2. Authentication -> Providers -> Email -> turn **off** "Allow new users to sign up".
3. Project Settings -> API -> copy **Project URL** and **anon public** key.
   Never use or paste the `service_role` key anywhere in this app.

## 2. Adding family accounts

Authentication -> Users -> **Add user** -> email + password, tick **Auto Confirm User**.
Repeat for each person (mom, sisters, brother). Give them their password yourself.

- A profile row is created automatically; display name defaults to the email prefix.
- Each person taps their circle (top-left on phone, top bar on desktop) -> **Edit profile & chibi**
  to set their name and upload their own chibi. No admin step.
- Your existing recipes and bakes stay owned by your account.

## Google sign-in (optional)

1. Google Cloud Console -> OAuth consent screen (External; scopes openid, email, profile; add family emails as Test users or publish).
2. Credentials -> Create OAuth client ID (Web). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Supabase -> Authentication -> Providers -> Google: paste Client ID + secret (the secret goes only here).
4. Supabase -> Authentication -> URL Configuration: Site URL = your Vercel URL; add redirect URLs `https://<your-app>.vercel.app/**` and `http://localhost:3000/**`.
5. Keep "Allow new users to sign up" off. Only Google emails that match an account you created can sign in. Test once with an unregistered Google account; it should be rejected.

## 3. Environment variables

`.env.local` (local) and Vercel -> Project Settings -> Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (server-side only)

After changing Vercel variables, redeploy.

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Deploy

Push to GitHub (`git add . && git commit -m "..." && git push`). Vercel redeploys automatically.

## 6. Install on a phone (PWA)

- iPhone: open the site in Safari -> Share -> Add to Home Screen.
- Android: Chrome menu -> Install app / Add to Home screen.

No offline mode in this version; it needs a connection.

## Rules to remember

- Everyone can read all recipes and bakes. Only the owner can edit or delete their own (enforced in the database).
- Ingredient density corrections are private to each user.
- Chibis are stored in a public bucket (anyone with the image URL can view it).
- AI scanning shares one Gemini free-tier quota across all five people.
- The local fallback parser (used if AI fails) does not extract bake time or temperature.
