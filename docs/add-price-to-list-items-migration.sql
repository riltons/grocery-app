-- Migration: add_price_to_list_items
-- Add price column to list_items table for persisting product prices

-- 1. Add price column to list_items table
ALTER TABLE list_items 
ADD COLUMN price DECIMAL(10,2) NULL;

-- 2. Add index for performance on price queries
CREATE INDEX IF NOT EXISTS idx_list_items_price 
ON list_items(price) 
WHERE price IS NOT NULL;

-- 3. Add comment to document the column
COMMENT ON COLUMN list_items.price IS 'Price of the item when marked as purchased';

-- 4. Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'list_items' 
AND column_name = 'price';

-- Expected result: price | numeric | YES