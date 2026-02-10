-- Fix Database Warnings
-- Run this in Supabase SQL Editor

-- 1. Fix Mutable Search Path in Functions
-- Security Best Practice: Set a fixed search_path for SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION generate_license_key() RETURNS text 
SET search_path = public
AS $$
DECLARE
  chars text[] := '{A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
  result text := 'RCAS-';
  i integer;
BEGIN
  -- Segment 1
  FOR i IN 1..4 LOOP
    result := result || chars[1+floor(random()*(array_length(chars, 1)-1))::int];
  END LOOP;
  result := result || '-';
  -- Segment 2
  FOR i IN 1..4 LOOP
    result := result || chars[1+floor(random()*(array_length(chars, 1)-1))::int];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_mock_payment(payment_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  new_payment_id bigint;
  new_key text;
  key_exists boolean;
BEGIN
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- A. Record Payment
  INSERT INTO "payments" (user_id, amount, status, provider_id)
  VALUES (user_id, payment_amount, 'completed', 'mock_provider_' || floor(random()*100000)::text)
  RETURNING id INTO new_payment_id;

  -- B. Generate Unique Key
  LOOP
    new_key := generate_license_key();
    SELECT EXISTS(SELECT 1 FROM "subscription_keys" WHERE key_code = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;

  -- C. Create Key (Linked to User but NOT claimed yet, or claimed? User asked "mile user ko")
  -- Let's auto-claim it for seamless UX, but return it so they see it.
  
  INSERT INTO "subscription_keys" (key_code, plan_type, status, claimed_by, claimed_at)
  VALUES (new_key, 'premium', 'used', user_id, now());

  RETURN json_build_object(
    'success', true, 
    'message', 'Payment successful! Key generated.',
    'key', new_key,
    'payment_id', new_payment_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION claim_subscription_key(input_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_record record;
  user_id uuid;
  user_email text;
BEGIN
  -- Get current user
  user_id := auth.uid();
  user_email := auth.jwt() ->> 'email';
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Find the key (must be active)
  SELECT * INTO key_record FROM "subscription_keys" 
  WHERE key_code = input_key AND status = 'active'
  FOR UPDATE; -- Lock the row to prevent double claiming

  IF key_record.id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Invalid or expired key');
  END IF;

  -- Mark as used
  UPDATE "subscription_keys"
  SET 
    status = 'used',
    claimed_by = user_id,
    claimed_at = now()
  WHERE id = key_record.id;

  RETURN json_build_object('success', true, 'message', 'Key activated successfully', 'plan', key_record.plan_type);
END;
$$;
