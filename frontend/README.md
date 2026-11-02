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

No GitHub token, npm registry login or organisation membership is needed. The
visualizer ships as a tarball committed to this repository.

## Setup

1. **Install dependencies**
   ```bash
   npm ci
   ```

2. **Configure environment**

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

3. **Start the backend first**

   See `../backend/README.md`. The frontend expects it on
   http://localhost:8000, and the backend's `ALLOWED_ORIGINS` must include
   this dev server's origin (`http://localhost:5173`, no trailing slash).

4. **Run**
   ```bash
   npm run dev
   ```
   http://localhost:5173

5. **Sign in**

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

## Deployment

The production frontend is deployed on Render:

https://cosmic-portal-frontend.onrender.com

Pushes to the 'main' branch run the GitHub Actions workflow in
`.github/workflows/ci.yml`. Render deploys the site only after the CI checks
pass successfully.

## The visualizer dependency

`@comp4050-fiv/visualizer` is vendored as an npm tarball committed to this
repository:

```json
"@comp4050-fiv/visualizer": "file:vendor/comp4050-fiv-visualizer-0.1.3.tgz"
```

Everyone — including a fresh clone and any CI job — gets the identical build
from `npm ci`, with no registry, no `.npmrc` and no credentials. Access to the
`Cosmic-Visualizer` repository is not required either.

### Taking a new version

The visualizer team publishes each release as a `.tgz` attached to a GitHub
Release (or hands one over directly). To upgrade:

```bash
rm vendor/comp4050-fiv-visualizer-0.1.3.tgz
cp ~/Downloads/comp4050-fiv-visualizer-0.2.0.tgz vendor/
npm install ./vendor/comp4050-fiv-visualizer-0.2.0.tgz
```

Commit the new tarball together with `package.json` and `package-lock.json`.
The version in the filename is what stops npm from reusing a cached copy of the
previous build, so never overwrite a tarball in place — always change the name.

Renovate cannot track a `file:` dependency, so visualizer bumps are manual and
deliberate; every other dependency still updates automatically.
