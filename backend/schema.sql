-- Re-run manually after edits:
--   mysql -uroot -p fitportal < schema.sql

-- Orders are the top-level resource.
CREATE TABLE IF NOT EXISTS orders (
    order_id        INT AUTO_INCREMENT PRIMARY KEY,
    status          VARCHAR(50) NOT NULL DEFAULT 'draft', -- status values: draft, validated, processing, completed, invalid
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Items scoped to a single order. 
CREATE TABLE IF NOT EXISTS order_items (
    order_id        INT NOT NULL,
    ItemCode        VARCHAR(50) NOT NULL,
    ItemReference   VARCHAR(255) NOT NULL,
    Width           INT NOT NULL,
    Length          INT NOT NULL,
    Depth           INT NOT NULL,
    BoxGroup        VARCHAR(50) NULL,
    -- Note: no Weight field yet, need to be confirmed.
    PRIMARY KEY (order_id, ItemCode),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Box types are global reference data 
CREATE TABLE IF NOT EXISTS box_types (
    `Reference`     VARCHAR(50) PRIMARY KEY,
    Width           FLOAT NOT NULL,
    Length          FLOAT NOT NULL,
    Depth           FLOAT NOT NULL,
    MaxWeight       FLOAT NULL,
    BoxWeight       FLOAT NULL,
    Active          BOOLEAN NOT NULL DEFAULT TRUE,
    MaximumBoxes    INT NULL
);