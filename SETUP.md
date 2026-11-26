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

## Keeping the free Supabase project awake

`vercel.json` runs `/api/keepalive` once a day (09:00 UTC) on Vercel, which runs one small database query so the
project is not paused for inactivity. Nothing to set up. Check it under Vercel -> project -> Settings -> Cron Jobs.
Optional: add a `CRON_SECRET` environment variable in Vercel to reject calls that did not come from Vercel's cron.

## Rules to remember

- Everyone can read all recipes and bakes. Only the owner can edit or delete their own (enforced in the database).
- Ingredient density corrections are private to each user.
- Chibis are stored in a public bucket (anyone with the image URL can view it).
- AI scanning shares one Gemini free-tier quota across all five people.
- The local fallback parser (used if AI fails) does not extract bake time or temperature.

## Guest mode (public view) and cover photos

The front page is now a read-only guest view. Family members sign in with "Family sign in" (chibi menu, or the button on desktop).

1. **Before deploying**, run `supabase/migration_guest_mode.sql` in the Supabase SQL editor (after `migration_shared_book.sql`). It adds `is_public` / `cover_path` columns, the signed-out read rules, and the public `recipe-covers` bucket. Deploying the new code first makes recipe saves fail because the columns don't exist yet.
2. Everything is private by default. Owners switch on "Share on the guest page" per recipe (recipe form) and per bake (Log bake form, or the ⋯ menu on a journal card).
3. Guests never see: the original recipe screenshots, private recipes/bakes, or anything behind sign-in (/recipes/new, /import, /scan, /journal/new).
4. Search engines: public recipes and /about are indexable (see /sitemap.xml). The journal is marked noindex.
5. Optional: set `NEXT_PUBLIC_SITE_URL` in Vercel if the production URL changes (used by the sitemap).
6. Cover photos are public by design (random file names). Removing a cover from a recipe does not delete the old file from storage.

## Sections for ingredients and steps (optional)

Complex bakes can split ingredients and steps into components ("Cake", "Frosting"). In the recipe form use "+ Add section" under ingredients or steps, then tap where the section should start. Recipes without sections look the same as before. No SQL migration: an ingredient stores an optional `section` label, and a step written as `## Name` is a heading. The AI parser and the local parser both try to detect sections when importing; check them on the review screen.

## Cropping photos (optional)

Cover photos and bake photos upload as before. Each has an optional "Crop" button that opens a fixed-frame crop screen (4:3 for covers, 3:4 for bake photos). Cropping uploads a new file and replaces the old one in the form. Bake photos can be cropped while logging a bake. Run `npm install` after pulling (adds `react-easy-crop`).
