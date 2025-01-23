/*
  # Supply Chain Database Schema

  1. New Tables
    - `warehouses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `created_at` (timestamp)
    
    - `inventory_items`
      - `id` (uuid, primary key)
      - `warehouse_id` (uuid, foreign key)
      - `item` (text)
      - `stock` (integer)
      - `buy_price` (decimal)
      - `sell_price` (decimal)
      - `month` (integer)
      - `market_condition` (text)
      - `created_at` (timestamp)
    
    - `market_sentiment`
      - `id` (uuid, primary key)
      - `item` (text)
      - `sentiment_score` (decimal)
      - `trend` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses(id),
  item text NOT NULL,
  stock integer NOT NULL,
  buy_price decimal NOT NULL,
  sell_price decimal NOT NULL,
  month integer NOT NULL,
  market_condition text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create market_sentiment table
CREATE TABLE IF NOT EXISTS market_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  sentiment_score decimal NOT NULL,
  trend text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to authenticated users"
  ON warehouses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON market_sentiment
  FOR SELECT
  TO authenticated
  USING (true);