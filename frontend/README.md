# FitPortal Frontend (React)

React + Vite frontend for Cosmic Portal. Authentication is handled by Supabase;
packing results are rendered by the Cosmic Visualizer library.

## Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase JS client
- `@comp4050-fiv/visualizer` (3D packing view)

## Prerequisites
- Node.js >= 20.19
- Access to the `COMP4050-FiV` GitHub organisation

## Setup

1. **Authenticate to GitHub Packages** (one time per machine)

   The visualizer is published as a private package, so npm needs a token
   before it can install anything.

   Create a personal access token with the `read:packages` scope
   (GitHub → Settings → Developer settings → Tokens), then export it:

   ```bash
   export NODE_AUTH_TOKEN=ghp_your_token_here
   ```

   Add that line to your `~/.bashrc` or `~/.zshrc` so it persists.

   `.npmrc` in this directory already points the `@comp4050-fiv` scope at
   `https://npm.pkg.github.com` and reads the token from that variable — the
   token itself is never committed.

   If you skip this step, `npm install` fails with:
   ```
   npm error 403 Forbidden - GET https://npm.pkg.github.com/@comp4050-fiv%2fvisualizer
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Configure environment**

   Create a `.env` file in this directory:

   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

   | Variable | Where it comes from |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project Settings → API. **No trailing slash.** |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (publishable/anon key) |
   | `VITE_API_BASE_URL` | The FastAPI backend; routers are mounted under `/api/v1` |

   `.env` is gitignored and must never be committed. Vite reads it only at
   startup, so restart the dev server after changing it.

4. **Start the backend first**

   See `../backend/README.md`. The frontend expects it on
   http://localhost:8000, and the backend's `ALLOWED_ORIGINS` must include
   this dev server's origin (`http://localhost:5173`, no trailing slash).

5. **Run**
   ```bash
   npm run dev
   ```
   http://localhost:5173

6. **Sign in**

   There is no seeded test account. Use the **Sign up** tab on `/auth` to
   create one — password must be at least 8 characters and contain a number.
   If Supabase has email confirmation enabled, either confirm via the emailed
   link or disable it under Authentication → Sign In / Providers → Email.

   New users are assigned a role automatically by the `on_auth_user_created`
   trigger in `../backend/schema.sql`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck (`tsc --noEmit`) then production build |
| `npm run preview` | Serve the production build locally |

## The visualizer dependency

`@comp4050-fiv/visualizer` is consumed as a **versioned package**, pinned to an
exact version in `package.json`:

```json
"@comp4050-fiv/visualizer": "0.1.1"
```

It is not a git dependency, so you do **not** need access to the
`Cosmic-Visualizer` repository or an SSH key — only the packages token from
step 1.

Updates arrive as automated Renovate pull requests (see `../renovate.json`),
which merge themselves once CI passes. To pull a version in by hand:

```bash
npm install @comp4050-fiv/visualizer@0.2.0
```

To try in-progress work from the visualizer team before it is released:

```bash
npm install @comp4050-fiv/visualizer@next
```

Pin back to an exact version before merging — `next` is a moving target.
