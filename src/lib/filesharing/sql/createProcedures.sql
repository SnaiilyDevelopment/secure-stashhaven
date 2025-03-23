
-- Get file recipients procedure
CREATE OR REPLACE FUNCTION get_file_recipients(file_path_param TEXT, owner_id_param UUID)
RETURNS TABLE (
  share_id UUID,
  recipient_email TEXT,
  permissions TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id AS share_id,
    p.email AS recipient_email,
    fs.permissions,
    fs.created_at
  FROM 
    file_shares fs
  JOIN 
    profiles p ON fs.recipient_id = p.id
  WHERE 
    fs.file_path = file_path_param
    AND fs.owner_id = owner_id_param;
END;
$$ LANGUAGE plpgsql;

-- Remove file access procedure
CREATE OR REPLACE FUNCTION remove_file_access(share_id_param UUID, owner_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  DELETE FROM file_shares
  WHERE id = share_id_param AND owner_id = owner_id_param;
  
  IF FOUND THEN
    success := TRUE;
  ELSE
    success := FALSE;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Get files shared with me procedure
CREATE OR REPLACE FUNCTION get_files_shared_with_me(recipient_id_param UUID)
RETURNS TABLE (
  share_id UUID,
  file_path TEXT,
  original_name TEXT,
  original_type TEXT,
  size BIGINT,
  permissions TEXT,
  created_at TIMESTAMPTZ,
  owner_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id AS share_id,
    fs.file_path,
    fm.original_name,
    fm.original_type,
    fm.size,
    fs.permissions,
    fs.created_at,
    p.email AS owner_email
  FROM 
    file_shares fs
  JOIN 
    file_metadata fm ON fs.file_path = fm.file_path
  JOIN 
    profiles p ON fs.owner_id = p.id
  WHERE 
    fs.recipient_id = recipient_id_param;
END;
$$ LANGUAGE plpgsql;

-- Share file with user procedure
CREATE OR REPLACE FUNCTION share_file_with_user(
  file_path_param TEXT,
  recipient_email_param TEXT,
  permissions_param TEXT
)
RETURNS TABLE (
  share_id UUID
) AS $$
DECLARE
  v_recipient_id UUID;
  v_owner_id UUID := auth.uid();
  v_file_exists BOOLEAN;
  v_share_id UUID;
BEGIN
  -- Check if file exists
  SELECT EXISTS(SELECT 1 FROM file_metadata WHERE file_path = file_path_param) INTO v_file_exists;
  IF NOT v_file_exists THEN
    RAISE EXCEPTION 'file not found';
  END IF;
  
  -- Get recipient ID from email
  SELECT id INTO v_recipient_id FROM profiles WHERE email = recipient_email_param;
  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;
  
  -- Check if already shared
  SELECT id INTO v_share_id
  FROM file_shares
  WHERE file_path = file_path_param
    AND owner_id = v_owner_id
    AND recipient_id = v_recipient_id;
    
  IF v_share_id IS NOT NULL THEN
    -- Update existing share
    UPDATE file_shares
    SET permissions = permissions_param
    WHERE id = v_share_id;
    
    RETURN QUERY SELECT v_share_id;
  ELSE
    -- Create new share
    INSERT INTO file_shares (file_path, owner_id, recipient_id, permissions)
    VALUES (file_path_param, v_owner_id, v_recipient_id, permissions_param)
    RETURNING id INTO v_share_id;
    
    RETURN QUERY SELECT v_share_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
