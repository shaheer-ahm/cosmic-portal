-- Cosmic Portal database schema

-- Orders
-- Orders are the top-level resource
CREATE TABLE IF NOT EXISTS orders (
    order_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status          VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- status values: draft, validated, processing, completed, invalid
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
-- Items scoped to a single order 
CREATE TABLE IF NOT EXISTS order_items (
    order_id        INT NOT NULL,
    "ItemCode"      VARCHAR(50) NOT NULL,
    "ItemReference" VARCHAR(255) NOT NULL,
    "Width"         INT NOT NULL,
    "Length"        INT NOT NULL,
    "Depth"         INT NOT NULL,
    "Weight"        DOUBLE PRECISION NOT NULL CHECK ("Weight" >= 0),
    "BoxGroup"      VARCHAR(50) NULL,
    "Quantity"      INT NULL,
    "KeepUpright"   BOOLEAN NULL,
    PRIMARY KEY (order_id, "ItemCode"),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Box types
-- Global reference data
CREATE TABLE IF NOT EXISTS box_types (
    "Reference"     VARCHAR(50) PRIMARY KEY,
    "Width"         FLOAT NOT NULL,
    "Length"        FLOAT NOT NULL,
    "Depth"         FLOAT NOT NULL,
    "MaxWeight"     FLOAT NULL,
    "BoxWeight"     FLOAT NULL,
    "Active"        BOOLEAN NOT NULL DEFAULT TRUE,
    "MaximumBoxes"  INT NULL
);

-- Order box type selection
-- Which box types are available for use when optimising a given order.
CREATE TABLE IF NOT EXISTS order_box_types (
    order_id        INT NOT NULL,
    "Reference"     VARCHAR(50) NOT NULL,
    PRIMARY KEY (order_id, "Reference"),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY ("Reference") REFERENCES box_types("Reference")
);

-- Order results
-- Stores the optimisation output for an order once the Cosmic Solver has
-- run. One row per order.
CREATE TABLE IF NOT EXISTS order_results (
    order_id        INT PRIMARY KEY,
    result_data     JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Profiles (roles)
CREATE TABLE IF NOT EXISTS profiles (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUPERVISOR')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a USER-role profile row whenever someone signs up via
-- Supabase Auth. 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, role)
    VALUES (NEW.id, 'USER');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTE: Row Level Security / policies omitted for now