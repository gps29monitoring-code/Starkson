-- Add unique constraint to prevent duplicate clients
-- A client is considered duplicate if plant, destination, and address are the same

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_clients_plant;
DROP INDEX IF EXISTS idx_clients_destination;

-- Add unique constraint on plant, destination, and address combination
ALTER TABLE public.clients
ADD CONSTRAINT unique_client_plant_destination_address
UNIQUE (plant, destination, address);

-- Recreate indexes for better performance
CREATE INDEX idx_clients_plant ON public.clients(plant);
CREATE INDEX idx_clients_destination ON public.clients(destination);
