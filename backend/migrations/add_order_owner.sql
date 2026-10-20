-- Record which authenticated user created each order.
-- Existing orders remain unowned and may still be managed by supervisors.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_by UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_created_by_fkey'
          AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(user_id)
        ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_orders_created_by
ON public.orders (created_by);