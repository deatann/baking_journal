# Setup & deployment

This is a Next.js app. Database, auth, and photo storage run on Supabase;
OCR runs through Google Cloud Vision; hosting is on Vercel. All three have
free tiers that comfortably cover personal use (see the conversation this
came from for the sizing math).

## 1. Supabase

1. Create a project at supabase.com if you haven't already.
2. Open the SQL Editor (left sidebar) → New query → paste the contents of
   `supabase/schema.sql` → Run. This creates the `recipes`, `bakes`, and
   `ingredient_densities` tables, the two storage buckets, and the
   row-level-security rules that keep your data private to your account.
   (If you already ran an earlier version of this file, running it again
   is safe — it only adds what's missing.)
3. Turn off public sign-ups so nobody else can create an account:
   Authentication → Providers → Email → toggle "Allow new users to sign up"
   off.
4. Create your own account: Authentication → Users → Add user → enter your
   email and a password. Use "Auto Confirm User" so you don't need to click
   an email link.
5. Get your API keys: Project Settings → API → copy the **Project URL** and
   the **anon public** key. You'll paste these into `.env.local` (below)
   and later into Vercel.

## 2. Google Cloud Vision

You already created the API key. Keep it somewhere safe — you'll paste it
directly into Vercel's dashboard in step 4, not into any file that gets
committed to git.

## 3. Run it locally first

```bash
cp .env.local.example .env.local
# edit .env.local: paste the Supabase URL + anon key, and the Vision API key
npm install
npm run dev
```

Open http://localhost:3000, sign in with the user you created in step 1.4,
and try adding a recipe, scanning a screenshot, and logging a bake before
deploying — much faster to fix things here than after a deploy.

## 4. Deploy

1. Push this project to a new GitHub repository (create the repo on
   github.com first, then from this folder):
   ```bash
   git init
   git add .
   git commit -m "Initial baking journal"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
   `.env.local` is gitignored — it will not be pushed. Good, since it holds
   the Vision API key.
2. On vercel.com: "Add New" → "Project" → import that GitHub repo.
3. Before deploying, add the environment variables (Project Settings →
   Environment Variables, or the form shown during import):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_VISION_API_KEY`
4. Deploy. Vercel gives you a `.vercel.app` URL — that's your private
   baking journal.

## Notes

- Only the one Supabase user you created can sign in or see any data —
  there's no public sign-up flow in the app itself.
- Photos are resized to ~1600px/JPEG before upload specifically to stay
  well inside Supabase's 1GB free storage tier over years of use.
- The OCR parser (`lib/parseOcrText.ts`) is a heuristic, not magic — it
  guesses ingredient lines from a leading number/fraction and guesses steps
  from sentence length/punctuation. Always check the review screen before
  saving a scanned recipe.
- To add more users later (e.g. if you want your partner to have their own
  login), create another user the same way in Supabase Auth — the RLS
  rules already scope every row to `auth.uid()`, so a second user's data
  stays separate from yours automatically.
- Ingredient name and unit fields autocomplete as you type (a built-in list
  of common baking ingredients, plus every name you've already used across
  your own recipes) - no setup needed.
- "Import from text" (next to "Scan a recipe" on the Recipes page) lets you
  paste a recipe copied from Notion, a website, or anywhere else, and runs
  it through the same parser and review screen as Scan & Convert, minus the
  image/OCR step. Useful for migrating existing recipes in bulk, one paste
  at a time, and for any future recipe you get as text rather than a photo.
- Cup/metric conversion (`lib/density.ts`, `lib/convert.ts`) is shown on
  every ingredient in the scaling calculator. Liquids, butter, and
  granulated sugar use fairly reliable built-in estimates; flour, brown
  sugar, and anything else you scoop are marked as rough estimates because
  their real density depends on how you measure. Click "correct it" (or
  "weigh 1 cup and set it") on any ingredient to save your own measured
  value — it's remembered per ingredient name and reused across every
  recipe from then on.
