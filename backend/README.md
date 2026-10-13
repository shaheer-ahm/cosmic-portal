# Cosmic Portal Backend

FastAPI + Supabase backend for Cosmic Portal. 
Authentication is handled by Supabase.

## Stack
- FastAPI
- SQLAlchemy
- Supabase
- Pydantic
- PyJWT

## Setup

1. **Create a Supabase project** at supabase.com

2. **Run `schema.sql`** in the Supabase SQL Editor

3. **Promote a user to SUPERVISOR manually** once they've signed up:
   ```sql
   UPDATE profiles
   SET role = 'SUPERVISOR' WHERE user_id = '<their-uuid>';
   ```

4. **Install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate        # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Configure environment**

   Create a `.env` file in this directory:

   ```
   DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_xxx
   SOLVER_URL=https://<fitsolver-host>
   ALLOWED_ORIGINS=http://localhost:5173
   ```

   | Variable | Used by | Where it comes from |
   |---|---|---|
   | `DATABASE_URL` | `app/database.py` | Supabase → Project Settings → Database (connection pooler) |
   | `SUPABASE_URL` | `app/auth.py`, `app/routers/auth.py` | Supabase → Project Settings → API. Used for authentication requests and ES256 public-key discovery. **No trailing slash** |
   | `SUPABASE_ANON_KEY` | `app/routers/auth.py` | Supabase → Project Settings → API (publishable/anon key) |
   | `SOLVER_URL` | `app/solver_client.py` | The FitSolver service base URL |
   | `ALLOWED_ORIGINS` | `app/main.py` | Comma-separated CORS origins. Must match the frontend origin **exactly** — `http://localhost:5173`, no trailing slash, or the browser blocks every request |

   Authentication tokens are verified using Supabase's public JWKS endpoint and the ES256 signing algorithm. The Supabase JWT secret is not required.

   `.env` is gitignored and must never be committed. Share values through a
   password manager, not the repository.

6. **Run the API**
   ```bash
   uvicorn app.main:app --reload
   ```

7. **Open the docs**
   http://localhost:8000/docs


## Project structure
```
schema.sql
app/
    main.py
    database.py
    models.py
    schemas.py
    auth.py
    routers/
        orders.py
        items.py
        box_types.py
```

## Current Endpoints
- `GET  /api/v1/health`
- `GET  /api/v1/orders` / `POST /api/v1/orders`
- `GET  /api/v1/orders/{order_id}` (includes nested `items`)
- `GET/POST/PUT/DELETE /api/v1/orders/{order_id}/items/{item_id}`
- `GET  /api/v1/box-types`
  
**Health**
- `GET  /api/v1/health`
  
**Orders**
- `GET  /api/v1/orders`
- `POST /api/v1/orders`
- `GET  /api/v1/orders/{order_id}`

**Items**
- `GET  /api/v1/orders/{order_id}/items`
- `POST /api/v1/orders/{order_id}/items`
- `GET  /api/v1/orders/{order_id}/items/{item_id}`
- `PUT  /api/v1/orders/{order_id}/items/{item_id}`
- `DELETE /api/v1/orders/{order_id}/items/{item_id}`

**Box types**
- `GET  /api/v1/box-types`
