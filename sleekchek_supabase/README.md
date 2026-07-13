# sleekchek — be confidential (Supabase edition)

This is the Flask backend migrated to **Supabase**. There's no separate
backend server to host anymore — Supabase provides the database, file
storage, and admin login. You only deploy the `frontend/` folder.

```
sleekchek_supabase/
├── frontend/               → deploy this whole folder to Netlify
│   ├── index.html, shop.html
│   ├── js/config.js        → EDIT THIS: Supabase URL + anon key
│   ├── admin/               → admin login + dashboard (product CRUD)
│   └── data/products.json  → fallback demo catalog if Supabase is unreachable
└── supabase_setup.sql      → run this once in Supabase's SQL Editor
```

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick a name,
   password (for the Postgres DB — you won't need it day-to-day), and region
   (pick one close to Bangladesh, e.g. Singapore).
2. Wait ~2 minutes for it to provision.

## 2. Run the SQL setup

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the entire contents of `supabase_setup.sql` from this folder and
   click **Run**. This creates:
   - a `products` table with public read access, admin-only write access
   - a `product-images` public Storage bucket for admin-uploaded photos

## 3. Create your admin login

Supabase Auth needs a real user record to log in as. Easiest path:

1. Go to **Authentication → Users → Add user → Create new user**.
2. Email: anything, e.g. `admin@sleekchek.admin` (doesn't need to be a real
   inbox — it's just an identifier). Password: choose a strong one.
3. Tick "Auto Confirm User" so it's active immediately.

On the admin login page, log in with the **username part before the `@`**
(e.g. `admin`) and your password — `admin.js` automatically appends
`@sleekchek.admin`. If you used a different domain, either match it or just
type the full email in the username field (it works too, since anything
containing `@` is used as-is).

## 4. Get your API keys

In Supabase: **Project Settings → API**. Copy:
- **Project URL** (e.g. `https://xxxxx.supabase.co`)
- **anon public** key (long string — safe to use in frontend code, it only
  has the permissions your RLS policies grant it)

Paste both into `frontend/js/config.js`:

```js
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

## 5. Push to GitHub

```bash
cd sleekchek_supabase
git init
git add .
git commit -m "Migrate sleekchek to Supabase"
git branch -M main
git remote add origin https://github.com/<your-username>/sleekchek.git
git push -u origin main
```

## 6. Deploy to Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project → GitHub** → pick the `sleekchek` repo.
2. **Base directory:** leave blank (repo root). **Publish directory:**
   `frontend`. No build command needed — it's static HTML/CSS/JS.
3. Deploy. Netlify gives you a URL like `https://sleekchek.netlify.app`.

(`frontend/netlify.toml` already configures clean URLs for `/shop` and
`/admin` and basic security headers — no changes needed.)

## 7. Test it

- Visit the live Netlify URL → shop page should load products from
  Supabase (empty at first — that's expected, the table starts empty and
  the site quietly falls back to the bundled demo catalog until you add
  real products).
- Visit `/admin` → log in with the admin user you created in step 3 → add
  a product with an image → it uploads to Supabase Storage and appears on
  the shop page within a few seconds.

---

## Notes

- **No CORS setup needed** — Supabase's client library handles this, unlike
  the old Flask `ALLOWED_ORIGINS` setting.
- **No ephemeral filesystem problem** — Supabase Storage is permanent,
  unlike the old Flask backend's local `/uploads` folder on Render/Railway
  free tiers, so uploaded product images survive redeploys.
- **WhatsApp checkout is unchanged** — still pure frontend, no backend
  involved (`frontend/js/cart.js` → `buildWhatsAppMessage()`).
- To change the WhatsApp/payment number, edit `WHATSAPP_NUMBER` in
  `frontend/js/config.js`.
- The old `backend/` (Flask) folder is no longer needed for deployment —
  keep it only if you want a local reference.

© sleekchek. All rights reserved.
